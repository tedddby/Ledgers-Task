const transactionService = require('../services/transactionService');

async function create(req, res, next) {
  try {
    const tx = await transactionService.create(req.companyId, req.body || {});
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const transactions = await transactionService.listForCompany(req.companyId, {
      limit,
      offset,
    });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list };
