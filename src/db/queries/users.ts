import { db } from "../index.js";
import { NewUser, users, NewChirp, chirps, NewRefreshToken, refresh_tokens } from "../schema.js";
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

export async function deleteAllChirps() {
	const [result] = await db
		.delete(chirps);
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

export async function getAllChirpsByAuthor(id: string) {
	const result = await db
		.select()
		.from(chirps)
		.where(eq(chirps.userId, id))
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

export async function getRefreshToken(token: string) {
	const [result] = await db
		.select()
		.from(refresh_tokens)
		.where(eq(refresh_tokens.token, token));
	return result;
}

export async function getRefreshTokenByUserId(id: string) {
	const [result] = await db
		.select()
		.from(refresh_tokens)
		.where(eq(refresh_tokens.userId, id));
	return result;
}

export async function createRefreshToken(refreshToken: NewRefreshToken) {
	const [result] = await db
		.insert(refresh_tokens)
		.values(refreshToken)
		.onConflictDoNothing()
		.returning();
	return result;
}

export async function revokeRefreshToken(token: string) {
	let sub = await getRefreshToken(token);
	sub.revokedAt = new Date();
	sub.updatedAt = new Date();
	await db.update(refresh_tokens).set(sub);
}

export async function getUserById(id: string) {
	const [result] = await db
		.select()
		.from(users)
		.where(eq(users.id, id));
	return result;
}

export async function updateUser(userId: string, email: string, password: string) {
	let sub = await getUserById(userId);
	sub.email = email;
	sub.hashedPassword = password;
	const [result] = await db
		.update(users)
		.set(sub)
		.returning();
	return result;
}

export async function upgradeUser(userId: string) {
	let sub = await getUserById(userId);
	sub.isChirpyRed = true;
	const [result] = await db
		.update(users)
		.set(sub)
		.returning();
	return result;
}

export async function deleteChirp(id: string) {
	const [result] = await db
		.delete(chirps)
		.where(eq(chirps.id, id))
		.returning();
	return result;
}
