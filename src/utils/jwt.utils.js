import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate Access JWT
 * @param {object} payload - { userId, email, role }
 * @returns {string}
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

/**
 * Generate Refresh JWT
 * @param {object} payload - { userId, email, role }
 * @returns {string}
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

/**
 * Verify Access Token
 * @param {string} token
 * @returns {object}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Verify Refresh Token
 * @param {string} token
 * @returns {object}
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
