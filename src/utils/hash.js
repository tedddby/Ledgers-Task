const bcrypt = require('bcryptjs');

const ROUNDS = 10;

async function hash(password) {
  return bcrypt.hash(password, ROUNDS);
}

async function verify(password, hashed) {
  return bcrypt.compare(password, hashed);
}

module.exports = { hash, verify };
