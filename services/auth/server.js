const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Auth service is running' });
});

app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}`);
});
