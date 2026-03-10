import { pino } from "pino";

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

const level =
	(typeof process !== "undefined" && process.env.LOG_LEVEL) || "info";

export function toUpperCase(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export const logger = pino({
	level,
	...(isBrowser
		? {}
		: {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						ignore: "pid,hostname",
						translateTime: "HH:MM:ss Z",
					},
				},
			}),
});
