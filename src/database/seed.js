import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';
import { ROLES } from '../constants/roles.js';

const __filename = fileURLToPath(import.meta.url);

const INITIAL_PATIENTS = [
  { id: "SG-1234", name: "Suresh Gowda", firstName: "Suresh", lastName: "Gowda", uhid: "BLR-0042871", abha: "Linked", gender: "M", dob: "1963-05-12", contact: "+91 98xxxx4410", lastVisit: "Today, 09:30 AM", status: "IPD - Admitted", statusType: "primary", department: "Orthopaedics", source: "Referral" },
  { id: "AK-4592", name: "Anita Kumar", firstName: "Anita", lastName: "Kumar", uhid: "BLR-0051928", abha: "Pending", gender: "F", dob: "1990-08-22", contact: "+91 99xxxx8811", lastVisit: "Yesterday, 14:15", status: "OPD - Completed", statusType: "neutral", department: "General Medicine", source: "Walk-in" },
  { id: "RJ-9821", name: "Rahul Jain", firstName: "Rahul", lastName: "Jain", uhid: "BLR-0062719", abha: "Linked", gender: "M", dob: "1979-11-05", contact: "+91 88xxxx2299", lastVisit: "Oct 4, 11:00 AM", status: "Follow-up Due", statusType: "warning", department: "Cardiology", source: "Website" },
  { id: "MN-7712", name: "Meena N.", firstName: "Meena", lastName: "N.", uhid: "BLR-0071823", abha: "Linked", gender: "F", dob: "1996-03-18", contact: "+91 77xxxx5544", lastVisit: "Oct 2, 09:45 AM", status: "OPD - No Show", statusType: "alert", department: "Gynaecology", source: "WhatsApp" },
  { id: "VK-8823", name: "Vikram K.", firstName: "Vikram", lastName: "K.", uhid: "BLR-0082734", abha: "Pending", gender: "M", dob: "1972-07-30", contact: "+91 96xxxx1122", lastVisit: "Sep 28, 16:30", status: "Discharged", statusType: "success", department: "Neurology", source: "Insurance/TPA" },
  { id: "SP-1192", name: "Sunita Patil", firstName: "Sunita", lastName: "Patil", uhid: "BLR-0091827", abha: "Linked", gender: "F", dob: "1983-09-14", contact: "+91 98xxxx7766", lastVisit: "Sep 25, 10:15 AM", status: "OPD - Completed", statusType: "neutral", department: "General Medicine", source: "Walk-in" },
  { id: "PR-2391", name: "Priya Rajan", firstName: "Priya", lastName: "Rajan", uhid: "BLR-0045812", abha: "Pending", gender: "F", dob: "1995-12-02", contact: "+91 98xxxx1234", lastVisit: "Sep 20, 11:30 AM", status: "Follow-up Due", statusType: "warning", department: "Paediatrics", source: "Website" },
  { id: "AS-4812", name: "Amit Singh", firstName: "Amit", lastName: "Singh", uhid: "BLR-0078192", abha: "Linked", gender: "M", dob: "1989-01-25", contact: "+91 99xxxx5678", lastVisit: "Sep 18, 09:00 AM", status: "OPD - Completed", statusType: "neutral", department: "Cardiology", source: "Walk-in" },
  { id: "MD-9182", name: "Mohan Das", firstName: "Mohan", lastName: "Das", uhid: "BLR-0081293", abha: "Linked", gender: "M", dob: "1976-04-10", contact: "+91 88xxxx9012", lastVisit: "Sep 15, 14:45", status: "IPD - Admitted", statusType: "primary", department: "Orthopaedics", source: "Referral" },
  { id: "KN-3819", name: "Kavya Nair", firstName: "Kavya", lastName: "Nair", uhid: "BLR-0091283", abha: "Pending", gender: "F", dob: "1999-06-19", contact: "+91 77xxxx3456", lastVisit: "Sep 12, 16:00", status: "Discharged", statusType: "success", department: "Gynaecology", source: "WhatsApp" },
  { id: "RV-4821", name: "Ravi Varma", firstName: "Ravi", lastName: "Varma", uhid: "BLR-0102938", abha: "Linked", gender: "M", dob: "1969-10-08", contact: "+91 96xxxx7890", lastVisit: "Sep 10, 10:15 AM", status: "OPD - No Show", statusType: "alert", department: "Neurology", source: "Walk-in" },
  { id: "SM-1928", name: "Sneha Menon", firstName: "Sneha", lastName: "Menon", uhid: "BLR-0113849", abha: "Linked", gender: "F", dob: "1986-02-14", contact: "+91 98xxxx2345", lastVisit: "Sep 05, 11:45 AM", status: "OPD - Completed", statusType: "neutral", department: "General Medicine", source: "Website" },
  { id: "DP-2918", name: "Deepak P.", firstName: "Deepak", lastName: "P.", uhid: "BLR-0124859", abha: "Pending", gender: "M", dob: "1982-11-28", contact: "+91 99xxxx6789", lastVisit: "Sep 01, 09:30 AM", status: "Follow-up Due", statusType: "warning", department: "Cardiology", source: "Walk-in" },
  { id: "AR-4819", name: "Anjali Rao", firstName: "Anjali", lastName: "Rao", uhid: "BLR-0135869", abha: "Linked", gender: "F", dob: "1993-08-04", contact: "+91 88xxxx0123", lastVisit: "Aug 28, 14:00", status: "IPD - Admitted", statusType: "primary", department: "Gynaecology", source: "Insurance/TPA" },
  { id: "VS-5829", name: "Vijay Sharma", firstName: "Vijay", lastName: "Sharma", uhid: "BLR-0146879", abha: "Linked", gender: "M", dob: "1959-05-17", contact: "+91 77xxxx4567", lastVisit: "Aug 25, 10:45 AM", status: "Discharged", statusType: "success", department: "Orthopaedics", source: "Referral" },
  { id: "NK-6938", name: "Neha Kapoor", firstName: "Neha", lastName: "Kapoor", uhid: "BLR-0157889", abha: "Pending", gender: "F", dob: "1997-09-30", contact: "+91 96xxxx8901", lastVisit: "Aug 20, 16:30", status: "OPD - No Show", statusType: "alert", department: "Paediatrics", source: "WhatsApp" },
];

