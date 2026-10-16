import { query } from '../config/db.js';

export class DashboardService {
  /**
   * Get all live dashboard metrics directly from Neon PostgreSQL
   */
  static async getDashboardOverview() {
    // 1. KPI Cards: Appointments, Beds, Leads, Revenue, Claims, Footfall, Followups
    const [
      opdRes,
      bedsRes,
      leadsRes,
      billingRes,
      claimsRes,
      npsRes,
      recentAppointmentsRes,
      funnelRes,
      bedsByWardRes,
      footfallRes,
      followupsRes
    ] = await Promise.all([
      // OPD Today
      query(`
        SELECT 
          COUNT(*) as today_count,
          COUNT(CASE WHEN status IN ('Completed', 'In-Consultation', 'In consult', 'Checked in') THEN 1 END) as attended
        FROM appointments
        WHERE appointment_date = CURRENT_DATE
      `),

      // Beds Occupancy (occupied + critical)
      query(`
        SELECT 
          COUNT(*) as total_beds,
          COUNT(CASE WHEN LOWER(status) IN ('occupied', 'critical') THEN 1 END) as occupied_beds
        FROM beds
      `),

      // Leads metrics
      query(`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(CASE WHEN source ILIKE '%Ads%' OR source ILIKE '%Meta%' OR source ILIKE '%Facebook%' THEN 1 END) as ads_leads,
          COUNT(CASE WHEN LOWER(stage) IN ('wonlost', 'converted', 'admitted', 'completed') THEN 1 END) as converted_leads
        FROM leads
      `),

      // Revenue Today
      query(`
        SELECT 
          COALESCE(SUM(net_amount), 0) as today_revenue,
          COALESCE(SUM(paid_amount), 0) as paid_today
        FROM invoices
        WHERE bill_date::date = CURRENT_DATE
      `),

      // Pending TPA Claims
      query(`
        SELECT 
          COUNT(*) as pending_claims,
          COUNT(CASE WHEN created_at < NOW() - INTERVAL '15 days' THEN 1 END) as delayed_claims
        FROM tpa_claims
        WHERE status IN ('Submitted', 'Query Raised')
      `),

      // NPS & Detractor metrics
      query(`
        SELECT 
          COUNT(*) as total_reviews,
          COUNT(CASE WHEN category = 'Promoter' THEN 1 END) as promoters,
          COUNT(CASE WHEN category = 'Detractor' THEN 1 END) as detractors,
          COUNT(CASE WHEN status = 'Action Required' THEN 1 END) as action_required
        FROM patient_feedbacks
      `),

      // Today's Live Appointments List (strictly today)
      query(`
        SELECT 
          id,
          appointment_code,
          time_slot,
          patient_name,
          doctor_name,
          department,
          source,
          status
        FROM appointments
        WHERE appointment_date::date = CURRENT_DATE
        ORDER BY time_slot ASC, created_at DESC
        LIMIT 6
      `),

      // Real Lead Funnel Distribution
      query(`
        SELECT 
          COUNT(*) as total_enquiries,
          COUNT(CASE WHEN LOWER(stage) IN ('contacted', 'quote', 'visited', 'wonlost') THEN 1 END) as contacted,
          COUNT(CASE WHEN LOWER(stage) IN ('quote', 'visited', 'wonlost') THEN 1 END) as scheduled,
          COUNT(CASE WHEN LOWER(stage) IN ('visited', 'wonlost') THEN 1 END) as visited,
          COUNT(CASE WHEN LOWER(stage) IN ('wonlost') THEN 1 END) as converted
        FROM leads
      `),

      // Ward Bed Occupancy Breakdown
      query(`
        SELECT 
          w.name as ward_name,
          COUNT(b.id) as total_beds,
          COUNT(CASE WHEN LOWER(b.status) IN ('occupied', 'critical') THEN 1 END) as occupied_beds
        FROM wards w
        LEFT JOIN beds b ON w.id = b.ward_id
        GROUP BY w.id, w.name
        ORDER BY w.name ASC
      `),

      // 7-Day Footfall Trends
      query(`
        SELECT 
          TO_CHAR(d.day, 'Dy') as day_label,
          d.day::date as date_val,
          COUNT(a.id) as count
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') d(day)
        LEFT JOIN appointments a ON a.appointment_date::date = d.day::date
        GROUP BY d.day
        ORDER BY d.day ASC
      `),

      // Recent Invoices / Billing Feed
      query(`
        SELECT 
          id,
          invoice_number,
          patient_name,
          net_amount,
          paid_amount,
          status,
          bill_date
        FROM invoices
        ORDER BY bill_date DESC
        LIMIT 5
      `)
    ]);

    // Format Bed Occupancy
    const totalBeds = parseInt(bedsRes.rows[0]?.total_beds, 10) || 0;
    const occupiedBeds = parseInt(bedsRes.rows[0]?.occupied_beds, 10) || 0;
    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Format Leads & Conversion Rate
    const totalLeads = parseInt(leadsRes.rows[0]?.total_leads, 10) || 0;
    const convertedLeads = parseInt(leadsRes.rows[0]?.converted_leads, 10) || 0;
    const adsLeads = parseInt(leadsRes.rows[0]?.ads_leads, 10) || 0;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // Format Revenue (in INR Lakhs or standard currency)
    const todayRevenueVal = parseFloat(billingRes.rows[0]?.today_revenue) || 0;
    const todayRevenueDisplay = todayRevenueVal >= 100000 
      ? `₹${(todayRevenueVal / 100000).toFixed(1)}L` 
      : `₹${todayRevenueVal.toLocaleString('en-IN')}`;

    // Format NPS
    const totalNps = parseInt(npsRes.rows[0]?.total_reviews, 10) || 0;
    const promoters = parseInt(npsRes.rows[0]?.promoters, 10) || 0;
    const detractors = parseInt(npsRes.rows[0]?.detractors, 10) || 0;
    const npsScore = totalNps > 0 ? Math.round(((promoters - detractors) / totalNps) * 100) : 0;
    const npsDisplay = npsScore > 0 ? `+${npsScore}` : `${npsScore}`;

    // Format 7-Day Footfall
    const footfall = footfallRes.rows.map(r => ({
      day: r.day_label,
      count: parseInt(r.count, 10) || 0
    }));

    // Format Recent Billing Invoices Feed
    const recentInvoices = followupsRes.rows.map(row => {
      const amt = parseFloat(row.net_amount) || 0;
      const displayAmt = amt >= 100000 
        ? `₹${(amt / 100000).toFixed(2)}L` 
        : `₹${amt.toLocaleString('en-IN')}`;

      return {
        id: row.invoice_number || row.id,
        invoiceNumber: row.invoice_number,
        patientName: row.patient_name || 'Patient',
        amount: displayAmt,
        rawAmount: amt,
        status: row.status || 'Pending',
        timeAgo: 'Today'
      };
    });

    return {
      kpis: {
        todayOpd: parseInt(opdRes.rows[0]?.today_count, 10) || 0,
        opdAttended: parseInt(opdRes.rows[0]?.attended, 10) || 0,
        bedOccupancy: `${bedOccupancyRate}%`,
        bedOccupancyText: `${occupiedBeds} / ${totalBeds} beds`,
        newLeads: totalLeads,
        adsLeadsText: `${adsLeads} from ads & web`,
        leadConversion: `${conversionRate}%`,
        revenueToday: todayRevenueDisplay,
        pendingTpaClaims: parseInt(claimsRes.rows[0]?.pending_claims, 10) || 0,
        delayedTpaClaims: parseInt(claimsRes.rows[0]?.delayed_claims, 10) || 0,
        npsScore: npsDisplay,
        npsTotalReviews: totalNps,
        npsDetractors: detractors,
      },
      appointments: recentAppointmentsRes.rows.map(row => ({
        id: row.appointment_code || row.id,
        time: row.time_slot || '10:00 AM',
        patient: row.patient_name || 'Patient',
        doctor: row.doctor_name || 'Attending Doctor',
        dept: row.department || 'General Medicine',
        source: row.source || 'Walk-in',
        status: row.status || 'Scheduled'
      })),
      funnel: {
        enquiries: parseInt(funnelRes.rows[0]?.total_enquiries, 10) || 0,
        contacted: parseInt(funnelRes.rows[0]?.contacted, 10) || 0,
        scheduled: parseInt(funnelRes.rows[0]?.scheduled, 10) || 0,
        visited: parseInt(funnelRes.rows[0]?.visited, 10) || 0,
        converted: parseInt(funnelRes.rows[0]?.converted, 10) || 0,
      },
      wards: bedsByWardRes.rows.map(row => ({
        ward: row.ward_name,
        occupied: parseInt(row.occupied_beds, 10) || 0,
        total: Math.max(1, parseInt(row.total_beds, 10) || 10)
      })),
      footfall,
      recentInvoices
    };
  }
}
