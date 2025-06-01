process.loadEnvFile();
import migrationConfig from "./db/DBConfig.js";
function envOrThrow(key) {
    if (!Object.hasOwn(process.env, key)) {
        throw new Error(`env key = ${key} not found!`);
    }
    return process.env[key];
}
export const config = {
    fileserverhits: 0,
    db: {
        url: envOrThrow("DB_URL"),
        migrationConfig: migrationConfig,
        platform: envOrThrow("PLATFORM")
    }
};
