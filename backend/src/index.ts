import { WebSocketServer } from "ws";
import GameManager from "./managers/GameManager.js";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT) || 8080;

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

const allowedOrigins = [
  "https://chess-beta-sandy.vercel.app",
];

const wss = new WebSocketServer({
  server,
  verifyClient: ({ origin }, callback) => {
    callback(
      allowedOrigins.includes(origin),
      403,
      "Origin not allowed",
    );
  },
});

const gameManager = new GameManager();

wss.on("connection", (ws) => {
  console.log("Client connected");

  gameManager.addUser(ws);

  ws.on("close", () => {
    console.log("Client disconnected");
    gameManager.removeUser(ws);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});