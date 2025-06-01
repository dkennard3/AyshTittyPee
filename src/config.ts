process.loadEnvFile();
import migrationConfig from "./db/DBConfig.js";
type APIConfig = {
	fileserverhits: number;
	db: {
		url: any;
		migrationConfig: any;
		platform: any;

	};
};

function envOrThrow(key: string) {
	if (!Object.hasOwn(process.env, key)) {
		throw new Error(`env key = ${key} not found!`);
	}
	return process.env[key];
}

export const config: APIConfig = {
	fileserverhits: 0,
	db: {
		url: envOrThrow("DB_URL"),
		migrationConfig: migrationConfig,
		platform: envOrThrow("PLATFORM")
	}
};
