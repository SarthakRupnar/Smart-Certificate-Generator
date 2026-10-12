const express = require("express");
const crypto = require("crypto");

const db = require("../db");

const {
    authenticateToken,
    requireAdmin
} = require("../middleware/auth");

const router = express.Router();

// Create a certificate
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const {
                recipient_name,
                recipient_email,
                course_name,
                issue_date
            } = req.body;

            if (!recipient_name || !course_name) {
                return res.status(400).json({
                    message: "Recipient name and course name are required."
                });
            }

            const selectedDate =
                issue_date ||
                new Date().toISOString().slice(0, 10);

            if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
                return res.status(400).json({
                    message: "Issue date must use YYYY-MM-DD format."
                });
            }

            const certificateId =
                "CERT-" +
                crypto.randomBytes(6).toString("hex").toUpperCase();

            await db.execute(
                `INSERT INTO certificates
                (
                    certificate_id,
                    recipient_name,
                    recipient_email,
                    course_name,
                    issue_date,
                    issued_by
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    certificateId,
                    recipient_name,
                    recipient_email || null,
                    course_name,
                    selectedDate,
                    req.user.id
                ]
            );

            return res.status(201).json({
                message: "Certificate record created successfully.",
                certificate: {
                    certificate_id: certificateId,
                    recipient_name,
                    recipient_email: recipient_email || null,
                    course_name,
                    issue_date: selectedDate
                }
            });

        } catch (error) {
            console.error("Certificate creation error:", error.message);

            return res.status(500).json({
                message: "Unable to create certificate."
            });
        }
    }
);

// Get all certificates
router.get(
    "/",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const [certificates] = await db.execute(
                `SELECT
                    c.id,
                    c.certificate_id,
                    c.recipient_name,
                    c.recipient_email,
                    c.course_name,
                    c.issue_date,
                    c.created_at,
                    u.name AS issued_by_name
                 FROM certificates c
                 LEFT JOIN users u ON c.issued_by = u.id
                 ORDER BY c.created_at DESC`
            );

            return res.json(certificates);

        } catch (error) {
            console.error("Certificate retrieval error:", error.message);

            return res.status(500).json({
                message: "Unable to retrieve certificates."
            });
        }
    }
);

// Get a certificate by its ID
router.get("/verify/:certificateId", async (req, res) => {
    try {
        const { certificateId } = req.params;

        const [certificates] = await db.execute(
            `SELECT
                certificate_id,
                recipient_name,
                course_name,
                issue_date
             FROM certificates
             WHERE certificate_id = ?`,
            [certificateId]
        );

        if (certificates.length === 0) {
            return res.status(404).json({
                message: "Certificate not found."
            });
        }

        return res.json({
            valid: true,
            certificate: certificates[0]
        });

    } catch (error) {
        console.error("Certificate verification error:", error.message);

        return res.status(500).json({
            message: "Unable to verify certificate."
        });
    }
});

// Delete a certificate
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isSafeInteger(id) || id <= 0) {
                return res.status(400).json({
                    message: "Invalid certificate ID."
                });
            }

            const [result] = await db.execute(
                "DELETE FROM certificates WHERE id = ?",
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Certificate not found."
                });
            }

            return res.json({
                message: "Certificate deleted successfully."
            });

        } catch (error) {
            console.error("Certificate deletion error:", error.message);

            return res.status(500).json({
                message: "Unable to delete certificate."
            });
        }
    }
);

module.exports = router;