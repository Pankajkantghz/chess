import { WebSocketServer } from "ws";
import GameManager from "./managers/GameManager.js";

const PORT = Number(process.env.PORT) || 8080;

const wss = new WebSocketServer({ port: PORT });

const gameManager = new GameManager();

wss.on("connection", (ws) => {
  console.log("Client connected");

  gameManager.addUser(ws);

  ws.on("close", () => {
    console.log("Client disconnected");

    gameManager.removeUser(ws);
  });
});
