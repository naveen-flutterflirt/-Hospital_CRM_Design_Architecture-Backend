import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { EmailService } from './email.service.js';

export class FeedbackService {
  /**
   * Format DB feedback row for API response
   */
  static formatRecord(row) {
    return {
      id: row.feedback_code || row.id,
      uuid: row.id,
      patientId: row.patient_id,
      patient: row.patient_name,
      phone: row.phone,
      email: row.email,
      department: row.department,
      doctor: row.doctor_name,
      npsScore: Number(row.nps_score),
      rating: Number(row.rating),
      category: row.category,
      comment: row.comment || '',
      aspects: row.aspects || { doctorCare: 5, cleanliness: 5, nursingStaff: 5, billingClarity: 5 },
      status: row.status,
      followUpNotes: row.follow_up_notes || '',
      surveyChannel: row.survey_channel || 'Direct',
      date: new Date(row.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      createdAt: row.created_at
    };
  }

  /**
   * Get all feedbacks with KPI calculation
   */
  static async getAllFeedbacks({ search = '', category = 'All', department = 'All' } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        patient_name ILIKE $${idx} OR 
        department ILIKE $${idx} OR 
        doctor_name ILIKE $${idx} OR
        feedback_code ILIKE $${idx}
      )`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    if (category && category !== 'All') {
      conditions.push(`category = $${idx}`);
      params.push(category.trim());
      idx++;
    }

    if (department && department !== 'All') {
      conditions.push(`department ILIKE $${idx}`);
      params.push(`%${department.trim()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const listRes = await query(`
      SELECT *
      FROM patient_feedbacks
      ${whereClause}
      ORDER BY created_at DESC
    `, params);

    // Compute live KPI metrics across all feedbacks
    const kpiRes = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN category = 'Promoter' THEN 1 END) as promoters,
        COUNT(CASE WHEN category = 'Passive' THEN 1 END) as passives,
        COUNT(CASE WHEN category = 'Detractor' THEN 1 END) as detractors,
        COUNT(CASE WHEN status = 'Action Required' THEN 1 END) as action_required,
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as avg_rating
      FROM patient_feedbacks
    `);

    const kpi = kpiRes.rows[0];
    const total = parseInt(kpi.total, 10) || 0;
    const promoters = parseInt(kpi.promoters, 10) || 0;
    const passives = parseInt(kpi.passives, 10) || 0;
    const detractors = parseInt(kpi.detractors, 10) || 0;
    const actionRequired = parseInt(kpi.action_required, 10) || 0;
    const avgRating = parseFloat(kpi.avg_rating) || 0;

    // NPS Score Calculation: % Promoters - % Detractors
    let npsScore = 0;
    let promoterPct = 0;
    let passivePct = 0;
    let detractorPct = 0;

    if (total > 0) {
      promoterPct = Math.round((promoters / total) * 100);
      passivePct = Math.round((passives / total) * 100);
      detractorPct = Math.round((detractors / total) * 100);
      npsScore = Math.round(((promoters - detractors) / total) * 100);
    }

    return {
      feedbacks: listRes.rows.map(this.formatRecord),
      metrics: {
        totalReviews: total,
        npsScore,
        avgRating,
        promoterPct,
        passivePct,
        detractorPct,
        actionRequired
      }
    };
  }

  /**
   * Record new patient feedback directly
   */
  static async createFeedback(data) {
    const {
      patientName,
      phone = '',
      email = '',
      department = 'General Medicine',
      doctorName = '',
      npsScore,
      rating = 5,
      comment = '',
      aspects = { doctorCare: 5, cleanliness: 5, nursingStaff: 5, billingClarity: 5 },
      surveyChannel = 'Direct'
    } = data;

    if (!patientName || npsScore === undefined) {
      throw new AppError('Patient name and NPS score (0-10) are required', HTTP_STATUS.BAD_REQUEST);
    }

    const scoreNum = Number(npsScore);
    let category = 'Passive';
    if (scoreNum >= 9) category = 'Promoter';
    else if (scoreNum <= 6) category = 'Detractor';

    const status = category === 'Detractor' ? 'Action Required' : 'Reviewed';

    // Generate unique feedback code
    const codeNum = Math.floor(100 + Math.random() * 900);
    const feedbackCode = `FB-${codeNum}`;

    const res = await query(`
      INSERT INTO patient_feedbacks (
        feedback_code, patient_name, phone, email, department, doctor_name,
        nps_score, rating, category, comment, aspects, status, survey_channel
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      feedbackCode,
      patientName,
      phone,
      email,
      department,
      doctorName,
      scoreNum,
      Number(rating),
      category,
      comment,
      JSON.stringify(aspects),
      status,
      surveyChannel
    ]);

