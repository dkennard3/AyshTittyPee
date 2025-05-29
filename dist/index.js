import express from "express";
import { config } from "./config.js";
import { ErrorBadRequest400, ErrorUnauthorized401, ErrorForbidden403, ErrorNotFound404 } from "./AyshTittyPeeErrors.js";
const app = express();
const PORT = 8080;
function middlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        const status = res.statusCode;
        if (status !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${status}`);
        }
    });
    next();
}
;
function middlewareMetricsInc(req, res, next) {
    res.on("finish", () => {
        config.fileserverhits += 1;
        console.log(`Hits: ${config.fileserverhits}`);
    });
    next();
}
;
function errorHandler(err, req, res, next) {
    console.log(err);
    // res.status(500).json({ "error": "Something went wrong on our end" });
    if (err instanceof ErrorBadRequest400)
        res.status(400);
    else if (err instanceof ErrorUnauthorized401)
        res.status(401);
    else if (err instanceof ErrorForbidden403)
        res.status(403);
    else if (err instanceof ErrorNotFound404)
        res.status(404);
    else
        res.status(500);
    res.send(JSON.stringify({ "error": err.message }));
    next();
}
app.use(express.json());
app.use(errorHandler);
app.use(middlewareLogResponses);
app.use("/", express.static("./src/app"));
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
// app.get() has to have the res object do a .send() EVERY SINGLE TIME OR IT WILL HANG FOREVER
app.get("/admin/metrics", (req, res) => {
    res.set("Content-Type", "text/html; charset=utf-8");
    // res.send(`Hits: ${config.fileserverhits}`);
    res.send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverhits} times!</p>
  </body>
</html>`);
});
app.post("/admin/reset", (req, res) => {
    config.fileserverhits = 0;
    res.send();
});
app.post("/api/validate_chirp", (req, res, next) => {
    const pBody = req.body;
    if (pBody["body"].length > 140) {
        // res.status(400).send(JSON.stringify({ "error": "Chirp is too long" }));	
        errorHandler(new ErrorBadRequest400("Chirp is too long. Max length is 140"), req, res, next);
    }
    let chunks = pBody["body"].split(" ");
    const badWords = ["kerfuffle", "sharbert", "fornax"];
    chunks.forEach((chunk) => {
        if (badWords.indexOf(chunk.toLowerCase()) != -1) {
            chunks[chunks.indexOf(chunk)] = "****";
        }
    });
    res.status(200).send(JSON.stringify({ "cleanedBody": chunks.join(" ") }));
});
app.get("/api/healthz", (req, res) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
});
// Listen always happens at the very end AFTER all routes are set up
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
