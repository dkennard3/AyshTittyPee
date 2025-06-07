import { config } from "./config.js";
import postgres from "postgres";
import express, { NextFunction, Request, Response } from "express";
import {
	users,
	NewUser,
	NewChirp,
	UserResponse,
	NewRefreshToken,
	refresh_tokens
} from "./db/schema.js"
import {
	createUser,
	deleteAllUsers,
	createNewChirp,
	getAllChirps,
	getChirpById,
	getUserByEmail,
	createRefreshToken,
	getRefreshToken,
	revokeRefreshToken,
	updateUser,
	getRefreshTokenByUserId,
	deleteChirp,
	upgradeUser,
	getAllChirpsByAuthor,
	deleteAllChirps
} from "./db/queries/users.js";
import {
	ErrorBadRequest400,
	ErrorUnauthorized401,
	ErrorForbidden403,
	ErrorNotFound404
} from "./AyshTittyPeeErrors.js";
import {
	hashPassword,
	checkPasswordHash,
	getBearerToken,
	validateJWT,
	makeJWT,
	makeRefreshToken,
	getAPIKey
} from "./auth.js"
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { hash } from "bcrypt";

// const migrationClient = postgres(config.db.url, { max: 1 });
// await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();
const PORT = 8080;

function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
	res.on("finish", () => {
		const status = res.statusCode;
		if (status !== 200) {
			console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${status}`);
		}
	});
	next();
};

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
	res.on("finish", () => {
		config.fileserverhits += 1;
		console.log(`Hits: ${config.fileserverhits}`);
	});
	next();
};


function myErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
	console.log(err);
	const errReturn = { "error": err.message };
	console.log(errReturn);
	if (err.name === "ErrorBadRequest400") { res.status(400).json(errReturn); }
	else if (err.name === "ErrorUnauthorized401") { res.status(401).json(errReturn); }
	else if (err.name === "ErrorForbidden403") { res.status(403).json(errReturn); }
	else if (err.name === "ErrorNotFound404") { res.status(404).json(errReturn); }
	else { res.status(500).send(); }
}

app.use(express.json());
app.use(middlewareLogResponses);

app.use("/", express.static("./src/app"));
app.use("/app", middlewareMetricsInc, express.static("./src/app"));

// existing User login 
app.post("/api/login", async (req, res, next) => {
	try {
		const email = req.body["email"];
		const password = req.body["password"];
		const user: NewUser = await getUserByEmail(email);
		const token = makeJWT(user.id as string, 3600, config.token);
		const today = new Date();
		const expDate = new Date(today);
		expDate.setDate(today.getDate() + 60);
		const refBody: NewRefreshToken = {
			token: makeRefreshToken(),
			userId: user.id as string,
			revokedAt: null,
			expiresAt: expDate
		};
		const refToken = await createRefreshToken(refBody);
		await checkPasswordHash(password, user.hashedPassword as string)
			.then((result) => {
				if (!result) {
					throw new ErrorUnauthorized401("Incorrect email or password");
				}

				const userRes: UserResponse = {
					id: user.id,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
					email: user.email,
					token: token,
					refreshToken: refToken.token,
					isChirpyRed: user.isChirpyRed
				};

				res.status(200).send(userRes);
			});
	} catch (e) {
		next(e);
	}
});

// create new User/Account
app.post("/api/users", async (req, res, next) => {
	try {
		const email = req.body["email"];
		const password = req.body["password"];
		const user: NewUser = { email: email, hashedPassword: await hashPassword(password) };
		const result = await createUser(user);
		const userRes: UserResponse = {
			id: result.id,
			createdAt: result.createdAt,
			updatedAt: result.updatedAt,
			email: result.email,
			isChirpyRed: result.isChirpyRed
		};

		res.status(201).send(userRes);
	} catch (e) {
		next(e);
	}
});

app.post("/api/refresh", async (req, res, next) => {
	try {
		const tokenString = getBearerToken(req);
		await getRefreshToken(tokenString).then((result) => {
			if (!result || new Date() >= result.expiresAt || result.revokedAt) {
				throw new ErrorUnauthorized401("");
			}
			const token = makeJWT(result.userId as string, 3600, config.token);
			res.status(200).json({ "token": token });
		});
	} catch (e) {
		next(e);
	}
});

app.post("/api/revoke", async (req, res, next) => {
	try {
		const tokenString = getBearerToken(req);
		revokeRefreshToken(tokenString);
		res.status(204).send();
	} catch (e) {
		next(e);
	}
});

app.post("/admin/reset", async (req, res) => {
	if (config.db.platform != "dev") throw ErrorForbidden403;
	else {
		await deleteAllUsers();
		await deleteAllChirps();
		config.fileserverhits = 0;
	}
	res.status(200).send();
});

app.post("/api/chirps", async (req, res, next) => {
	try {
		const tokenString = getBearerToken(req);
		const check = validateJWT(tokenString, config.token);
		if (check === "INVALID") throw new ErrorUnauthorized401("Invalid Bearer Auth Token");

		const pBody = req.body;
		const msg: string = pBody["body"];

		if (msg.length > 140) {
			throw new ErrorBadRequest400("Chirp is too long. Max length is 140")
		}

		msg.replace(/kerfuffle|sharbert|fornax/g, "****")

		const chirp: NewChirp = { body: msg, userId: check };
		const result = await createNewChirp(chirp);

		res.status(201)
		res.send(JSON.stringify(result));
	} catch (e) {
		next(e);
	}
});

// update user email and/or password
app.put("/api/users", async (req, res, next) => {
	try {
		const tokenString = getBearerToken(req);
		const check = validateJWT(tokenString, config.token);
		if (check === "INVALID") throw new ErrorUnauthorized401("Invalid Bearer Auth Token");

		const email = req.body["email"];
		const password = req.body["password"];

		const hashPass = await hashPassword(password);
		const user = await updateUser(check, email, hashPass);
		const refToken = await getRefreshTokenByUserId(user.id);
		const userRes: UserResponse = {
			id: user.id,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			email: email,
			token: tokenString,
			refreshToken: refToken.token,
			isChirpyRed: user.isChirpyRed
		};
		res.status(200).send(userRes);


	} catch (e) {
		next(e);
	}
});

app.post("/api/polka/webhooks", async (req, res, next) => {
	try {
		const apiKey = getAPIKey(req);
		if (apiKey !== config.polkaAPIKey) throw ErrorUnauthorized401;

		const event = req.body["event"];
		const userId = req.body["data"]["userId"];

		if (event !== "user.upgraded") res.status(204).send();

		const user = await upgradeUser(userId);
		if (!user) throw ErrorNotFound404;
		else res.status(204).send();
	} catch (e) {
		next(e);
	}
});

app.delete("/api/chirps/:chirpID", async (req, res, next) => {
	try {
		const tokenString = getBearerToken(req);
		const check = validateJWT(tokenString, config.token);
		if (check === "INVALID") throw new ErrorUnauthorized401("Invalid Bearer Auth Token");

		const chirpId = req.params["chirpID"];
		const chirp = await getChirpById(chirpId);
		if (check !== chirp.userId) throw ErrorForbidden403;

		const removedChirp = await deleteChirp(chirpId);
		if (!removedChirp) throw ErrorNotFound404;
		else res.status(204).send();

	} catch (e) {
		next(e);
	}
});

// app.get() has to have the res object do a .send() EVERY SINGLE TIME OR IT WILL HANG FOREVER
app.get("/admin/metrics", (req, res) => {
	res.set("Content-Type", "text/html; charset=utf-8");
	res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverhits} times!</p>
  </body>
</html>`
	);
});

