const authService = require('../services/authService');

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

async function signup(req, res, next) {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
      throw badRequest('email, password and name are required');
    }
    if (password.length < 8) {
      throw badRequest('password must be at least 8 characters');
    }

    const result = await authService.signup({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw badRequest('email and password are required');
    }

    const result = await authService.login({
      email: email.trim().toLowerCase(),
      password,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
