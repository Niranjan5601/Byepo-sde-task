const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.post("/signup", async (req, res) => {
    const { email, password, role_id, organization_id } = req.body;
    const connection = await pool.getConnection();
    if (!email || !password || !role_id || !organization_id) {
        return res.status(400).json({ error: "'email, password, role, and organization_id are required" });
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    try {
        const [orgs] = await connection.query("SELECT * FROM organizations WHERE id = ?", [organization_id]);
        if (orgs.length === 0) {
            return res.status(400).json({ error: "Organization not found" });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await connection.query("INSERT INTO users (email, password_hash, role_id, organization_id) VALUES (?, ?, ?, ?)", [email.trim().toLowerCase(), passwordHash, role_id, organization_id]);

        const [users] = await connection.query(
            `SELECT u.id, u.email, u.role_id, u.organization_id, o.name AS organization_name
            FROM users u JOIN organizations o ON o.id = u.organization_id
            WHERE u.id = ?`,
            [result.insertId]
        );

        const token = jwt.sign({
            id: users[0].id,
            email: users[0].email,
            role_id: users[0].role_id,
            organization_id: users[0].organization_id,
            organization_name: users[0].organization_name
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user: users[0] });
    }
    catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Email already exists" });
        }
        console.error("Signup error:", e);
        res.status(500).json({ error: "An error occurred while creating the user" });
    }
    finally {
        connection.release();
    }
});


router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const connection = await pool.getConnection();

    if (!email || !password) {
        return res.status(400).json({ error: "'email and password are required" });
    };

    try {
        const [users] = await connection.query(
            `SELECT u.*, o.name AS organization_name
            FROM users u JOIN organizations o ON o.id = u.organization_id
            WHERE u.email = ?`,
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            organization_id: user.organization_id,
            organization_name: user.organization_name
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user });
    }
    catch (e) {
        console.error("Login error:", e);
        res.status(500).json({ error: "An error occurred while logging in" });
    }
    finally {
        connection.release();
    }
});


router.get("/organizations", async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const [organizations] = await connection.query("SELECT * FROM organizations ORDER BY name ASC");
        res.json(organizations);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
    finally {
        connection.release();
    }
})

module.exports = router;