export function validateCreatePatientInput(data = {}) {
  const errors = [];
  const { firstName, lastName, dob, gender, phone, email, department, source } = data;

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'First name must be at least 2 characters long' });
  }

  if (!dob || typeof dob !== 'string') {
    errors.push({ field: 'dob', message: 'Valid date of birth is required' });
  }

  if (!gender || !['M', 'F', 'O'].includes(gender)) {
    errors.push({ field: 'gender', message: 'Gender must be M, F, or O' });
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    errors.push({ field: 'phone', message: 'Valid phone number is required (min 8 digits)' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      firstName: firstName ? firstName.trim() : '',
      lastName: lastName ? lastName.trim() : '',
      dob: dob ? dob.trim() : '',
      gender: gender ? gender.trim() : 'M',
      phone: phone ? phone.trim() : '',
      email: email && typeof email === 'string' ? email.trim().toLowerCase() : null,
      department: department && typeof department === 'string' ? department.trim() : 'General Medicine',
      source: source && typeof source === 'string' ? source.trim() : 'Walk-in',
    },
  };
}

export function validateUpdatePatientInput(data = {}) {
  const errors = [];
  const { firstName, lastName, dob, gender, phone, email, abha, department, source, status, statusType } = data;

  if (firstName !== undefined && (typeof firstName !== 'string' || firstName.trim().length < 2)) {
    errors.push({ field: 'firstName', message: 'First name must be at least 2 characters long' });
  }

  if (phone !== undefined && (typeof phone !== 'string' || phone.trim().length < 8)) {
    errors.push({ field: 'phone', message: 'Valid phone number is required (min 8 digits)' });
  }

  if (gender !== undefined && !['M', 'F', 'O'].includes(gender)) {
    errors.push({ field: 'gender', message: 'Gender must be M, F, or O' });
  }

  if (abha !== undefined && !['Linked', 'Pending'].includes(abha)) {
    errors.push({ field: 'abha', message: 'ABHA status must be either Linked or Pending' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      firstName: firstName !== undefined ? firstName.trim() : undefined,
      lastName: lastName !== undefined ? lastName.trim() : undefined,
      dob: dob !== undefined ? dob.trim() : undefined,
      gender: gender !== undefined ? gender.trim() : undefined,
      phone: phone !== undefined ? phone.trim() : undefined,
      email: email !== undefined ? (email ? email.trim().toLowerCase() : null) : undefined,
      abha: abha !== undefined ? abha : undefined,
      department: department !== undefined ? department.trim() : undefined,
      source: source !== undefined ? source.trim() : undefined,
      status: status !== undefined ? status.trim() : undefined,
      statusType: statusType !== undefined ? statusType.trim() : undefined,
    },
  };
}
