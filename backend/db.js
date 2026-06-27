const mysql = require("mysql2/promise");
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function initDb() {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS organizations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        feature_key VARCHAR(255) NOT NULL,
        description VARCHAR(500),
        enabled BOOLEAN NOT NULL DEFAULT false,
        organization_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_flag_per_org (feature_key, organization_id),
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                organization_id INT,
                role_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
            )
        `);

        await connection.query(`
            INSERT INTO roles (name, description) VALUES
                ('superadmin', 'Super admin'),
                ('org_admin', 'Organization admin'),
                ('user', 'end user')
            ON DUPLICATE KEY UPDATE
                description = VALUES(description)
        `);

    }
    catch (e) {
        console.error("Error initializing database:", e);
    }
    finally {
        connection.release();
    }
}

module.exports = { pool, initDb };