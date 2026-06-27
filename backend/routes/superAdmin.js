const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (email !== process.env.SUPER_ADMIN_EMAIL || password !== process.env.SUPER_ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({
        email: email,
        role_id: 1
    }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, email, role_id: 1 });

});


router.post("/organizations", authenticateToken, authorizeRole(1), async (req, res) => {
    const { org_name } = req.body;
    const connection = await pool.getConnection();

    if (!org_name || org_name.trim() === "") {
        return res.status(400).json({ error: "Organization name is required" });
    }

    try {
        const [result] = await connection.query("INSERT INTO organizations (name) VALUES (?)", [org_name.trim()]);

        const [organization] = await connection.query("SELECT * FROM organizations WHERE id = ?", [result.insertId]);

        res.status(201).json(organization[0]);
    }
    catch (e) {
        res.status(500).json({ error: "An error occurred while creating the organization" });
    }
    finally {
        connection.release();
    }
});

router.get("/organizations", authenticateToken, authorizeRole(1), async (req, res) => {
        const connection = await pool.getConnection();

    try {
        const [organizations] = await connection.query(`
            SELECT
            o.*,
            COUNT(DISTINCT u.id) AS user_count,
            COUNT(DISTINCT ff.id) AS flag_count
            FROM organizations o
            LEFT JOIN users u ON u.organization_id = o.id
            LEFT JOIN feature_flags ff ON ff.organization_id = o.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
            `);
        res.json(organizations);
    }
    catch (e) {
        res.status(500).json({ error: "An error occurred while fetching organizations" });
    }
    finally {
        connection.release();
    }
});

module.exports = router;