export async function seedAdminUser() {
  const adminEmail = 'admin@gmail.com';
  const adminPassword = 'admin123';
  const adminName = 'System Administrator';

  const checkUser = await query('SELECT id, email FROM users WHERE email = $1', [adminEmail]);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  if (checkUser.rows.length === 0) {
    await query(
      `INSERT INTO users (email, password, name, role, department, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        adminEmail,
        hashedPassword,
        adminName,
        ROLES.ADMIN,
        'Executive Management',
        '+91 9876543210',
        true,
      ]
    );
  } else {
    await query('UPDATE users SET password = $1, role = $2 WHERE email = $3', [
      hashedPassword,
      ROLES.ADMIN,
      adminEmail,
    ]);
  }
}

export async function seedPatients() {
  const check = await query('SELECT count(*) FROM patients');
  const count = parseInt(check.rows[0].count, 10);

  if (count === 0) {
    for (const p of INITIAL_PATIENTS) {
      await query(
        `INSERT INTO patients (
          patient_code, uhid, first_name, last_name, name, dob, gender, phone, email,
          abha_status, department, source, status, status_type, last_visit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          p.id,
          p.uhid,
          p.firstName,
          p.lastName,
          p.name,
          p.dob,
          p.gender,
          p.contact,
          `${p.firstName.toLowerCase()}@example.com`,
          p.abha,
          p.department,
          p.source,
          p.status,
          p.statusType,
          p.lastVisit,
        ]
      );
    }
  }
}

