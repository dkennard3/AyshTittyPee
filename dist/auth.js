import { hash, compare } from "bcrypt";
export async function hashPassword(password) {
    const saltRounds = 10;
    const result = await hash(password, saltRounds);
    // Promise.resolve(result)
    console.log(result);
    return result;
}
export async function checkPasswordHash(password, hash) {
    const match = await compare(password, hash);
    console.log(match);
    return match;
}
