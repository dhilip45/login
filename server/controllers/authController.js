const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates and normalizes an email address string.
 */
function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Registers a new user with a bcrypt-hashed password in MySQL.
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const normalizedEmail = normalizeEmail(email);

    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters.',
      });
    }

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters.',
      });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [trimmedName, normalizedEmail, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: {
        id: result.insertId,
        name: trimmedName,
        email: normalizedEmail,
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    return next(error);
  }
}

/**
 * Authenticates a user by comparing the submitted password against the bcrypt hash in MySQL.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (typeof password !== 'string' || password.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, password, created_at FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
};
