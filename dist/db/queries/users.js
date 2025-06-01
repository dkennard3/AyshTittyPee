import { db } from "../index.js";
import { users, chirps } from "../schema.js";
import { eq } from "drizzle-orm";
export async function createUser(user) {
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
export async function createNewChirp(chirp) {
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
export async function getChirpById(id) {
    const [result] = await db
        .select()
        .from(chirps)
        .where(eq(chirps.id, id));
    return result;
}
export async function getUserByEmail(email) {
    const [result] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
    return result;
}
