import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class CampaignService {
  /**
   * Get all campaigns with search, status filtering, and sorting
   */
  static async getAllCampaigns({ search = '', status = 'All', platform = '' } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        c.name ILIKE $${idx} OR
        c.campaign_code ILIKE $${idx} OR
        c.platform ILIKE $${idx} OR
        c.department ILIKE $${idx}
      )`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    if (status && status !== 'All') {
      conditions.push(`c.status = $${idx++}`);
      params.push(status);
    }

    if (platform && platform !== 'All') {
      conditions.push(`c.platform = $${idx++}`);
      params.push(platform);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        c.*,
        CASE WHEN c.spend > 0 AND c.revenue_generated > 0 
             THEN ROUND((c.revenue_generated / c.spend)::numeric, 1) 
             ELSE 0 
        END as roi_multiplier
      FROM campaigns c
      ${whereClause}
      ORDER BY c.created_at DESC
    `;

    const res = await query(sql, params);

    return res.rows.map(r => ({
      id: r.campaign_code || r.id,
      uuid: r.id,
      campaignCode: r.campaign_code,
      name: r.name,
      platform: r.platform,
      department: r.department,
      status: r.status,
      budget: Number(r.budget),
      spend: Number(r.spend),
      leads: Number(r.leads_count),
      conversions: Number(r.conversions_count),
      revenue: Number(r.revenue_generated),
      roiMultiplier: Number(r.roi_multiplier || 0),
      startDate: r.start_date,
      endDate: r.end_date,
      notes: r.notes,
      createdAt: r.created_at,
    }));
  }

  /**
   * Get high-level summary KPIs (Total Spend, Total Leads, Conversions, Overall ROI)
   */
  static async getSummary() {
    const sql = `
      SELECT
        COALESCE(SUM(budget), 0)::numeric as total_budget,
        COALESCE(SUM(spend), 0)::numeric as total_spend,
        COALESCE(SUM(leads_count), 0)::int as total_leads,
        COALESCE(SUM(conversions_count), 0)::int as total_conversions,
        COALESCE(SUM(revenue_generated), 0)::numeric as total_revenue,
        COUNT(CASE WHEN status = 'Active' THEN 1 END)::int as active_campaigns,
        COUNT(CASE WHEN status = 'Paused' THEN 1 END)::int as paused_campaigns,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END)::int as completed_campaigns
      FROM campaigns
    `;
    const res = await query(sql);
    const row = res.rows[0];

    const spend = Number(row.total_spend) || 0;
    const revenue = Number(row.total_revenue) || 0;
    const overallRoi = spend > 0 && revenue > 0 ? `${(revenue / spend).toFixed(1)}x` : '0x';

    return {
      totalBudget: Number(row.total_budget),
      totalSpend: spend,
      totalLeads: Number(row.total_leads),
      totalConversions: Number(row.total_conversions),
      totalRevenue: revenue,
      overallRoi,
      activeCampaigns: Number(row.active_campaigns),
      pausedCampaigns: Number(row.paused_campaigns),
      completedCampaigns: Number(row.completed_campaigns),
    };
  }

  /**
   * Create a new marketing campaign
   */
  static async createCampaign({
    name,
    platform,
    department = 'General Medicine',
    budget = 0,
    spend = 0,
    status = 'Active',
    notes = '',
  }) {
    if (!name || !platform) {
      throw new AppError('Campaign name and platform are required', HTTP_STATUS.BAD_REQUEST);
    }

    const campaignCode = `C-${Math.floor(100 + Math.random() * 900)}`;

    const res = await query(
      `INSERT INTO campaigns (
        campaign_code, name, platform, department, status, budget, spend, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        campaignCode,
        name,
        platform,
        department,
        status,
        Number(budget) || 0,
        Number(spend) || 0,
        notes
      ]
    );

    return res.rows[0];
  }

  /**
   * Toggle or update status of a campaign ('Active', 'Paused', 'Completed')
   */
  static async updateStatus(id, status) {
    const valid = ['Active', 'Paused', 'Completed'];
    if (!valid.includes(status)) {
      throw new AppError('Invalid campaign status', HTTP_STATUS.BAD_REQUEST);
    }

    const res = await query(
      `UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id::text = $2 OR campaign_code = $2 RETURNING *`,
      [status, id]
    );

    if (res.rows.length === 0) {
      throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND);
    }

    return res.rows[0];
  }

  /**
   * Update campaign details (budget, spend, name)
   */
  static async updateCampaign(id, data) {
    const existing = await query('SELECT * FROM campaigns WHERE id::text = $1 OR campaign_code = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND);
    }
    const cur = existing.rows[0];

    const name = data.name !== undefined ? data.name : cur.name;
    const platform = data.platform !== undefined ? data.platform : cur.platform;
    const department = data.department !== undefined ? data.department : cur.department;
    const budget = data.budget !== undefined ? Number(data.budget) : cur.budget;
    const spend = data.spend !== undefined ? Number(data.spend) : cur.spend;
    const status = data.status !== undefined ? data.status : cur.status;

    const res = await query(
      `UPDATE campaigns SET 
        name = $1, platform = $2, department = $3, budget = $4, spend = $5, status = $6, updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, platform, department, budget, spend, status, cur.id]
    );

    return res.rows[0];
  }

  /**
   * Delete a campaign
   */
  static async deleteCampaign(id) {
    const res = await query('DELETE FROM campaigns WHERE id::text = $1 OR campaign_code = $1 RETURNING id', [id]);
    if (res.rows.length === 0) {
      throw new AppError('Campaign not found', HTTP_STATUS.NOT_FOUND);
    }
    return { success: true, message: 'Campaign deleted successfully' };
  }
}
