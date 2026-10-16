import { query } from '../config/db.js';

export class HospitalProfileService {
  /**
   * Get current hospital profile (only name, email, phone, address)
   */
  static async getProfile() {
    const res = await query(`
      SELECT id, name, email, phone, address, updated_at 
      FROM hospital_profile 
      WHERE id = 'default' 
      LIMIT 1
    `);
    
    if (res.rows.length === 0) {
      const insertRes = await query(`
        INSERT INTO hospital_profile (id, name, email, phone, address)
        VALUES (
          'default', 
          'ApexCare Hospital & Research Centre', 
          'contact@apexcare.com', 
          '+91 1800 123 4567', 
          '123 Health Ave, Mumbai, Maharashtra 400001, India'
        )
        RETURNING id, name, email, phone, address, updated_at
      `);
      return insertRes.rows[0];
    }
    return res.rows[0];
  }

  /**
   * Update hospital profile (only name, email, phone, address)
   */
  static async updateProfile(data) {
    const { name, email, phone, address } = data;

    const sql = `
      UPDATE hospital_profile
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 'default'
      RETURNING id, name, email, phone, address, updated_at
    `;

    const values = [
      name ?? null,
      email ?? null,
      phone ?? null,
      address ?? null
    ];

    const res = await query(sql, values);
    return res.rows[0];
  }
}
