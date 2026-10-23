import WebSocket from "ws";
import Game from "../game/Game.js";
import type {
  ClientMessage,
  ServerMessage,
  TimeControl,
} from "../types/type.js";

class GameManager {
  private games: Game[];
  private pendingUser: {
    socket: WebSocket;
    timeControl: TimeControl;
  } | null;

  constructor() {
    this.games = [];
    this.pendingUser = null;
  }

  // --- Public Methods ---

  addUser(socket: WebSocket) {
    socket.on("message", (data) => {
      let message: ClientMessage;

      // 1. Parse JSON
      try {
        message = JSON.parse(data.toString());
      } catch {
        this.send(socket, {
          type: "ERROR",
          code: "INVALID_JSON",
          message: "Invalid JSON",
        });
        return;
      }

      // 2. Handle Joining Game
      if (message.type === "JOIN_GAME") {
        if (this.pendingUser === null) {
          this.pendingUser = {
            socket,
            timeControl: message.timeControl,
          };
          this.send(socket, { type: "WAITING_FOR_PLAYER" });
          return;
        }

        if (this.pendingUser.timeControl !== message.timeControl) {
          this.send(socket, {
            type: "ERROR",
            code: "TIME_CONTROL_MISMATCH",
            message: "No opponent found for this time control",
          });
          return;
        }

        console.log("Matching two players...");

        const game = new Game(
          this.pendingUser.socket,
          socket,
          message.timeControl,
        );
        this.games.push(game);
        this.pendingUser = null;
        console.log("Game Created. Active games:", this.games.length);
        return;
      }

      // 3. Validate message type for active games
      if (message.type !== "MOVE" && message.type !== "RESIGN") {
        this.send(socket, {
          type: "ERROR",
          code: "UNKNOWN_MESSAGE_TYPE",
          message: "Unknown message type",
        });
        return;
      }

      // 4. Find player's active game
      const game = this.games.find(
        (g) => g.player1 === socket || g.player2 === socket,
      );

      if (!game) {
        this.send(socket, {
          type: "ERROR",
          code: "NO_GAME",
          message: "You are not currently in a game",
        });
        return;
      }

      // 5. Handle MOVE
      if (message.type === "MOVE") {
        if (
          !message.move ||
          typeof message.move.from !== "string" ||
          typeof message.move.to !== "string"
        ) {
          this.send(socket, {
            type: "ERROR",
            code: "INVALID_MOVE_FORMAT",
            message: "Invalid move format",
          });
          return;
        }

        if (
          !this.isValidSquare(message.move.from) ||
          !this.isValidSquare(message.move.to)
        ) {
          this.send(socket, {
            type: "ERROR",
            code: "INVALID_CHESS_SQUARE",
            message: "Invalid chess square",
          });
          return;
        }

        game.makeMove(socket, message.move);

        if (game.isFinished) {
          this.removeGame(game);
        }
      }

      // 6. Handle RESIGN
      else if (message.type === "RESIGN") {
        game.resign(socket);

        if (game.isFinished) {
          this.removeGame(game);
        }
      }
    });
  }

  removeUser(socket: WebSocket) {
    if (this.pendingUser?.socket === socket) {
      this.pendingUser = null;
      return;
    }

    const game = this.games.find(
      (g) => g.player1 === socket || g.player2 === socket,
    );

    if (!game) {
      return;
    }

    console.log("Player disconnected from game");
    game.playerDisconnected(socket);
    this.removeGame(game);
    console.log("Game removed");
    console.log("Active games:", this.games.length);
  }

  // --- Private Helpers ---

  private send(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  private isValidSquare(square: string) {
    return /^[a-h][1-8]$/.test(square);
  }

  private removeGame(game: Game) {
    this.games = this.games.filter((activeGame) => activeGame !== game);
  }
}

export default GameManager;
