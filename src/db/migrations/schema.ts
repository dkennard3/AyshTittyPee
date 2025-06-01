import { pgTable, unique, uuid, timestamp, varchar, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	email: varchar({ length: 256 }).notNull(),
	hashedPassword: varchar("hashed_password").default('unset').notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const chirps = pgTable("chirps", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	body: varchar({ length: 140 }).notNull(),
	userId: uuid(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chirps_userId_users_id_fk"
		}).onDelete("cascade"),
]);