const INITIAL_DOCTORS = [
  { doctorCode: "DOC-101", name: "Dr. Arvind Rao", specialty: "Interventional Cardiology", department: "Cardiology", qualification: "MBBS, MD, DM (Cardiology)", registrationNo: "KMC-48210", phone: "+91 9845112233", email: "arvind.rao@hospital.com", opdRoom: "Room 102 (OPD Block A)", consultationFee: 800, availableTiming: "Mon - Sat (09:00 AM - 01:00 PM)", status: "Active", patientsAttended: 142 },
  { doctorCode: "DOC-102", name: "Dr. Sneha Iyer", specialty: "Obstetrics & Gynaecology", department: "Gynaecology", qualification: "MBBS, MS (OBG), DNB", registrationNo: "KMC-51920", phone: "+91 9845223344", email: "sneha.iyer@hospital.com", opdRoom: "Room 205 (Women Care)", consultationFee: 750, availableTiming: "Mon - Fri (10:00 AM - 02:00 PM)", status: "Active", patientsAttended: 98 },
  { doctorCode: "DOC-103", name: "Dr. Manoj Desai", specialty: "Orthopaedics & Joint Replacement", department: "Orthopaedics", qualification: "MBBS, MS (Ortho), M.Ch", registrationNo: "KMC-39182", phone: "+91 9845334455", email: "manoj.desai@hospital.com", opdRoom: "Room 114 (Trauma Wing)", consultationFee: 700, availableTiming: "Tue - Sat (11:00 AM - 04:00 PM)", status: "Active", patientsAttended: 115 },
  { doctorCode: "DOC-104", name: "Dr. Kavita Nair", specialty: "Neurology & Stroke Care", department: "Neurology", qualification: "MBBS, MD, DM (Neurology)", registrationNo: "KMC-62819", phone: "+91 9845445566", email: "kavita.nair@hospital.com", opdRoom: "Room 301 (Neuro Sciences)", consultationFee: 900, availableTiming: "Mon - Thu (09:30 AM - 01:30 PM)", status: "Active", patientsAttended: 64 },
  { doctorCode: "DOC-105", name: "Dr. Rajesh Sharma", specialty: "Consultant Physician", department: "General Medicine", qualification: "MBBS, MD (Internal Medicine)", registrationNo: "KMC-28491", phone: "+91 9845556677", email: "rajesh.sharma@hospital.com", opdRoom: "Room 101 (OPD Ground Floor)", consultationFee: 500, availableTiming: "Mon - Sat (08:30 AM - 02:30 PM)", status: "Active", patientsAttended: 210 },
  { doctorCode: "DOC-106", name: "Dr. Priya Patel", specialty: "Paediatrician & Neonatologist", department: "Paediatrics", qualification: "MBBS, MD (Paediatrics)", registrationNo: "KMC-73829", phone: "+91 9845667788", email: "priya.patel@hospital.com", opdRoom: "Room 202 (Child Care Wing)", consultationFee: 650, availableTiming: "Mon - Sat (10:00 AM - 01:00 PM)", status: "Active", patientsAttended: 88 },
];

