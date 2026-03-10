import path from "node:path";
import cors from "cors";
import express from "express";
import biosRouter from "./routes/bios";
import extractRouter from "./routes/extract";
import generateProposalRouter from "./routes/generate-proposal";
import mapPlacesRouter from "./routes/map-places";
import staffRatesRouter from "./routes/staff-rates";
import staffRouter from "./routes/staff";

const app = express();
app.use(cors());
app.use(express.json());

app.use(
	"/signatures",
	express.static(path.join(__dirname, "../../signatures")),
);

app.use("/api/extract", extractRouter);
app.use("/api/generate-proposal", generateProposalRouter);
app.use("/api/map-places", mapPlacesRouter);
app.use("/api/bios", biosRouter);
app.use("/api/staff", staffRouter);
app.use("/api/staff-rates", staffRatesRouter);

app.use("/", (_, res) => {
	res.send("API is running");
});

// Global Error Handler
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		console.error("[Global Error Handled]:", err);

		const statusCode = err.status || err.statusCode || 500;
		const errorMessage =
			err.message || "An unexpected error occurred internal to the server";

		res.status(statusCode).json({
			error: err.name || "Internal Server Error",
			message: errorMessage,
			...(process.env.NODE_ENV === "development" && { stack: err.stack }),
		});
	},
);

export default app;
