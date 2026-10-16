import { query, withTransaction } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.utils.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class AuthService {
  /**
   * User login with email and password
   */
  static async login({ email, password, ipAddress = null }) {
    // 1. Fetch user by email
    const userRes = await query(
      `SELECT id, email, password, name, role, department, phone, avatar_url, is_active 
       FROM users 
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = userRes.rows[0];

    // 2. Check if account is active
    if (!user.is_active) {
      throw new AppError(
        'Account deactivated. Please contact your hospital administrator.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // 3. Verify password hash
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', HTTP_STATUS.UNAUTHORIZED);
    }

    // 4. Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 5. Save refresh token in database (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    // 6. Update last login timestamp & audit log
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    await query(
      `INSERT INTO audit_logs (user_id, action, details, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, 'USER_LOGIN', JSON.stringify({ email: user.email }), ipAddress]
    );

    // 7. Return sanitized user and tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        phone: user.phone,
        avatarUrl: user.avatar_url,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '1d',
      },
    };
  }

  /**
   * Register a new user
   */
  static async register({ email, password, name, role = 'ADMIN', department = null, phone = null }) {
    // 1. Check existing email
    const existing = await query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw new AppError('An account with this email already exists', HTTP_STATUS.CONFLICT);
    }

    // 2. Hash password
    const hashedPassword = await hashPassword(password);

    // 3. Insert user record
    const insertRes = await query(
      `INSERT INTO users (email, password, name, role, department, phone, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, email, name, role, department, phone, created_at`,
      [email.toLowerCase(), hashedPassword, name, role, department, phone]
    );

    return insertRes.rows[0];
  }

  /**
   * Refresh Access Token using valid Refresh Token
   */
  static async refreshAccessToken(refreshToken) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid or expired refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Check token in database
    const tokenRes = await query(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.email, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1`,
      [refreshToken]
    );

    if (tokenRes.rows.length === 0) {
      throw new AppError('Refresh token revoked or invalid', HTTP_STATUS.UNAUTHORIZED);
    }

    const tokenRecord = tokenRes.rows[0];

    if (new Date(tokenRecord.expires_at) < new Date()) {
      await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
      throw new AppError('Refresh token has expired. Please login again.', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!tokenRecord.is_active) {
      throw new AppError('User account is deactivated.', HTTP_STATUS.FORBIDDEN);
    }

    // Generate new Access Token
    const newAccessToken = generateAccessToken({
      userId: tokenRecord.user_id,
      email: tokenRecord.email,
      role: tokenRecord.role,
    });

    return {
      accessToken: newAccessToken,
      expiresIn: '1d',
    };
  }

  /**
   * Logout user by revoking refresh token
   */
  static async logout(refreshToken) {
    if (refreshToken) {
      await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
    }
    return true;
  }

  /**
   * Get current authenticated user profile
   */
  static async getCurrentUser(userId) {
    const res = await query(
      `SELECT id, email, name, role, department, phone, avatar_url, is_active, last_login_at, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      throw new AppError('User profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return res.rows[0];
  }
}
