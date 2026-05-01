const db = require('../models/db');

async function createCompany(userId, name) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO companies (name) VALUES (?)',
      [name]
    );
    const companyId = result.insertId;

    await conn.query(
      'INSERT INTO user_companies (user_id, company_id, role) VALUES (?, ?, ?)',
      [userId, companyId, 'owner']
    );

    await conn.commit();
    return { id: companyId, name, role: 'owner' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function listForUser(userId) {
  const [rows] = await db.query(
    `SELECT c.id, c.name, c.created_at, uc.role
     FROM companies c
     JOIN user_companies uc ON uc.company_id = c.id
     WHERE uc.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
}

async function addMember(companyId, requesterRole, email) {
  if (requesterRole !== 'owner') {
    const err = new Error('Only an owner can add members');
    err.status = 403;
    throw err;
  }

  const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  const user = users[0];
  if (!user) {
    const err = new Error('No user found with that email');
    err.status = 404;
    throw err;
  }

  const [existing] = await db.query(
    'SELECT user_id FROM user_companies WHERE user_id = ? AND company_id = ?',
    [user.id, companyId]
  );
  if (existing.length > 0) {
    const err = new Error('User is already a member of this company');
    err.status = 409;
    throw err;
  }

  await db.query(
    'INSERT INTO user_companies (user_id, company_id, role) VALUES (?, ?, ?)',
    [user.id, companyId, 'member']
  );

  return { userId: user.id, companyId, role: 'member' };
}

module.exports = { createCompany, listForUser, addMember };
