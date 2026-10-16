import { query } from '../config/db.js';

async function initHospitalProfile() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS hospital_profile (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        name VARCHAR(255) NOT NULL DEFAULT 'ApexCare Hospital & Research Centre',
        email VARCHAR(255) NOT NULL DEFAULT 'contact@apexcare.com',
        phone VARCHAR(50) NOT NULL DEFAULT '+91 1800 123 4567',
        address TEXT NOT NULL DEFAULT '123 Health Ave, Mumbai, Maharashtra 400001, India',
        website VARCHAR(255) DEFAULT 'https://apexcare-hospital.com',
        emergency_contact VARCHAR(50) DEFAULT '+91 98765 43210',
        tagline VARCHAR(255) DEFAULT 'Compassionate Care, Advanced Clinical Excellence',
        logo_url TEXT DEFAULT '',
        tax_number VARCHAR(100) DEFAULT 'GSTIN27AABCA1234F1Z5',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      INSERT INTO hospital_profile (id, name, email, phone, address, website, emergency_contact, tagline, tax_number)
      VALUES (
        'default', 
        'ApexCare Hospital & Research Centre', 
        'contact@apexcare.com', 
        '+91 1800 123 4567', 
        '123 Health Ave, Mumbai, Maharashtra 400001, India', 
        'https://apexcare-hospital.com', 
        '+91 98765 43210', 
        'Compassionate Care, Advanced Clinical Excellence', 
        'GSTIN27AABCA1234F1Z5'
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    const res = await query("SELECT * FROM hospital_profile WHERE id = 'default'");
    console.log('Hospital Profile Schema Ready:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error creating hospital profile table:', err);
    process.exit(1);
  }
}

initHospitalProfile();
