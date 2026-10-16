export function validateAppointmentInput(data = {}) {
  const errors = [];
  const { patientName, doctorName, department, appointmentDate, timeSlot } = data;

  if (!patientName || typeof patientName !== 'string' || patientName.trim().length < 2) {
    errors.push({ field: 'patientName', message: 'Patient name is required (min 2 characters)' });
  }

  if (!doctorName || typeof doctorName !== 'string' || doctorName.trim().length < 2) {
    errors.push({ field: 'doctorName', message: 'Doctor name is required' });
  }

  if (!appointmentDate || typeof appointmentDate !== 'string') {
    errors.push({ field: 'appointmentDate', message: 'Appointment date is required' });
  }

  if (!timeSlot || typeof timeSlot !== 'string') {
    errors.push({ field: 'timeSlot', message: 'Time slot is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      patientName: patientName ? patientName.trim() : '',
      patientUhid: data.patientUhid ? data.patientUhid.trim() : null,
      patientId: data.patientId || null,
      doctorName: doctorName ? doctorName.trim() : '',
      doctorId: data.doctorId || null,
      department: department && typeof department === 'string' ? department.trim() : 'General Medicine',
      appointmentDate: appointmentDate ? appointmentDate.trim() : '',
      timeSlot: timeSlot ? timeSlot.trim() : '09:30 AM',
      source: data.source && typeof source === 'string' ? data.source.trim() : 'Walk-in',
      status: data.status && typeof data.status === 'string' ? data.status.trim() : 'Booked',
      statusType: data.statusType || 'neutral',
      notes: data.notes ? data.notes.trim() : null,
    },
  };
}

export function validateUpdateAppointmentInput(data = {}) {
  const errors = [];
  const { status, timeSlot, appointmentDate, doctorName, notes } = data;

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      status: status !== undefined ? status.trim() : undefined,
      statusType: data.statusType !== undefined ? data.statusType.trim() : undefined,
      timeSlot: timeSlot !== undefined ? timeSlot.trim() : undefined,
      appointmentDate: appointmentDate !== undefined ? appointmentDate.trim() : undefined,
      doctorName: doctorName !== undefined ? doctorName.trim() : undefined,
      notes: notes !== undefined ? notes.trim() : undefined,
    },
  };
}
