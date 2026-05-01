require('dotenv').config();

const app = require('./src/app');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Ledgers backend listening on http://localhost:${port}`);
});