export async function seedDoctors() {
  const check = await query('SELECT count(*) FROM doctors');
  const count = parseInt(check.rows[0].count, 10);

  if (count === 0) {
    for (const d of INITIAL_DOCTORS) {
      await query(
        `INSERT INTO doctors (
          doctor_code, name, specialty, department, qualification, registration_no,
          phone, email, opd_room, consultation_fee, available_timing, status, patients_attended
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          d.doctorCode,
          d.name,
          d.specialty,
          d.department,
          d.qualification,
          d.registrationNo,
          d.phone,
          d.email,
          d.opdRoom,
          d.consultationFee,
          d.availableTiming,
          d.status,
          d.patientsAttended,
        ]
      );
    }
  }
}

const INITIAL_APPOINTMENTS = [
  { code: "APP-101", patientName: "Ramesh Kulkarni", patientUhid: "BLR-0042871", doctorName: "Dr. Arvind Rao", department: "Cardiology", appointmentDate: "2026-10-13", timeSlot: "09:30 AM", source: "App", status: "In consult", statusType: "primary" },
  { code: "APP-102", patientName: "Fatima Shaikh", patientUhid: "BLR-0051928", doctorName: "Dr. Sneha Iyer", department: "Gynaecology", appointmentDate: "2026-10-13", timeSlot: "09:45 AM", source: "WhatsApp", status: "Checked in", statusType: "success" },
  { code: "APP-103", patientName: "Arjun Patil", patientUhid: "BLR-0062719", doctorName: "Dr. Manoj Desai", department: "Orthopaedics", appointmentDate: "2026-10-13", timeSlot: "10:00 AM", source: "Referral", status: "Waiting", statusType: "warning" },
  { code: "APP-104", patientName: "Lakshmi N.", patientUhid: "BLR-0071823", doctorName: "Dr. Arvind Rao", department: "Cardiology", appointmentDate: "2026-10-13", timeSlot: "10:15 AM", source: "Call centre", status: "Booked", statusType: "neutral" },
  { code: "APP-105", patientName: "Vikram Joshi", patientUhid: "BLR-0082734", doctorName: "Dr. Kavita Nair", department: "Neurology", appointmentDate: "2026-10-13", timeSlot: "10:30 AM", source: "Website", status: "No-show", statusType: "alert" },
  { code: "APP-106", patientName: "Sarah Lee", patientUhid: "BLR-0091827", doctorName: "Dr. Arvind Rao", department: "Cardiology", appointmentDate: "2026-10-13", timeSlot: "11:00 AM", source: "Walk-in", status: "Booked", statusType: "neutral" },
  { code: "APP-107", patientName: "Mohammed Ali", patientUhid: "BLR-0045812", doctorName: "Dr. Manoj Desai", department: "Orthopaedics", appointmentDate: "2026-10-13", timeSlot: "11:15 AM", source: "App", status: "Booked", statusType: "neutral" },
  { code: "APP-108", patientName: "Priya Singh", patientUhid: "BLR-0078192", doctorName: "Dr. Sneha Iyer", department: "Gynaecology", appointmentDate: "2026-10-13", timeSlot: "12:00 PM", source: "Referral", status: "Booked", statusType: "neutral" },
];

export async function seedAppointments() {
  const check = await query('SELECT count(*) FROM appointments');
  const count = parseInt(check.rows[0].count, 10);

  if (count === 0) {
    for (const a of INITIAL_APPOINTMENTS) {
      await query(
        `INSERT INTO appointments (
          appointment_code, patient_name, patient_uhid, doctor_name, department,
          appointment_date, time_slot, source, status, status_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          a.code,
          a.patientName,
          a.patientUhid,
          a.doctorName,
          a.department,
          a.appointmentDate,
          a.timeSlot,
          a.source,
          a.status,
          a.statusType,
        ]
      );
    }
  }
}

const INITIAL_LEADS_DATA = [
  { code: "LD-101", name: "Meena R.", treatment: "IVF consultation", source: "Facebook", stage: "new", meta: "12m ago", priority: "High", phone: "+91 9876500001", tag: "High Priority", tagType: "warning" },
  { code: "LD-102", name: "Sanjay K.", treatment: "Angiography cost", source: "Website", stage: "new", meta: "40m ago", priority: "Normal", phone: "+91 9876500002", tag: "Cost Enquiry", tagType: "neutral" },
  { code: "LD-103", name: "Rahul M.", treatment: "Cataract · both eyes", source: "Health camp", stage: "contacted", meta: "2h ago", priority: "High", phone: "+91 9876500003", tag: "Callback 3 pm", tagType: "warning" },
  { code: "LD-104", name: "Nazia B.", treatment: "Maternity package", source: "Health camp", stage: "contacted", meta: "4h ago", priority: "Normal", phone: "+91 9876500004", tag: "Info Sent", tagType: "neutral" },
  { code: "LD-105", name: "Gopal S.", treatment: "Hernia surgery · ₹65k quote", source: "Walk-in", stage: "quote", meta: "1d ago", priority: "High", phone: "+91 9876500005", tag: "OPD 10 Oct", tagType: "primary", estimatedValue: 65000 },
  { code: "LD-106", name: "Ayesha T.", treatment: "Health check · Executive", source: "Corporate", stage: "quote", meta: "1d ago", priority: "Normal", phone: "+91 9876500006", tag: "Proposal Sent", tagType: "primary", estimatedValue: 8500 },
  { code: "LD-107", name: "Ravi P.", treatment: "Spine · MRI done", source: "Doctor referral", stage: "visited", meta: "2d ago", priority: "High", phone: "+91 9876500007", tag: "Decision pending", tagType: "warning" },
  { code: "LD-108", name: "Suresh G.", treatment: "TKR · admitted", source: "Insurance", stage: "wonLost", meta: "3d ago", priority: "High", phone: "+91 9876500008", tag: "Won", tagType: "success", estimatedValue: 240000 },
  { code: "LD-109", name: "Deepa V.", treatment: "Lost: price", source: "Website", stage: "wonLost", meta: "4d ago", priority: "Normal", phone: "+91 9876500009", tag: "Lost", tagType: "alert" },
];

