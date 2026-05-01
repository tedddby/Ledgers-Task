const db = require('../models/db');
const hash = require('../utils/hash');
const token = require('../utils/token');

async function signup({ email, password, name }) {
  const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const passwordHash = await hash.hash(password);
  const [result] = await db.query(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
    [email, passwordHash, name]
  );

  const userId = result.insertId;
  return {
    token: token.sign({ userId }),
    user: { id: userId, email, name },
  };
}

async function login({ email, password }) {
  const [rows] = await db.query(
    'SELECT id, email, name, password_hash FROM users WHERE email = ?',
    [email]
  );

  const user = rows[0];
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const ok = await hash.verify(password, user.password_hash);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  return {
    token: token.sign({ userId: user.id }),
    user: { id: user.id, email: user.email, name: user.name },
  };
}

module.exports = { signup, login };
