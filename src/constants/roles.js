/**
 * System-wide User Roles for Role-Based Access Control (RBAC)
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  BILLING: 'BILLING',
  MARKETING: 'MARKETING',
});

export const ALL_ROLES = Object.values(ROLES);
