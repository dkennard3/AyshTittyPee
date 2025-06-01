import { db } from "../index.js";
import { NewUser, users, NewChirp, chirps } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createUser(user: NewUser) {
	const [result] = await db
		.insert(users)
		.values(user)
		.onConflictDoNothing()
		.returning();
	return result;
}

export async function deleteAllUsers() {
	const [result] = await db
		.delete(users);
	return result;
}

export async function createNewChirp(chirp: NewChirp) {
	const [result] = await db
		.insert(chirps)
		.values(chirp)
		.onConflictDoNothing()
		.returning();
	return result;
}

export async function getAllChirps() {
	const result = await db
		.select()
		.from(chirps)
		.orderBy(chirps.createdAt);
	return result;
}

export async function getChirpById(id: string) {
	const [result] = await db
		.select()
		.from(chirps)
		.where(eq(chirps.id, id));
	return result;
}

export async function getUserByEmail(email: string) {
	const [result] = await db
		.select()
		.from(users)
		.where(eq(users.email, email));
	return result;
}
