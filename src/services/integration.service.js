import { query } from '../config/db.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class IntegrationService {
  /**
   * Get all integrations
   */
  static async getAllIntegrations() {
    const res = await query(`
      SELECT id, provider, name, description, is_enabled, config, status, updated_at
      FROM integrations_config
      WHERE id != 'sms_gateway'
      ORDER BY 
        CASE id
          WHEN 'email_smtp' THEN 1
          WHEN 'whatsapp_cloud' THEN 2
          WHEN 'meta_ads' THEN 3
          ELSE 4
        END
    `);
    return res.rows;
  }

  /**
   * Toggle enabled status of an integration
   */
  static async toggleIntegration(id, is_enabled) {
    const res = await query(`
      UPDATE integrations_config
      SET 
        is_enabled = $1,
        status = CASE 
          WHEN $1 = FALSE THEN 'Disabled'
          WHEN id = 'email_smtp' THEN 'Active & Verified'
          WHEN id = 'whatsapp_cloud' THEN 'Connected'
          WHEN id = 'meta_ads' THEN 'Syncing Leads'
          ELSE 'Configured'
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [is_enabled, id]);

    if (res.rows.length === 0) {
      throw new AppError('Integration not found', HTTP_STATUS.NOT_FOUND);
    }

    return res.rows[0];
  }

  /**
   * Update configuration parameters of an integration
   */
  static async updateConfig(id, config) {
    const res = await query(`
      UPDATE integrations_config
      SET 
        config = $1,
        is_enabled = TRUE,
        status = CASE 
          WHEN id = 'email_smtp' THEN 'Active & Verified'
          WHEN id = 'whatsapp_cloud' THEN 'Connected'
          WHEN id = 'meta_ads' THEN 'Syncing Leads'
          WHEN id = 'sms_gateway' THEN 'Ready'
          ELSE 'Connected'
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(config), id]);

    if (res.rows.length === 0) {
      throw new AppError('Integration not found', HTTP_STATUS.NOT_FOUND);
    }

    return res.rows[0];
  }
}
