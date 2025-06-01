import { hash, compare } from "bcrypt";
export async function hashPassword(password: string) {
	const saltRounds = 10;
	const result = await hash(password, saltRounds)
	// console.log(result);
	return result;
}

export async function checkPasswordHash(password: string, hash: string) {
	const match = await compare(password, hash);
	// console.log(match);
	return match;
}
