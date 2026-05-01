const companyService = require('../services/companyService');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

async function create(req, res, next) {
  try {
    const { name } = req.body || {};
    if (!name || !name.trim()) {
      throw badRequest('name is required');
    }

    const company = await companyService.createCompany(req.userId, name.trim());
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const companies = await companyService.listForUser(req.userId);
    res.json(companies);
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email || !email.trim()) {
      throw badRequest('email is required');
    }

    const member = await companyService.addMember(
      req.companyId,
      req.companyRole,
      email.trim().toLowerCase()
    );
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, addMember };
