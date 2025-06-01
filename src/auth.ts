import { hash, compare } from "bcrypt";
export function hashPassword(password: string) {
	const saltRounds = 10;
	const result = hash(password, saltRounds)
	// Promise.resolve(result)
	console.log(result);
	return result;
}

export function checkPasswordHash(password: string, hash: string) {
	const match = compare(password, hash);
	console.log(match);
	return match;
}
