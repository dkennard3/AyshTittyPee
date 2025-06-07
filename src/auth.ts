import { hash, compare } from "bcrypt";
import { JwtPayload, default as jwt } from "jsonwebtoken";
import { Request } from "express";
import { randomBytes } from "crypto";

export async function hashPassword(password: string) {
	const saltRounds = 10;
	return await hash(password, saltRounds)
}

export async function checkPasswordHash(password: string, hash: string) {
	return await compare(password, hash);
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
	const p: payload = {
		iss: "chirpy",
		sub: userID,
		iat: Math.floor(Date.now() / 1000),
		exp: 0
	};
	p.exp = p.iat as number + expiresIn;

	const token = jwt.sign(p, secret);
	return token;
}

export function validateJWT(tokenString: string, secret: string): string {
	try {
		const decoded = jwt.verify(tokenString, secret);
		return decoded.sub as string;
	} catch (e) {
		return "INVALID";
	}
}

export function getBearerToken(req: Request): string {
	try {
		const tokenString = req.get("Authorization") as string;
		const raw = tokenString.split(" ")[1];
		return raw;

	} catch (e) {
		return "ERROR";
	}
}

export function makeRefreshToken(): string {
	try {
		return randomBytes(32).toString('hex');
	} catch (e) {
		return "ERROR";
	}
}

export function getAPIKey(req: Request): string {
	try {
		const authString = req.get("Authorization") as string;
		return authString.split(" ")[1];
	} catch (e) {
		return "ERROR";
	}
}
