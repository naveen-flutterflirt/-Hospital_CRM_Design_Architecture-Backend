export function validateDoctorInput(data = {}) {
  const errors = [];
  const { name, specialty, phone, department } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Doctor name is required (min 3 characters)' });
  }

  if (!specialty || typeof specialty !== 'string' || specialty.trim().length < 2) {
    errors.push({ field: 'specialty', message: 'Specialty is required' });
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    errors.push({ field: 'phone', message: 'Valid phone number is required (min 8 digits)' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: name ? name.trim() : '',
      specialty: specialty ? specialty.trim() : '',
      department: department && typeof department === 'string' ? department.trim() : 'General Medicine',
      qualification: data.qualification ? data.qualification.trim() : '',
      registrationNo: data.registrationNo ? data.registrationNo.trim() : '',
      phone: phone ? phone.trim() : '',
      email: data.email ? data.email.trim().toLowerCase() : null,
      opdRoom: data.opdRoom ? data.opdRoom.trim() : 'Room 101',
      consultationFee: data.consultationFee ? Number(data.consultationFee) : 500,
      availableTiming: data.availableTiming ? data.availableTiming.trim() : 'Mon - Sat (09:00 AM - 01:00 PM)',
      status: data.status && ['Active', 'On Leave', 'Inactive'].includes(data.status) ? data.status : 'Active',
    },
  };
}
