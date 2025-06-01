import { relations } from "drizzle-orm/relations";
import { users, chirps } from "./schema";

export const chirpsRelations = relations(chirps, ({one}) => ({
	user: one(users, {
		fields: [chirps.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	chirps: many(chirps),
}));