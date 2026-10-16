import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class BillingService {
  /**
   * Get all invoices with search, status filtering, and pagination
   */
  static async getAllInvoices({ search = '', status = 'All', type = '', page = 1, limit = 50 } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        i.invoice_number ILIKE $${idx} OR
        i.patient_name ILIKE $${idx} OR
        i.uhid ILIKE $${idx} OR
        i.insurance ILIKE $${idx}
      )`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    if (status && status !== 'All') {
      if (status === 'Active Claims') {
        conditions.push(`i.status = 'Claim Pending'`);
      } else if (status === 'Settled & Dues') {
        conditions.push(`(i.status = 'Settled' OR i.status = 'Overdue')`);
      } else {
        conditions.push(`i.status = $${idx++}`);
        params.push(status);
      }
    }

    if (type && type !== 'All') {
      conditions.push(`i.bill_type = $${idx++}`);
      params.push(type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT count(*) FROM invoices i ${whereClause}`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const sql = `
      SELECT 
        i.*,
        c.id as claim_id,
        c.claim_code,
        c.policy_number,
        c.requested_amount,
        c.approved_amount,
        c.status as claim_status
      FROM invoices i
      LEFT JOIN tpa_claims c ON c.invoice_id = i.id
      ${whereClause}
      ORDER BY i.bill_date DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const res = await query(sql, params);

    return {
      invoices: res.rows.map(r => ({
        id: r.invoice_number,
        uuid: r.id,
        invoiceNumber: r.invoice_number,
        patient: r.patient_name,
        patientId: r.patient_id,
        uhid: r.uhid,
        type: r.bill_type,
        insurance: r.insurance,
        grossAmount: Number(r.gross_amount),
        discount: Number(r.discount),
        amount: Number(r.net_amount),
        paidAmount: Number(r.paid_amount),
        dueAmount: Number(r.due_amount),
        paymentMode: r.payment_mode,
        status: r.status,
        date: new Date(r.bill_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        rawDate: r.bill_date,
        claim: r.claim_id ? {
          id: r.claim_id,
          claimCode: r.claim_code,
          policyNumber: r.policy_number,
          requestedAmount: Number(r.requested_amount),
          approvedAmount: Number(r.approved_amount),
          status: r.claim_status,
        } : null
      })),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1
      }
    };
  }

  /**
   * Summary overview KPIs for Billing & TPA Desk
   */
  static async getSummary() {
    const sql = `
      SELECT
        COALESCE(SUM(net_amount), 0)::numeric as total_billed,
        COALESCE(SUM(paid_amount), 0)::numeric as total_collected,
        COALESCE(SUM(due_amount), 0)::numeric as total_outstanding,
        COUNT(CASE WHEN status = 'Estimate' THEN 1 END)::int as count_estimates,
        COUNT(CASE WHEN status = 'Pre-Auth' THEN 1 END)::int as count_preauth,
        COUNT(CASE WHEN status = 'Claim Pending' THEN 1 END)::int as count_claims_pending,
        COUNT(CASE WHEN status = 'Settled' THEN 1 END)::int as count_settled,
        COUNT(CASE WHEN status = 'Overdue' THEN 1 END)::int as count_overdue
      FROM invoices
    `;
    const res = await query(sql);
    const row = res.rows[0];

    return {
      totalBilled: Number(row.total_billed),
      totalCollected: Number(row.total_collected),
      totalOutstanding: Number(row.total_outstanding),
      countEstimates: row.count_estimates,
      countPreAuth: row.count_preauth,
      countClaimsPending: row.count_claims_pending,
      countSettled: row.count_settled,
      countOverdue: row.count_overdue,
    };
  }

  /**
   * Create a new Invoice or Cost Estimate
   */
  static async createInvoice({
    patientId,
    patientName,
    uhid,
    billType = 'OPD',
    insurance = 'Self Pay',
    grossAmount = 0,
    discount = 0,
    paidAmount = 0,
    paymentMode = 'Cash',
    status = 'Estimate',
    notes = '',
    policyNumber = '',
  }) {
    if (!patientName) {
      throw new AppError('Patient name is required', HTTP_STATUS.BAD_REQUEST);
    }

    const gross = Number(grossAmount) || 0;
    const disc = Number(discount) || 0;
    const net = Math.max(0, gross - disc);
    const paid = Number(paidAmount) || 0;
    const due = Math.max(0, net - paid);

    const invCode = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await query(
      `INSERT INTO invoices (
        invoice_number, patient_id, patient_name, uhid, bill_type, insurance,
        gross_amount, discount, net_amount, paid_amount, due_amount, payment_mode, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        invCode,
        patientId || null,
        patientName,
        uhid || null,
        billType,
        insurance,
        gross,
        disc,
        net,
        paid,
        due,
        paymentMode,
        status,
        notes
      ]
    );

    const invoice = res.rows[0];

    // If insurance is specified, automatically initiate TPA claim record
    if (insurance && insurance !== 'Self Pay') {
      const claimCode = `CLM-${Date.now().toString().slice(-6)}`;
      await query(
        `INSERT INTO tpa_claims (
          claim_code, invoice_id, patient_id, tpa_name, policy_number, requested_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          claimCode,
          invoice.id,
          patientId || null,
          insurance,
          policyNumber || 'Pending Policy Entry',
          net,
          status === 'Pre-Auth' ? 'Pre-Auth Approved' : 'Submitted'
        ]
      );
    }

    return invoice;
  }

  /**
   * Update invoice status (e.g. Settle bill, mark Pre-Auth, etc.)
   */
  static async updateInvoiceStatus(id, { status, paidAmount }) {
    const valid = ['Estimate', 'Pre-Auth', 'Claim Pending', 'Settled', 'Overdue'];
    if (!valid.includes(status)) {
      throw new AppError('Invalid invoice status', HTTP_STATUS.BAD_REQUEST);
    }

    let extraSet = '';
    const params = [status, id];

    if (paidAmount !== undefined) {
      params.push(Number(paidAmount));
      extraSet = `, paid_amount = $3, due_amount = GREATEST(0, net_amount - $3)`;
    } else if (status === 'Settled') {
      extraSet = `, paid_amount = net_amount, due_amount = 0`;
    }

    const res = await query(
      `UPDATE invoices SET status = $1 ${extraSet}, updated_at = NOW() WHERE id::text = $2 OR invoice_number = $2 RETURNING *`,
      params
    );

    if (res.rows.length === 0) {
      throw new AppError('Invoice not found', HTTP_STATUS.NOT_FOUND);
    }

    return res.rows[0];
  }
}
