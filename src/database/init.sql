-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    department VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh Tokens Table for JWT rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code VARCHAR(50),
    uhid VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    dob DATE,
    gender VARCHAR(10) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    abha_status VARCHAR(20) DEFAULT 'Pending',
    department VARCHAR(100),
    source VARCHAR(50) DEFAULT 'Walk-in',
    status VARCHAR(50) DEFAULT 'OPD - Registered',
    status_type VARCHAR(20) DEFAULT 'neutral',
    last_visit VARCHAR(100) DEFAULT 'Today, 09:30 AM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'General Medicine',
    qualification VARCHAR(100),
    registration_no VARCHAR(100),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    opd_room VARCHAR(50),
    consultation_fee NUMERIC(10, 2) DEFAULT 500.00,
    available_timing VARCHAR(100) DEFAULT 'Mon - Sat (09:00 AM - 01:00 PM)',
    status VARCHAR(30) DEFAULT 'Active',
    patients_attended INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(name);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON doctors(status);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_code VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(200) NOT NULL,
    patient_uhid VARCHAR(50),
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    source VARCHAR(50) DEFAULT 'Walk-in',
    status VARCHAR(50) NOT NULL DEFAULT 'Booked',
    status_type VARCHAR(20) NOT NULL DEFAULT 'neutral',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_code ON appointments(appointment_code);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_name);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_name);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Leads & Enquiries Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(255),
    treatment VARCHAR(255) NOT NULL,
    source VARCHAR(50) DEFAULT 'Website',
    stage VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'quote', 'visited', 'wonLost'
    priority VARCHAR(20) DEFAULT 'Normal',
    estimated_value NUMERIC(12, 2) DEFAULT 0,
    tag VARCHAR(100),
    tag_type VARCHAR(20) DEFAULT 'neutral', -- 'primary', 'warning', 'success', 'alert', 'neutral'
    notes TEXT,
    assigned_to VARCHAR(100),
    meta VARCHAR(100),
    converted_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_uhid VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column additions for existing installations
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS patient_uhid VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_leads_code ON leads(lead_code);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_converted_patient ON leads(converted_patient_id);

-- Wards Table
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    ward_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL', -- 'ICU', 'GENERAL', 'SEMI_PRIVATE', 'DELUXE', 'EMERGENCY'
    department VARCHAR(100) DEFAULT 'General Medicine',
    daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Beds Table
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'vacant', -- 'vacant', 'occupied', 'cleaning', 'discharge', 'critical'
    daily_rate NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ward_bed UNIQUE(ward_id, bed_number)
);

-- IPD Admissions Table
CREATE TABLE IF NOT EXISTS admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name VARCHAR(150),
    department VARCHAR(100),
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_discharge TIMESTAMPTZ,
    discharged_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'admitted', -- 'admitted', 'transferred', 'discharged'
    primary_diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beds_ward ON beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_admissions_patient ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_bed ON admissions(bed_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);

-- Invoices / Billing Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(200) NOT NULL,
    uhid VARCHAR(50),
    bill_type VARCHAR(50) NOT NULL DEFAULT 'OPD', -- 'OPD', 'IPD - TKR', 'IPD - Maternity', 'Surgery Estimate', 'Diagnostics', 'Pharmacy'
    insurance VARCHAR(100) DEFAULT 'Self Pay', -- 'Self Pay', 'Star Health', 'HDFC Ergo', 'ICICI Lombard', 'Care Health', 'Medi Assist'
    gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_mode VARCHAR(50) DEFAULT 'Cash', -- 'Cash', 'UPI', 'Credit Card', 'TPA Insurance', 'Bank Transfer'
    status VARCHAR(50) NOT NULL DEFAULT 'Estimate', -- 'Estimate', 'Pre-Auth', 'Claim Pending', 'Settled', 'Overdue'
    admission_id UUID REFERENCES admissions(id) ON DELETE SET NULL,
    notes TEXT,
    bill_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TPA Claims Table
CREATE TABLE IF NOT EXISTS tpa_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_code VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    tpa_name VARCHAR(100) NOT NULL,
    policy_number VARCHAR(100),
    corporate_name VARCHAR(150),
    requested_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    approved_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    denial_reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted', -- 'Draft', 'Submitted', 'Query Raised', 'Pre-Auth Approved', 'Claim Settled', 'Rejected'
    pre_auth_date TIMESTAMPTZ,
    settlement_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(bill_date);
CREATE INDEX IF NOT EXISTS idx_tpa_claims_invoice ON tpa_claims(invoice_id);
CREATE INDEX IF NOT EXISTS idx_tpa_claims_status ON tpa_claims(status);

-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    platform VARCHAR(100) NOT NULL,            -- 'Google Ads', 'Facebook Ads', 'Instagram', 'SMS / WhatsApp', 'Offline / Local'
    department VARCHAR(100) DEFAULT 'General Medicine',
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Paused', 'Completed'
    budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
    spend NUMERIC(12, 2) NOT NULL DEFAULT 0,
    leads_count INT NOT NULL DEFAULT 0,
    conversions_count INT NOT NULL DEFAULT 0,
    revenue_generated NUMERIC(12, 2) DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional campaign attribution on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_code ON campaigns(campaign_code);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns(platform);

-- Referring Doctors & Referral Network Tables
CREATE TABLE IF NOT EXISTS referring_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    clinic_name VARCHAR(200) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100) DEFAULT 'Mumbai',
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Inactive', 'Pending'
    patients_referred INT NOT NULL DEFAULT 0,
    revenue_generated NUMERIC(12, 2) NOT NULL DEFAULT 0,
    commission_rate NUMERIC(5, 2) DEFAULT 10.0, -- Percentage honorarium/referral incentive
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient Referral Log (Track specific referral transactions)
CREATE TABLE IF NOT EXISTS patient_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referring_doctor_id UUID NOT NULL REFERENCES referring_doctors(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(200) NOT NULL,
    procedure_name VARCHAR(200),
    bill_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    referral_fee NUMERIC(12, 2) DEFAULT 0,
    referral_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Admitted', -- 'Consultation', 'Admitted', 'Discharged', 'Commission Settled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient Feedback & NPS Management
CREATE TABLE IF NOT EXISTS patient_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_code VARCHAR(50) UNIQUE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    department VARCHAR(100) NOT NULL DEFAULT 'General Medicine',
    doctor_name VARCHAR(100),
    nps_score INT NOT NULL CHECK (nps_score BETWEEN 0 AND 10),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    category VARCHAR(20) NOT NULL, -- 'Promoter', 'Passive', 'Detractor'
    comment TEXT,
    aspects JSONB DEFAULT '{"doctorCare": 5, "cleanliness": 5, "nursingStaff": 5, "billingClarity": 5}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'Reviewed', -- 'Reviewed', 'Action Required', 'Resolved'
    follow_up_notes TEXT,
    survey_channel VARCHAR(30) DEFAULT 'Direct', -- 'WhatsApp', 'Email', 'SMS', 'Direct'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_feedbacks_patient ON patient_feedbacks(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_feedbacks_dept ON patient_feedbacks(department);
CREATE INDEX IF NOT EXISTS idx_patient_feedbacks_category ON patient_feedbacks(category);
CREATE INDEX IF NOT EXISTS idx_patient_feedbacks_status ON patient_feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_patient_feedbacks_created ON patient_feedbacks(created_at DESC);