export async function seedLeads() {
  const check = await query('SELECT count(*) FROM leads');
  const count = parseInt(check.rows[0].count, 10);

  if (count === 0) {
    for (const l of INITIAL_LEADS_DATA) {
      await query(
        `INSERT INTO leads (
          lead_code, name, treatment, source, stage, meta, priority, phone, tag, tag_type, estimated_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          l.code,
          l.name,
          l.treatment,
          l.source,
          l.stage,
          l.meta,
          l.priority,
          l.phone,
          l.tag,
          l.tagType,
          l.estimatedValue || 0,
        ]
      );
    }
  }
}

export async function seedWardsAndBeds() {
  const check = await query('SELECT count(*) FROM wards');
  const count = parseInt(check.rows[0].count, 10);

  if (count === 0) {
    // 1. Create realistic wards
    const wardsData = [
      { code: 'ORTHO-W2', name: 'Ortho Ward 2', floor: 'Floor 2, Wing B', type: 'GENERAL', dept: 'Orthopaedics', rate: 2200.00, count: 26 },
      { code: 'ICU-1', name: 'Intensive Care Unit (ICU)', floor: 'Floor 1, Critical Care', type: 'ICU', dept: 'Critical Care', rate: 6500.00, count: 12 },
      { code: 'DELUXE-3', name: 'Deluxe Private Wing', floor: 'Floor 3, Executive Tower', type: 'DELUXE', dept: 'General Medicine', rate: 5000.00, count: 10 },
      { code: 'MAT-2', name: 'Maternity & Neonatal Ward', floor: 'Floor 2, Wing A', type: 'SEMI_PRIVATE', dept: 'Gynaecology', rate: 2800.00, count: 14 }
    ];

    const patientsRes = await query('SELECT id, name, uhid FROM patients LIMIT 15');
    const doctorsRes = await query('SELECT id, name, department FROM doctors LIMIT 5');
    const patients = patientsRes.rows;
    const doctors = doctorsRes.rows;

    let patientIdx = 0;

    for (const w of wardsData) {
      const wardRes = await query(
        `INSERT INTO wards (ward_code, name, floor, ward_type, department, daily_rate)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [w.code, w.name, w.floor, w.type, w.dept, w.rate]
      );
      const wardId = wardRes.rows[0].id;

      // Status pattern to match the hospital board
      const statusPattern = ['occupied', 'occupied', 'vacant', 'occupied', 'discharge', 'occupied', 'cleaning', 'critical', 'occupied', 'vacant'];

      for (let i = 1; i <= w.count; i++) {
        const bedNum = i < 10 ? `0${i}` : `${i}`;
        const status = statusPattern[(i - 1) % statusPattern.length];
        const bedRate = w.rate;

        const bedRes = await query(
          `INSERT INTO beds (ward_id, bed_number, status, daily_rate)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [wardId, bedNum, status, bedRate]
        );
        const bedId = bedRes.rows[0].id;

        // If bed is occupied or discharge or critical, create an active admission record
        if (['occupied', 'discharge', 'critical'].includes(status) && patients.length > 0) {
          const pt = patients[patientIdx % patients.length];
          const doc = doctors[patientIdx % doctors.length];
          patientIdx++;

          const admCode = `ADM-${w.code}-${bedNum}`;
          await query(
            `INSERT INTO admissions (
              admission_number, patient_id, bed_id, doctor_id, doctor_name, department, status, primary_diagnosis, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              admCode,
              pt.id,
              bedId,
              doc?.id || null,
              doc?.name || 'Dr. Attending',
              w.dept,
              'admitted',
              'Post-operative monitoring and recovery',
              `Admitted in ${w.name}`
            ]
          );
        }
      }
    }
  }
}