app.get(["/api/chirps{/:authorId}", "/api/chirps{/:sort}"], async (req, res) => {
	let authorId = req.query.authorId;
	let sort = req.query.sort;

	if (typeof authorId === "string") {
		res.status(200).send(await getAllChirpsByAuthor(authorId));
	} else if (typeof sort === "string" && sort === "desc") {
		res.status(200).send((await getAllChirps()).sort((a, b) =>
			b.createdAt.getTime() - a.createdAt.getTime()
		));
	} else {
		res.status(200).send((await getAllChirps()).sort((a, b) =>
			a.createdAt.getTime() - b.createdAt.getTime()
		));
	}
});

app.get("/api/chirps/:chirpId", async (req, res) => {
	const id = req.params.chirpId;
	const result = await getChirpById(id);
	if (result) res.status(200).send(result);
	else throw ErrorNotFound404;
});

app.get("/api/healthz", (req, res) => {
	res.set("Content-Type", "text/plain; charset=utf-8");
	res.send("OK");
});

// CALLING NEXT() WILL CALL THE NEXT MIDDLEWARE FUNC __AFTER__ WHERE NEXT IS CALLED FROM
// THANKS A LOT EXPRESS DOCS FOR TOTALLY BEING SPECIFIC ABOUT THIS AND WASTING
// HALF MY WEEKEND -- FUCK YOU NERDS!
app.use(myErrorHandler);

// Listen always happens at the very end AFTER all routes are set up
app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});

