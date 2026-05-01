const db = require('../models/db');

const VALID_TYPES = ['revenue', 'expense'];

async function create(companyId, { type, amount, description, occurred_on }) {
  if (!VALID_TYPES.includes(type)) {
    const err = new Error("type must be 'revenue' or 'expense'");
    err.status = 400;
    throw err;
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const err = new Error('amount must be a positive number');
    err.status = 400;
    throw err;
  }

  if (!occurred_on || Number.isNaN(Date.parse(occurred_on))) {
    const err = new Error('occurred_on must be a valid date (YYYY-MM-DD)');
    err.status = 400;
    throw err;
  }

  const [result] = await db.query(
    `INSERT INTO transactions (company_id, type, amount, description, occurred_on)
     VALUES (?, ?, ?, ?, ?)`,
    [companyId, type, numericAmount.toFixed(2), description || null, occurred_on]
  );

  return {
    id: result.insertId,
    company_id: companyId,
    type,
    amount: numericAmount,
    description: description || null,
    occurred_on,
  };
}

async function listForCompany(companyId, { limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [rows] = await db.query(
    `SELECT id, company_id, type, amount, description, occurred_on, created_at
     FROM transactions
     WHERE company_id = ?
     ORDER BY occurred_on DESC, id DESC
     LIMIT ? OFFSET ?`,
    [companyId, safeLimit, safeOffset]
  );

  return rows;
}

module.exports = { create, listForCompany };
