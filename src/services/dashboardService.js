const db = require('../models/db');

async function getMetrics(companyId) {
  const [rows] = await db.query(
    `SELECT type, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE company_id = ?
     GROUP BY type`,
    [companyId]
  );

  const totals = { revenue: 0, expense: 0 };
  for (const row of rows) {
    totals[row.type] = Number(row.total);
  }

  return {
    totalRevenue: totals.revenue,
    totalExpenses: totals.expense,
    net: totals.revenue - totals.expense,
  };
}

module.exports = { getMetrics };
