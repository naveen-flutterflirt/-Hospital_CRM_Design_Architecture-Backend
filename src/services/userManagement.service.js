import { query } from '../config/db.js';
import { hashPassword } from '../utils/password.utils.js';
import { EmailService } from './email.service.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class UserManagementService {
  /**
   * Get all registered users for Roles & Access table
   */
  static async getAllUsers() {
    const res = await query(`
      SELECT id, name, email, role, department, phone, is_active, created_at, last_login_at
      FROM users
      ORDER BY 
        CASE 
          WHEN role = 'SUPER_ADMIN' THEN 1
          WHEN role = 'ADMIN' THEN 2
          WHEN role = 'MARKETING' THEN 3
          ELSE 4
        END,
        created_at DESC
    `);
    return res.rows;
  }

  /**
   * Create a new user account with email & password, and send email credentials
   */
  static async createUserAccess({ name, email, password, role, department, phone }) {
    if (!email || !password || !name) {
      throw new AppError('Name, email, and password are required', HTTP_STATUS.BAD_REQUEST);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const checkUser = await query(`SELECT id FROM users WHERE email = $1`, [normalizedEmail]);
    if (checkUser.rows.length > 0) {
      throw new AppError('A user with this email address already exists', HTTP_STATUS.CONFLICT);
    }

    // Role normalization: 'ADMIN', 'MARKETING', 'DOCTOR', 'RECEPTIONIST'
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MARKETING', 'DOCTOR', 'RECEPTIONIST'];
    const assignedRole = allowedRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'ADMIN';

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Insert user into Neon PostgreSQL
    const res = await query(`
      INSERT INTO users (name, email, password, role, department, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE)
      RETURNING id, name, email, role, department, phone, is_active, created_at
    `, [name.trim(), normalizedEmail, hashedPassword, assignedRole, department || null, phone || null]);

    const newUser = res.rows[0];

    // Dispatch email notification with credentials
    await EmailService.sendUserCredentials({
      toEmail: newUser.email,
      name: newUser.name,
      role: newUser.role,
      tempPassword: password
    });

    return newUser;
  }

  /**
   * Update a user's role or status
   */
  static async updateUserRole(userId, { role, is_active }) {
    const res = await query(`
      UPDATE users
      SET 
        role = COALESCE($1, role),
        is_active = COALESCE($2, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, email, role, department, is_active
    `, [role ? role.toUpperCase() : null, typeof is_active === 'boolean' ? is_active : null, userId]);

    if (res.rows.length === 0) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return res.rows[0];
  }

  /**
   * Delete a user
   */
  static async deleteUser(userId) {
    const checkUser = await query(`SELECT role FROM users WHERE id = $1`, [userId]);
    if (checkUser.rows.length === 0) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (checkUser.rows[0].role === 'SUPER_ADMIN') {
      throw new AppError('Super Admin accounts cannot be deleted', HTTP_STATUS.FORBIDDEN);
    }

    // Clean up dependent records safely
    await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
    await query(`DELETE FROM audit_logs WHERE user_id = $1`, [userId]);

    await query(`DELETE FROM users WHERE id = $1`, [userId]);
    return { id: userId, deleted: true };
  }
}
