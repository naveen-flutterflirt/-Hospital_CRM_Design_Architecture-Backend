import { query } from '../config/db.js';

async function initIntegrationsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS integrations_config (
        id VARCHAR(50) PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_enabled BOOLEAN DEFAULT FALSE,
        config JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'Configured',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      INSERT INTO integrations_config (id, provider, name, description, is_enabled, config, status)
      VALUES 
        ('email_smtp', 'SMTP', 'Gmail SMTP Service', 'Real-time staff credentials dispatch and automated official notifications', TRUE, '{"host": "smtp.gmail.com", "port": 587, "user": "systemnotify00@gmail.com"}', 'Active & Verified'),
        ('whatsapp_cloud', 'WHATSAPP', 'WhatsApp Business Cloud API', 'Automated appointment confirmation, OPD slip & discharge summary PDF via WhatsApp', TRUE, '{"phone": "+91 98765 43210", "webhook_status": "active"}', 'Connected'),
        ('meta_ads', 'META', 'Meta Ads Lead Sync (FB & Insta)', 'Automatic real-time ingestion of hospital marketing leads directly into CRM leads table', TRUE, '{"pixel_id": "982347102938471", "page": "ApexCare Hospital Official"}', 'Syncing Leads'),
        ('sms_gateway', 'SMS', 'DLT Approved SMS Gateway', 'Urgent clinical alerts, appointment reminders and OTP verification', FALSE, '{"sender_id": "APEXCR", "provider": "Fast2SMS"}', 'Needs API Key')
      ON CONFLICT (id) DO NOTHING;
    `);

    const res = await query('SELECT id, name, is_enabled, status FROM integrations_config');
    console.log('Integrations Config Table Ready:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error creating integrations_config table:', err);
    process.exit(1);
  }
}

initIntegrationsTable();
