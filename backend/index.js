const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDb } = require('./db');
const app = express();
const authRoutes = require('./routes/auth');
const superAdminRoutes = require('./routes/superAdmin');
const flagsRoutes = require('./routes/flags');

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/superadmin',superAdminRoutes );
app.use('/api/flags', flagsRoutes);

async function startServer() {
    try {
        await initDb();
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
            console.log(`Superadmin email: ${process.env.SUPER_ADMIN_EMAIL}, Superadmin password: ${process.env.SUPER_ADMIN_PASSWORD}`);
        })
    }
    catch (e) {
        console.error("Error starting server:", e);
        process.exit(1);
    }
}

startServer();