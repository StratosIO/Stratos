import bcrypt from "bcryptjs";
import sql from "../config/database.js";
import log from "../config/logger.js";

export async function createAdmin() {
	try {
		const adminExists = await sql`
			SELECT id FROM users WHERE username = 'admin'
		`;

		if (adminExists.length === 0) {
			const adminPassword = "admin123";
			const passwordHash = await bcrypt.hash(adminPassword, 10);

			await sql`
				INSERT INTO users (username, password_hash, role)
				VALUES ('admin', ${passwordHash}, 'admin')
			`;
			log.info("Admin user created successfully");
		} else {
			log.debug("Admin user already exists");
		}
	} catch (error) {
		log.error("Error creating admin:", error);
	}
}
