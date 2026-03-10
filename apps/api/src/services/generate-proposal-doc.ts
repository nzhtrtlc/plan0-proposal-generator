import fs from "node:fs";
import path from "node:path";
import type { GenerateProposalPayload } from "@packages/types";
import { Division } from "@packages/types";
import { logger, toUpperCase } from "@packages/utils";
import Docxtemplater from "docxtemplater";

// biome-ignore lint/suspicious/noExplicitAny: no types for this module
const ImageModule = require("docxtemplater-image-module-free");

import type { Request, Response } from "express";
import PizZip from "pizzip";
import pool from "../utils/db";

const SIGNATURES_DIR = path.resolve(__dirname, "..", "..", "signatures");

type BioEntry = {
	name: string;
	industry_experience: string;
	positions_held: string;
	accreditations: string | null;
	seminars_boards: string;
	division: Division;
};

export async function generateProposalDocx(req: Request, res: Response) {
	logger.info({ body: req.body }, "--> RECEIVED REQUEST generateProposalDocx");
	try {
		const {
			date,
			bios,
			listOfServices,
			signatures,
			notes,
			fee,
		}: GenerateProposalPayload = req.body;

		// Fetch bios from DB based on IDs
		let biosList: BioEntry[] = [];
		if (bios && bios.length > 0) {
			const result = await pool.query(
				`SELECT s.name || ' ' || s.surname AS name,
                    b.industry_experience, b.positions_held, b.accreditations, b.seminars_boards, b.division
                FROM proposal_generator."bios" b
                JOIN proposal_generator.staff s ON b.staff_id = s.id
                WHERE b.id = ANY($1)`,
				[bios],
			);
			biosList = result.rows.map((b) => ({
				...b,
				division: Division[b.division as keyof typeof Division] || null,
			}));

			logger.info({ bios: biosList }, "Fetched bios from DB");
		}

		// Group bios by division
		const grouped = new Map<string, BioEntry[]>();
		for (const bio of biosList) {
			const key = bio.division ?? "Other";
			const existing = grouped.get(key) ?? [];
			grouped.set(key, [...existing, bio]);
		}
		const biosKeyConsulting = grouped.get(Division.key_cost_consulting_staff) ?? [];
		const biosSections = Array.from(grouped.entries())
			.filter(([div]) => div !== Division.key_cost_consulting_staff)
			.map(([divisionName, bios]) => ({ divisionName: divisionName.toUpperCase(), bios }));

		// Fetch staff names for signatures and build image paths
		let signature1: string | null = null;
		let signatureName1 = "";
		let signature2: string | null = null;
		let signatureName2 = "";

		if (signatures && signatures.length > 0) {
			const sigResult = await pool.query(
				"SELECT id, name, surname FROM proposal_generator.staff WHERE id = ANY($1)",
				[signatures],
			);
			const rows = sigResult.rows;
			if (rows[0]) {
				signature1 = path.join(
					SIGNATURES_DIR,
					`${toUpperCase(rows[0].name)}.png`,
				);
				signatureName1 = `${toUpperCase(rows[0].name)} ${toUpperCase(rows[0].surname)}`;
			}
			if (rows[1]) {
				signature2 = path.join(
					SIGNATURES_DIR,
					`${toUpperCase(rows[1].name)}.png`,
				);
				signatureName2 = `${toUpperCase(rows[1].name)} ${toUpperCase(rows[1].surname)}`;
			}
		}

		// Parse notes into bullet items and closing text
		const noteLines = (notes || "").split("\n");
		const lastBulletIndex = noteLines.reduce(
			(last, line, i) => (line.trimStart().startsWith("*") ? i : last),
			-1,
		);
		const notes_bullets = noteLines
			.slice(0, lastBulletIndex + 1)
			.filter((line) => line.trimStart().startsWith("*"))
			.map((line) => ({ text: line.trimStart().replace(/^\*\s*/, "") }));
		const notes_closing = noteLines
			.slice(lastBulletIndex + 1)
			.join("\n")
			.trim();

		const selectedServices = new Set(listOfServices || []);
		const serviceFlags = {
			has_concept_to_completion: selectedServices.has("concept_to_completion"),
			has_cost_planning: selectedServices.has("cost_planning"),
			has_project_monitoring: selectedServices.has("project_monitoring"),
		};

		const templatePath = path.resolve(
			__dirname,
			"..",
			"..",
			"proposal-template.docx",
		);

		const PAGE_BREAK_XML = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;

		console.log("Loading template from:", templatePath);
		if (!fs.existsSync(templatePath)) {
			console.error("Template not found at:", templatePath);
			return res.status(500).json({
				message: "Template file not found",
				templatePath,
			});
		}

		const templateBuf = fs.readFileSync(templatePath);
		console.log("Template loaded successfully, size:", templateBuf.length);

		const zip = new PizZip(templateBuf);
		const doc = new Docxtemplater(zip, {
			modules: [
				new ImageModule({
					centered: false,
					fileType: "docx",
					getImage(filePath: string) {
						if (!fs.existsSync(filePath)) return null;
						return fs.readFileSync(filePath);
					},
					getSize() {
						return [150, 60];
					},
				}),
			],
			paragraphLoop: true,
			linebreaks: true,
			nullGetter: () => "",
			parser(tag) {
				const parts = tag.split(".");
				return {
					get(scope: Record<string, unknown>) {
						if (tag === ".") return scope;
						// biome-ignore lint/suspicious/noExplicitAny: traversing arbitrary nested data
						let s: any = scope;
						for (const key of parts) {
							if (s == null) return "";
							s = s[key];
						}
						return s ?? "";
					},
				};
			},
		});

		const sectionTotal = (key: string) => {
			const s = fee.sections?.[key];
			if (!s) return null;
			return (
				s.suggestedFee ??
				s.lines.reduce(
					(sum: number, l: { lineTotal: number }) => sum + l.lineTotal,
					0,
				)
			);
		};

		const formatCurrency = (value: number | null) =>
			value != null ? `$${Math.round(value).toLocaleString("en-US")}` : "";

		const templateData = {
			...req.body,
			date: date || new Date().toISOString(),
			bios: biosList,
			hasKeyConsulting: biosKeyConsulting.length > 0,
			biosKeyConsulting,
			biosSections,
			signature1,
			signatureName1,
			signature2,
			signatureName2,
			notes_bullets,
			notes_closing,
			hasFeeEstimate: !!fee.sections?.Estimating,
			hasFeeProforma: !!fee.sections?.Proforma,
			feeEstimateTotal: formatCurrency(sectionTotal("Estimating")),
			feeProformaTotal: formatCurrency(sectionTotal("Proforma")),
			feeFinalTotal: formatCurrency(fee.total ?? null),
			...serviceFlags,
			has_concept_to_completion_break: serviceFlags.has_concept_to_completion
				? PAGE_BREAK_XML
				: "",
			has_cost_planning_break: serviceFlags.has_cost_planning
				? PAGE_BREAK_XML
				: "",
			has_project_monitoring_break: serviceFlags.has_project_monitoring
				? PAGE_BREAK_XML
				: "",
		};

		console.log(
			"Template data being sent:",
			JSON.stringify(templateData, null, 2),
		);

		// Render the document
		doc.render(templateData);

		console.log("Template rendered successfully");

		// Generate the output buffer
		const out = doc.getZip().generate({
			type: "nodebuffer",
			compression: "DEFLATE",
		});

		res.setHeader(
			"Content-Type",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		);
		res.setHeader(
			"Content-Disposition",
			'attachment; filename="proposal-output.docx"',
		);
		res.send(out);
		// biome-ignore lint/suspicious/noExplicitAny: <any is used for error handling>
	} catch (err: any) {
		console.error("CRITICAL ERROR in generateProposalDocx:", err);

		// Better error logging for docxtemplater errors
		if (err.properties?.errors) {
			console.error(
				"Docxtemplater errors:",
				JSON.stringify(err.properties.errors, null, 2),
			);
		}

		return res.status(500).json({
			error: "Service Error",
			message: err?.message ?? String(err),
			stack: err?.stack,
			properties: err?.properties,
		});
	}
}
