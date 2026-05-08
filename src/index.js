require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/db');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' })); // puerto de Vite
app.use(express.json());

//rutas
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/tickets', require('./routes/ticket.route'));
app.use('/api/agentes', require('./routes/agente.route'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor corriendo' });
});

const PORT = process.env.PORT || 3000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});