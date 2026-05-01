const dashboardService = require('../services/dashboardService');

async function getDashboard(req, res, next) {
  try {
    const metrics = await dashboardService.getMetrics(req.companyId);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
