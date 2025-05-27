import express from "express";
import { config } from "./config";
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
app.use(middlewareLogResponses);
app.use("/metrics", middlewareMetricsInc);
app.use("/reset", () => { config.fileserverhits = 0; });
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
// app.use(express.static("."));
app.use("/app", express.static("./src/app"));
app.get("/healthz", (req, res) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
});
