const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { authenticateToken, authorizeRole } = require('../middleware/auth');


router.get("/", authenticateToken, authorizeRole(2), async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const [flags] = await connection.query("SELECT * FROM feature_flags WHERE organization_id = ?", [req.user.organization_id]);
        res.json(flags);
    }
    catch (e) {
        res.status(500).json({ error: "An error occurred while fetching feature flags" });
    }
    finally {
        connection.release();
    }
});

router.post("/", authenticateToken, authorizeRole(2), async (req, res) => {
    const { feature_key, description, enabled } = req.body;
    const connection = await pool.getConnection();

    const normalizedKey = feature_key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!normalizedKey) {
        return res.status(400).json({ error: 'feature_key contains invalid characters' });
    }
    try {
        const [result] = await connection.query(
            "INSERT INTO feature_flags (feature_key, description, enabled, organization_id) VALUES (?, ?, ?, ?)",
            [normalizedKey, description, enabled, req.user.organization_id]
        );
        res.status(201).json({ id: result.insertId, feature_key: normalizedKey, description, enabled });
    }
    catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "Feature key already exists" });
        }
        res.status(500).json({ error: "An error occurred while creating the feature flag" });
    }
    finally {
        connection.release();
    }
});

router.patch("/:id", authenticateToken, authorizeRole(2), async (req, res) => {
    const { description, enabled } = req.body;
    const { id } = req.params;
    const organization_id = req.user.organization_id;
    const connection = await pool.getConnection();
    try {
        const [flags] = await connection.query(
            "SELECT * FROM feature_flags WHERE id = ? AND organization_id = ?",
            [id, organization_id]
        );
        if (flags.length === 0) {
            return res.status(404).json({ error: "Feature flag not found" });
        }
        if ((description === undefined && enabled === undefined) || (description !== undefined && typeof description !== 'string') || (enabled !== undefined && typeof enabled !== 'boolean')) {
            return res.status(400).json({ error: "At least one of description or enabled must be provided, and types must be correct" });
        }

        const updateFields = [];
        const updateValues = [];

        if (description !== undefined) {
            updateFields.push("description = ?");
            updateValues.push(description);
        }
        if (enabled !== undefined) {
            updateFields.push("enabled = ?");
            updateValues.push(enabled);
        }

        updateValues.push(id);
        updateValues.push(organization_id);

        await connection.query(
            `UPDATE feature_flags SET ${updateFields.join(", ")} WHERE id = ? AND organization_id = ?`,
            updateValues
        );
        res.json({ message: "Feature flag updated successfully" });
    }
    catch (e) {
        console.error("Update flag error:", e);
        res.status(500).json({ error: "An error occurred while updating the feature flag" });
    }
    finally {
        connection.release();
    }
});

router.delete("/:id", authenticateToken, authorizeRole(2), async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        const [result] = await connection.query(
            "DELETE FROM feature_flags WHERE id = ? AND organization_id = ?",
            [id, req.user.organization_id]
        );
        res.json({ message: "Feature flag deleted successfully" });
    }
    catch (e) {
        res.status(500).json({ error: "An error occurred while deleting the feature flag" });
    }
    finally {
        connection.release();
    }
});


router.get("/check", authenticateToken, authorizeRole(3), async (req, res) => {
    const { feature_key } = req.query;

    if (!feature_key || !feature_key.trim()) {
        return res.status(400).json({ error: "feature_key query parameter is required" });
    }

    const connection = await pool.getConnection();

    try {
        const [flags] = await connection.query(
            "SELECT * FROM feature_flags WHERE feature_key = ? AND organization_id = ?",
            [feature_key.trim(), req.user.organization_id]
        );
        if (flags.length === 0) {
            return res.status(404).json({ error: "Feature flag not found" });
        }
        res.json({ enabled: flags[0].enabled });
    } catch (e) {
        console.error("Check flag error:", e);
        res.status(500).json({ error: "An error occurred while checking the feature flag" });
    } finally {
        connection.release();
    }
});

module.exports = router;