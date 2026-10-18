import { WebSocketServer } from "ws";
import GameManager from "./managers/GameManager.js";


const wss = new WebSocketServer({ port: 8081 });

console.log("WebSocket server started on port 8081");

const gameManager = new GameManager();

wss.on("connection", (ws) => {
  console.log("Client connected");

  gameManager.addUser(ws);

  ws.on("close", () => {
    console.log("Client disconnected");

    gameManager.removeUser(ws);
  });
});
