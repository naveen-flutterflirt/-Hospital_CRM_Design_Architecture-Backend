import { query } from '../config/db.js';

async function addPatientColumns() {
  console.log('Adding clinical and insurance columns to patients table...');
  await query(`
    ALTER TABLE patients 
    ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) DEFAULT 'B +ve',
    ADD COLUMN IF NOT EXISTS blood_pressure VARCHAR(30) DEFAULT '120/80 mmHg',
    ADD COLUMN IF NOT EXISTS pulse_rate VARCHAR(20) DEFAULT '72 bpm',
    ADD COLUMN IF NOT EXISTS sp_o2 VARCHAR(20) DEFAULT '99%',
    ADD COLUMN IF NOT EXISTS weight_kg VARCHAR(20) DEFAULT '68 kg',
    ADD COLUMN IF NOT EXISTS height_cm VARCHAR(20) DEFAULT '172 cm',
    ADD COLUMN IF NOT EXISTS allergies TEXT DEFAULT 'No Known Drug Allergies (NKDA)',
    ADD COLUMN IF NOT EXISTS chronic_conditions TEXT DEFAULT 'None recorded',
    ADD COLUMN IF NOT EXISTS insurance_provider VARCHAR(100) DEFAULT 'Self Pay',
    ADD COLUMN IF NOT EXISTS caregiver_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS caregiver_relation VARCHAR(50),
    ADD COLUMN IF NOT EXISTS caregiver_phone VARCHAR(30);
  `);

  // Update real values for active patients
  await query(`
    UPDATE patients SET
      blood_group = 'O +ve',
      blood_pressure = '122/82 mmHg',
      pulse_rate = '74 bpm',
      sp_o2 = '98%',
      weight_kg = '70 kg',
      allergies = 'No Known Drug Allergies (NKDA)',
      insurance_provider = 'Star Health (Cashless)',
      caregiver_name = 'Ramesh Gowda',
      caregiver_relation = 'Brother',
      caregiver_phone = '+91 9876543210'
    WHERE uhid = 'BLR-0042871';
  `);

  await query(`
    UPDATE patients SET
      blood_group = 'A +ve',
      blood_pressure = '118/76 mmHg',
      pulse_rate = '70 bpm',
      sp_o2 = '99%',
      weight_kg = '55 kg',
      allergies = 'Sulpha Drugs',
      insurance_provider = 'HDFC ERGO',
      caregiver_name = 'Sunil Kumar',
      caregiver_relation = 'Spouse',
      caregiver_phone = '+91 9876543211'
    WHERE uhid = 'BLR-0051928';
  `);

  await query(`
    UPDATE patients SET
      blood_group = 'B +ve',
      blood_pressure = '120/80 mmHg',
      pulse_rate = '72 bpm',
      sp_o2 = '99%',
      weight_kg = '68 kg',
      allergies = 'No Known Drug Allergies (NKDA)',
      insurance_provider = 'Self Pay',
      caregiver_name = 'Suman Kumar (Self)',
      caregiver_relation = 'Self',
      caregiver_phone = '6299974421'
    WHERE uhid = 'BLR-0092515';
  `);

  console.log('Columns added and real clinical data populated successfully.');
  process.exit(0);
}

addPatientColumns().catch(e => {
  console.error(e);
  process.exit(1);
});
