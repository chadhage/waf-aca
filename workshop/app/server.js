"use strict";

const http = require("node:http");
const process = require("node:process");

const port = Number(process.env.PORT || 8080);
let ready = true;

const server = http.createServer((request, response) => {
  if (request.url === "/health/live") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "live" }));
    return;
  }

  if (request.url === "/health/ready") {
    response.writeHead(ready ? 200 : 503, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: ready ? "ready" : "not-ready" }));
    return;
  }

  if (request.url === "/fault/readiness" && request.method === "POST") {
    ready = !ready;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ready }));
    return;
  }

  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ service: "waaca-workshop", revision: process.env.CONTAINER_APP_REVISION || "local" }));
});

server.listen(port, "0.0.0.0", () => console.log(`Listening on ${port}`));

function shutdown(signal) {
  console.log(`Received ${signal}; draining`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));