import { config } from "./config.js";
import postgres from "postgres";
import express, { NextFunction, Request, Response } from "express";
import { users, NewUser, NewChirp, UserResponse } from "./db/schema.js"
import {
	createUser,
	deleteAllUsers,
	createNewChirp,
	getAllChirps,
	getChirpById,
	getUserByEmail
} from "./db/queries/users.js";
import {
	ErrorBadRequest400,
	ErrorUnauthorized401,
	ErrorForbidden403,
	ErrorNotFound404
} from "./AyshTittyPeeErrors.js";
import { hashPassword, checkPasswordHash } from "./auth.js"
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

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
	let user: NewUser;
	let passMatch;
	try {
		const email = req.body["email"];
		const password = req.body["password"];
		user = await getUserByEmail(email);
		passMatch = await checkPasswordHash(password, user.hashedPassword as string)
			.then((result) => {
				if (!result) {
					throw new ErrorUnauthorized401("Incorrect email or password");
				}

				const userRes: UserResponse = {
					id: user.id,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
					email: user.email
				};

				res.status(200).send(userRes);
			});
	} catch (e) {
		next(e);
	}
});

// CALLING NEXT() WILL CALL THE NEXT MIDDLEWARE FUNC __AFTER__ WHERE NEXT IS CALLED FROM
// THANKS A LOT EXPRESS DOCS FOR TOTALLY BEING SPECIFIC ABOUT THIS AND WASTING
// HALF MY WEEKEND -- FUCK YOU NERDS!
app.use(myErrorHandler);

// create new User/Account
app.post("/api/users", async (req, res) => {
	const email = req.body["email"];
	const password = req.body["password"];
	const user: NewUser = { email: email, hashedPassword: await hashPassword(password) };
	const result = await createUser(user);
	const userRes: UserResponse = {
		id: result.id,
		createdAt: result.createdAt,
		updatedAt: result.updatedAt,
		email: result.email
	};

	res.status(201).send(userRes);
});

app.post("/admin/reset", async (req, res) => {
	if (config.db.platform != "dev") throw ErrorForbidden403;
	else {
		await deleteAllUsers();
		config.fileserverhits = 0;
	}
	res.send();
});

app.post("/api/chirps", async (req, res) => {
	const pBody = req.body;
	const msg: string = pBody["body"];
	if (msg.length > 140) {
		throw new ErrorBadRequest400("Chirp is too long. Max length is 140")
	}
	msg.replace(/kerfuffle|sharbert|fornax/g, "****")

	const chirp: NewChirp = { body: msg, userId: pBody["userId"] };
	const result = await createNewChirp(chirp);
	res.status(201)
	res.send(JSON.stringify(result));
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

app.get("/api/chirps", async (req, res) => {
	res.status(200);
	res.send(await getAllChirps());
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

// Listen always happens at the very end AFTER all routes are set up
app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`);
});
