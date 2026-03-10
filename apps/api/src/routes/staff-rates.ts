import { logger } from "@packages/utils";
import { Router } from "express";
import pool from "../utils/db";

const router = Router();

router.get("/", async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT s.id, s.name, s.surname, r.hourly_rate AS rate
			FROM proposal_generator.staff s
			JOIN proposal_generator.rates r ON r.staff_id = s.id
			ORDER BY r.hourly_rate DESC, s.name ASC`,
		);
		res.json(result.rows.map((r) => ({ ...r, rate: Number(r.rate) })));
	} catch (err: unknown) {
		logger.error(err, "Error fetching staff rates");
		res.status(500).json({ error: "Database Error", message: String(err) });
	}
});

export default router;
