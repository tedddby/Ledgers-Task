const db = require('../models/db');

async function companyAccess(req, res, next) {
  const companyId = Number(req.params.id);
  if (!companyId) {
    return res.status(400).json({ error: 'Invalid company id' });
  }

  try {
    const [rows] = await db.query(
      'SELECT role FROM user_companies WHERE user_id = ? AND company_id = ?',
      [req.userId, companyId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'You do not have access to this company' });
    }

    req.companyId = companyId;
    req.companyRole = rows[0].role;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = companyAccess;