export async function seedInvoicesAndClaims() {
  const check = await query('SELECT count(*) FROM invoices');
  const count = parseInt(check.rows[0].count, 10);

  if (count === 0) {
    const pts = await query('SELECT id, name, uhid FROM patients LIMIT 10');
    const patients = pts.rows;

    const sampleInvoices = [
      { num: 'INV-2026-1001', ptIdx: 0, type: 'IPD - TKR', ins: 'Star Health', gross: 285000, disc: 5000, net: 280000, paid: 200000, due: 80000, mode: 'TPA Insurance', status: 'Claim Pending', tpa: { code: 'CLM-ST-8821', pol: 'SH-POL-992144', req: 280000, app: 200000, st: 'Submitted' } },
      { num: 'INV-2026-1002', ptIdx: 1, type: 'OPD', ins: 'Self Pay', gross: 800, disc: 0, net: 800, paid: 800, due: 0, mode: 'UPI', status: 'Settled' },
      { num: 'INV-2026-1003', ptIdx: 2, type: 'Surgery Estimate', ins: 'HDFC Ergo', gross: 65000, disc: 2000, net: 63000, paid: 0, due: 63000, mode: 'TPA Insurance', status: 'Estimate', tpa: { code: 'CLM-HD-1192', pol: 'HD-99281', req: 63000, app: 0, st: 'Draft' } },
      { num: 'INV-2026-1004', ptIdx: 3, type: 'IPD - Maternity', ins: 'ICICI Lombard', gross: 120000, disc: 0, net: 120000, paid: 120000, due: 0, mode: 'TPA Insurance', status: 'Pre-Auth', tpa: { code: 'CLM-IC-5519', pol: 'IC-POL-77119', req: 120000, app: 100000, st: 'Pre-Auth Approved' } },
      { num: 'INV-2026-1005', ptIdx: 4, type: 'OPD - Cardiology', ins: 'Self Pay', gross: 1500, disc: 0, net: 1500, paid: 0, due: 1500, mode: 'Cash', status: 'Overdue' },
      { num: 'INV-2026-1006', ptIdx: 5, type: 'Diagnostics', ins: 'Self Pay', gross: 4500, disc: 0, net: 4500, paid: 4500, due: 0, mode: 'Credit Card', status: 'Settled' },
      { num: 'INV-2026-1007', ptIdx: 6, type: 'IPD - General Surgery', ins: 'Care Health', gross: 175000, disc: 5000, net: 170000, paid: 170000, due: 0, mode: 'TPA Insurance', status: 'Settled', tpa: { code: 'CLM-CR-3391', pol: 'CR-88129', req: 170000, app: 170000, st: 'Claim Settled' } },
      { num: 'INV-2026-1008', ptIdx: 7, type: 'OPD - Orthopaedics', ins: 'Self Pay', gross: 1200, disc: 200, net: 1000, paid: 1000, due: 0, mode: 'UPI', status: 'Settled' }
    ];

    for (const inv of sampleInvoices) {
      const pt = patients[inv.ptIdx % patients.length] || { id: null, name: 'General Patient', uhid: 'BLR-001001' };
      const res = await query(
        `INSERT INTO invoices (
          invoice_number, patient_id, patient_name, uhid, bill_type, insurance,
          gross_amount, discount, net_amount, paid_amount, due_amount, payment_mode, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [
          inv.num,
          pt.id,
          pt.name,
          pt.uhid,
          inv.type,
          inv.ins,
          inv.gross,
          inv.disc,
          inv.net,
          inv.paid,
          inv.due,
          inv.mode,
          inv.status
        ]
      );
      const invId = res.rows[0].id;

      if (inv.tpa) {
        await query(
          `INSERT INTO tpa_claims (
            claim_code, invoice_id, patient_id, tpa_name, policy_number, requested_amount, approved_amount, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            inv.tpa.code,
            invId,
            pt.id,
            inv.ins,
            inv.tpa.pol,
            inv.tpa.req,
            inv.tpa.app,
            inv.tpa.st
          ]
        );
      }
    }
  }
}

