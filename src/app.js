const express = require('express');
const dotenv = require('dotenv');
const { runMigrations } = require('./services/migrationsservices');

dotenv.config();

const app = express();

app.use(express.json());

// Ejecutar migraciones al iniciar
runMigrations().catch(console.error);

// Routes
const productRoutes = require('./routes/productroutes');
const analyticsRoutes = require('./routes/analyticsroutes');

app.use('/products', productRoutes);
app.use('/analytics', analyticsRoutes);

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
;
