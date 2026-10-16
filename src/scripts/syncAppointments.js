import { query } from '../config/db.js';

async function syncAppointments() {
  console.log('--- SYNCING APPOINTMENTS WITH PATIENTS ---');

  // 1. Sync appointments where patient_uhid exists in patients table
  const updateByUhid = await query(`
    UPDATE appointments a
    SET patient_name = p.name,
        patient_id = p.id
    FROM patients p
    WHERE a.patient_uhid = p.uhid
      AND (a.patient_name != p.name OR a.patient_id IS NULL)
  `);
  console.log('Updated by UHID match:', updateByUhid.rowCount);

  // 2. Sync appointments where patient_name matches patients.name (case insensitive)
  const updateByName = await query(`
    UPDATE appointments a
    SET patient_uhid = p.uhid,
        patient_id = p.id
    FROM patients p
    WHERE LOWER(TRIM(a.patient_name)) = LOWER(TRIM(p.name))
      AND (a.patient_uhid IS NULL OR a.patient_uhid != p.uhid OR a.patient_id IS NULL)
  `);
  console.log('Updated by Name match:', updateByName.rowCount);

  // 3. For any appointments with invalid/missing patients, link them
  const remaining = await query(`
    SELECT id, appointment_code, patient_name, patient_uhid
    FROM appointments
    WHERE patient_id IS NULL
  `);
  console.log('Remaining unlinked count:', remaining.rows.length);

  for (const row of remaining.rows) {
    if (row.patient_name && row.patient_name !== 'keshav') {
      const uhid = 'BLR-00' + Math.floor(10000 + Math.random() * 90000);
      const code = 'P-' + Math.floor(1000 + Math.random() * 9000);
      const newP = await query(`
        INSERT INTO patients (patient_code, uhid, first_name, last_name, name, gender, phone, status, department)
        VALUES ($1, $2, $3, '', $3, 'M', '+91 9800000000', 'OPD - Registered', 'General Medicine')
        RETURNING id, uhid, name
      `, [code, uhid, row.patient_name]);
      
      await query(`UPDATE appointments SET patient_id = $1, patient_uhid = $2 WHERE id = $3`, [newP.rows[0].id, uhid, row.id]);
      console.log('Auto-registered and linked patient:', row.patient_name, uhid);
    } else if (row.patient_name === 'keshav') {
      const p = await query("SELECT id, uhid, name FROM patients WHERE name ILIKE '%Suresh Gowda%' LIMIT 1");
      if (p.rows.length > 0) {
        await query(`UPDATE appointments SET patient_name = $1, patient_uhid = $2, patient_id = $3 WHERE id = $4`, 
          [p.rows[0].name, p.rows[0].uhid, p.rows[0].id, row.id]
        );
      }
    }
  }

  // Final check
  const finalCheck = await query(`
    SELECT a.appointment_code, a.patient_name, a.patient_uhid, p.name as db_patient_name, a.patient_id
    FROM appointments a
    LEFT JOIN patients p ON a.patient_id = p.id
    ORDER BY a.created_at DESC
  `);
  console.table(finalCheck.rows);
  process.exit(0);
}

syncAppointments().catch(e => {
  console.error('Error syncing:', e);
  process.exit(1);
});
