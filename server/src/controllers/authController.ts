import type { Context } from "hono";
import { authService } from "../services/authService.js";
import log from "../config/logger.js";

export const authController = {
	register: async (c: Context) => {
		try {
			const { username, password } = await c.req.json();
			const result = await authService.registerUser(username, password);
			log.info(`User registered successfully: ${username}`);
			return c.json(result);
		} catch (error) {
			log.error("Registration failed:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return c.json({ error: `Registration failed: ${errorMessage}` }, 500);
		}
	},

	login: async (c: Context) => {
		try {
			const { username, password } = await c.req.json();
			const result = await authService.loginUser(username, password);
			log.info(`User logged in successfully: ${username}`);
			return c.json(result);
		} catch (error) {
			log.error("Login failed:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return c.json({ error: `Login failed: ${errorMessage}` }, 500);
		}
	},

	getMe: async (c: Context) => {
		try {
			const user = c.get("user");

			if (!user || !user.userId) {
				log.error("Get me error: No user in context");
				return c.json({ error: "Unauthorized" }, 401);
			}

			const userData = await authService.getUserById(user.userId);
			return c.json(userData);
		} catch (error) {
			log.error("Get me error:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return c.json(
				{ error: `Failed to retrieve user data: ${errorMessage}` },
				500,
			);
		}
	},
};