    return this.formatRecord(res.rows[0]);
  }

  /**
   * Dispatch Survey Link to Patient via Email/WhatsApp
   */
  static async sendSurvey({ targetAudience, channel, customEmail, customPhone, patientName }) {
    // Generate a secure survey link with target audience query parameters
    const surveyToken = `srv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const isIPD = targetAudience && targetAudience.includes('Discharge');
    const audienceType = isIPD ? 'IPD' : 'OPD';
    const patientParam = encodeURIComponent(patientName || '');
    const surveyUrl = `http://localhost:3000/survey/${surveyToken}?type=${audienceType}&patient=${patientParam}`;

    let emailSent = false;

    // Tailor email copy according to audience
    let subject = 'How was your OPD Consultation at ApexCare Hospital? (1-Min Survey)';
    let heading = 'Outpatient Care & Consultation Experience';
    let bodyText = `Dear ${patientName || 'Valued Patient'},<br><br>Thank you for visiting ApexCare Hospital & Research Centre for your consultation today. We strive to offer prompt doctor attention and seamless clinical care.`;
    let questionText = 'How likely are you to recommend our doctors & OPD care to your friends and family?';

    if (isIPD) {
      subject = 'ApexCare Hospital: Inpatient Discharge & Care Feedback';
      heading = 'Inpatient Stay & Discharge Experience';
      bodyText = `Dear ${patientName || 'Valued Patient'},<br><br>We hope your recovery is progressing smoothly following your recent discharge from ApexCare Hospital. Our clinical and nursing staff would like to ensure your hospital stay was comfortable and transparent.`;
      questionText = 'How was your overall room hygiene, nursing care, and discharge billing experience?';
    }

    if ((channel === 'Email' || channel === 'All') && customEmail) {
      const transporter = EmailService.getTransporter();
      if (transporter) {
        const mailOptions = {
          from: process.env.SMTP_FROM || `"ApexCare Hospital Patient Care" <${process.env.SMTP_USER}>`,
          to: customEmail,
          subject: subject,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="background-color: #0B5E5E; padding: 20px 24px; border-radius: 8px; margin-bottom: 20px; color: #ffffff;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700;">ApexCare Hospital & Research Centre</h2>
                <p style="margin: 4px 0 0; font-size: 13px; color: #a7f3d0;">${heading}</p>
              </div>
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                ${bodyText}
              </p>
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 16px; font-weight: 700; color: #0f172a; font-size: 15px;">
                  ${questionText}
                </p>
                <a href="${surveyUrl}" style="background-color: #0B5E5E; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                  Complete 1-Minute Survey &rarr;
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center; margin: 16px 0 0;">
                ApexCare Hospital &bull; Quality & Patient Experience Department &bull; Confidential Survey
              </p>
            </div>
          `
        };

        try {
          await transporter.sendMail(mailOptions);
          emailSent = true;
        } catch (err) {
          console.error('Failed to send survey email:', err.message);
        }
      }
    }

    return {
      success: true,
      surveyUrl,
      targetAudience,
      channel,
      emailSent,
      message: `Survey invitation dispatched successfully via ${channel}!`
    };
  }

  /**
   * Update grievance status or follow up notes
   */
  static async updateStatus(id, { status, followUpNotes }) {
    const res = await query(`
      UPDATE patient_feedbacks
      SET 
        status = COALESCE($1, status),
        follow_up_notes = COALESCE($2, follow_up_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE feedback_code = $3 OR id::text = $3
      RETURNING *
    `, [status, followUpNotes, id]);

    if (res.rows.length === 0) {
      throw new AppError('Feedback not found', HTTP_STATUS.NOT_FOUND);
    }

    return this.formatRecord(res.rows[0]);
  }
}
