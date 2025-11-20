const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432
});

// Ensure table exists
(async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        lastname TEXT NOT NULL,
        age INT NOT NULL
      );
    `);
  } finally {
    client.release();
  }
})();

// Create
app.post('/clients', async (req, res) => {
  const { name, lastname, age } = req.body;
  const r = await pool.query('INSERT INTO clients (name, lastname, age) VALUES ($1,$2,$3) RETURNING *', [name, lastname, age]);
  res.status(201).json(r.rows[0]);
});

// Read all
app.get('/clients', async (req, res) => {
  const r = await pool.query('SELECT * FROM clients ORDER BY id');
  res.json(r.rows);
});

// Read one
app.get('/clients/:id', async (req, res) => {
  const r = await pool.query('SELECT * FROM clients WHERE id=$1', [req.params.id]);
  res.json(r.rows[0] || {});
});

// Update
app.put('/clients/:id', async (req, res) => {
  const { name, lastname, age } = req.body;
  const r = await pool.query('UPDATE clients SET name=$1, lastname=$2, age=$3 WHERE id=$4 RETURNING *', [name, lastname, age, req.params.id]);
  res.json(r.rows[0] || {});
});

// Delete
app.delete('/clients/:id', async (req, res) => {
  await pool.query('DELETE FROM clients WHERE id=$1', [req.params.id]);
  res.status(204).send();
});

app.listen(3000, () => console.log('listening on 3000'));