export async function seedCampaigns() {
  const check = await query('SELECT count(*) FROM campaigns');
  const count = parseInt(check.rows[0].count, 10);

  if (count === 0) {
    const sampleCampaigns = [
      { code: 'C-001', name: 'IVF Spring Awareness', platform: 'Facebook Ads', dept: 'Gynaecology', status: 'Active', budget: 50000, spend: 32000, leads: 145, conv: 12, rev: 480000 },
      { code: 'C-002', name: 'Cardiac Health Camp', platform: 'Offline / Local', dept: 'Cardiology', status: 'Completed', budget: 20000, spend: 20000, leads: 210, conv: 45, rev: 350000 },
      { code: 'C-003', name: 'Maternity Packages Search', platform: 'Google Ads', dept: 'Obstetrics', status: 'Active', budget: 100000, spend: 85000, leads: 340, conv: 28, rev: 1400000 },
      { code: 'C-004', name: 'Knee Replacement Retargeting', platform: 'Instagram', dept: 'Orthopaedics', status: 'Paused', budget: 30000, spend: 12000, leads: 45, conv: 3, rev: 720000 },
      { code: 'C-005', name: 'Free Eye Checkup Drive', platform: 'SMS / WhatsApp', dept: 'Ophthalmology', status: 'Active', budget: 5000, spend: 2500, leads: 85, conv: 18, rev: 120000 },
    ];

    for (const c of sampleCampaigns) {
      await query(
        `INSERT INTO campaigns (
          campaign_code, name, platform, department, status, budget, spend, leads_count, conversions_count, revenue_generated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [c.code, c.name, c.platform, c.dept, c.status, c.budget, c.spend, c.leads, c.conv, c.rev]
      );
    }
  }
}

export async function seedReferringDoctors() {
  const check = await query('SELECT count(*) FROM referring_doctors');
  const count = parseInt(check.rows[0].count, 10);

  if (count === 0) {
    const sampleDoctors = [
      { code: 'DR-001', name: 'Dr. Arvind Mehta', specialty: 'General Physician', clinic: 'Mehta Clinics, Andheri', phone: '+91 9876543210', email: 'arvind.mehta@example.com', referred: 142, rev: 1250000, status: 'Active' },
      { code: 'DR-002', name: 'Dr. Sunita Sharma', specialty: 'Gynecologist', clinic: "Care Women's Health", phone: '+91 9876543211', email: 'sunita.sharma@example.com', referred: 85, rev: 940000, status: 'Active' },
      { code: 'DR-003', name: 'Dr. Rohan Desai', specialty: 'Orthopedics', clinic: 'Desai Bone & Joint', phone: '+91 9876543212', email: 'rohan.desai@example.com', referred: 12, rev: 320000, status: 'Inactive' },
      { code: 'DR-004', name: 'Dr. Kavita Iyer', specialty: 'Pediatrician', clinic: 'Little Smiles Clinic', phone: '+91 9876543213', email: 'kavita.iyer@example.com', referred: 4, rev: 15000, status: 'Pending' },
      { code: 'DR-005', name: 'Dr. Faizal Khan', specialty: 'Cardiologist', clinic: 'Heart Care Foundation', phone: '+91 9876543214', email: 'faizal.khan@example.com', referred: 56, rev: 2100000, status: 'Active' },
      { code: 'DR-006', name: 'Dr. Rajesh Bhardwaj', specialty: 'Neurologist', clinic: 'Apex Neuro Clinic, Dadar', phone: '+91 9876543215', email: 'rajesh.bhardwaj@example.com', referred: 38, rev: 1650000, status: 'Active' },
      { code: 'DR-007', name: 'Dr. Neha Saxena', specialty: 'General Physician', clinic: 'City Health Polyclinic', phone: '+91 9876543216', email: 'neha.saxena@example.com', referred: 94, rev: 820000, status: 'Active' },
    ];

    for (const d of sampleDoctors) {
      await query(
        `INSERT INTO referring_doctors (
          doctor_code, name, specialty, clinic_name, phone, email, patients_referred, revenue_generated, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [d.code, d.name, d.specialty, d.clinic, d.phone, d.email, d.referred, d.rev, d.status]
      );
    }
  }
}

export async function seedFeedbacks() {
  const countRes = await query('SELECT COUNT(*) FROM patient_feedbacks');
  if (parseInt(countRes.rows[0].count, 10) === 0) {
    const sampleFeedbacks = [
      {
        code: 'FB-101',
        patient: 'Rajesh Kumar',
        phone: '+91 9876543201',
        email: 'rajesh.k@example.com',
        department: 'Cardiology',
        doctor: 'Dr. Faizal Khan',
        npsScore: 9,
        rating: 5,
        category: 'Promoter',
        comment: 'Excellent care and attention from the nursing staff. Dr. Faizal explained the procedure clearly.',
        status: 'Reviewed',
        channel: 'WhatsApp',
        aspects: { doctorCare: 5, cleanliness: 5, nursingStaff: 5, billingClarity: 4 }
      },
      {
        code: 'FB-102',
        patient: 'Sneha Patel',
        phone: '+91 9876543202',
        email: 'sneha.patel@example.com',
        department: 'Gynecology & Maternity',
        doctor: 'Dr. Sunita Sharma',
        npsScore: 10,
        rating: 5,
        category: 'Promoter',
        comment: 'The birthing suite was amazing. Doctor was very patient and encouraging throughout.',
        status: 'Reviewed',
        channel: 'Email',
        aspects: { doctorCare: 5, cleanliness: 5, nursingStaff: 5, billingClarity: 5 }
      },
      {
        code: 'FB-103',
        patient: 'Amit Singh',
        phone: '+91 9876543203',
        email: 'amit.singh@example.com',
        department: 'Orthopedics',
        doctor: 'Dr. Rohan Desai',
        npsScore: 5,
        rating: 3,
        category: 'Detractor',
        comment: 'Wait times were too long in the OPD. Had to wait 70 minutes despite prior appointment.',
        status: 'Action Required',
        channel: 'SMS',
        aspects: { doctorCare: 4, cleanliness: 4, nursingStaff: 3, billingClarity: 2 }
      },
      {
        code: 'FB-104',
        patient: 'Pooja Verma',
        phone: '+91 9876543204',
        email: 'pooja.verma@example.com',
        department: 'General Medicine',
        doctor: 'Dr. Neha Saxena',
        npsScore: 8,
        rating: 4,
        category: 'Passive',
        comment: 'Good experience overall. Pharmacy queues could be slightly faster.',
        status: 'Reviewed',
        channel: 'Direct',
        aspects: { doctorCare: 4, cleanliness: 4, nursingStaff: 4, billingClarity: 4 }
      },
      {
        code: 'FB-105',
        patient: 'Neha Gupta',
        phone: '+91 9876543205',
        email: 'neha.gupta@example.com',
        department: 'Pediatrics',
        doctor: 'Dr. Kavita Iyer',
        npsScore: 2,
        rating: 1,
        category: 'Detractor',
        comment: 'Very frustrating experience with the TPA desk during discharge. Delayed by 4 hours.',
        status: 'Action Required',
        channel: 'WhatsApp',
        aspects: { doctorCare: 4, cleanliness: 3, nursingStaff: 2, billingClarity: 1 }
      },
      {
        code: 'FB-106',
        patient: 'Vikram Malhotra',
        phone: '+91 9876543206',
        email: 'vikram.m@example.com',
        department: 'Neurology',
        doctor: 'Dr. Rajesh Bhardwaj',
        npsScore: 9,
        rating: 5,
        category: 'Promoter',
        comment: 'Top class neuro-diagnosis. Recovery post rehab was faster than anticipated.',
        status: 'Reviewed',
        channel: 'Email',
        aspects: { doctorCare: 5, cleanliness: 5, nursingStaff: 4, billingClarity: 5 }
      }
    ];

    for (const f of sampleFeedbacks) {
      await query(
        `INSERT INTO patient_feedbacks (
          feedback_code, patient_name, phone, email, department, doctor_name,
          nps_score, rating, category, comment, status, survey_channel, aspects
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          f.code, f.patient, f.phone, f.email, f.department, f.doctor,
          f.npsScore, f.rating, f.category, f.comment, f.status, f.channel,
          JSON.stringify(f.aspects)
        ]
      );
    }
  }
}

// Allow running directly via `node src/database/seed.js`
if (process.argv[1] === __filename) {
  Promise.all([
    seedAdminUser(),
    seedPatients(),
    seedDoctors(),
    seedAppointments(),
    seedLeads(),
    seedWardsAndBeds(),
    seedInvoicesAndClaims(),
    seedCampaigns(),
    seedReferringDoctors(),
    seedFeedbacks()
  ])
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

