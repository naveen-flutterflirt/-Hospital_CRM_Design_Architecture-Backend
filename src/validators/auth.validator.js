import { ALL_ROLES } from '../constants/roles.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate login request payload
 */
export function validateLoginInput(data = {}) {
  const errors = [];
  const { email, password } = data;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      email: email ? email.trim().toLowerCase() : '',
      password: password || '',
    },
  };
}

/**
 * Validate registration request payload
 */
export function validateRegisterInput(data = {}) {
  const errors = [];
  const { email, password, name, role, department, phone } = data;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }

  if (role && !ALL_ROLES.includes(role)) {
    errors.push({
      field: 'role',
      message: `Role must be one of: ${ALL_ROLES.join(', ')}`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      email: email ? email.trim().toLowerCase() : '',
      password: password || '',
      name: name ? name.trim() : '',
      role: role || 'ADMIN',
      department: department ? department.trim() : null,
      phone: phone ? phone.trim() : null,
    },
  };
}

/**
 * Validate refresh token request payload
 */
export function validateRefreshTokenInput(data = {}) {
  const errors = [];
  const { refreshToken } = data;

  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
    errors.push({ field: 'refreshToken', message: 'Refresh token is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      refreshToken: refreshToken ? refreshToken.trim() : '',
    },
  };
}
