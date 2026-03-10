import { Router } from "express";
import pool from "../utils/db";

const router = Router();

router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT id, name, surname FROM proposal_generator.staff ORDER BY name ASC"
		);
		res.json(result.rows);
	} catch (err: any) {
		console.error("Database query error:", err);
		res.status(500).json({
			error: "Database Error",
			message: err.message || "Unknown error occurred while fetching data",
		});
	}
});

export default router;
