import WebSocket from "ws";
import { Chess } from "chess.js";

import crypto from "crypto";
import type { ChessMove, TimeControl } from "../types/type.js";

class Game {
  public player1: WebSocket;
  public player2: WebSocket;

  private board: Chess;
  private finished = false;

  public readonly id: string;

  private whiteTime: number;
  private blackTime: number;
  private turnStartedAt: number;
  private timer: NodeJS.Timeout;

  private moves: ChessMove[] = [];

  constructor(
    player1: WebSocket,
    player2: WebSocket,
    timeControl: TimeControl,
  ) {
    this.player1 = player1;
    this.player2 = player2;

    this.board = new Chess();
    this.id = crypto.randomUUID();

    this.whiteTime = timeControl * 60 * 1000;
    this.blackTime = timeControl * 60 * 1000;
    this.turnStartedAt = Date.now();

    this.timer = setInterval(() => {
      this.updateTimer();
    }, 1000);

    const initialState = {
      type: "INIT_GAME",
      gameId: this.id,
      fen: this.board.fen(),
      pgn: this.board.pgn(),
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
    };

    this.send(this.player1, {
      ...initialState,
      color: "white",
    });

    this.send(this.player2, {
      ...initialState,
      color: "black",
    });
  }

  private send(socket: WebSocket, message: unknown) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  private finish(winner: "white" | "black" | null, reason: string) {
    if (this.finished) {
      return;
    }
    const result =
    winner === "white" ? "1-0" : winner === "black" ? "0-1" : "1/2-1/2";

    this.board.setHeader("Result", result);

    this.finished = true;
    clearInterval(this.timer);

    this.send(this.player1, {
      type: "GAME_OVER",
      gameId: this.id,
      winner,
      reason,
      pgn: this.board.pgn(),
      moves: this.moves,
      fen: this.board.fen(),
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
    });

    this.send(this.player2, {
      type: "GAME_OVER",
      gameId: this.id,
      winner,
      reason,
      pgn: this.board.pgn(),
      moves: this.moves,
      fen: this.board.fen(),
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
    });
  }

  get isFinished() {
    return this.finished;
  }

  private updateTimer() {
    if (this.finished) {
      return;
    }

    const now = Date.now();
    const elapsed = now - this.turnStartedAt;

    if (this.board.turn() === "w") {
      this.whiteTime -= elapsed;
    } else {
      this.blackTime -= elapsed;
    }

    this.turnStartedAt = now;

    if (this.whiteTime <= 0) {
      this.whiteTime = 0;
      this.finish("black", "timeout");
      return;
    }

    if (this.blackTime <= 0) {
      this.blackTime = 0;
      this.finish("white", "timeout");
      return;
    }

    const clockMessage = {
      type: "CLOCK",
      gameId: this.id,
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
    };

    this.send(this.player1, clockMessage);
    this.send(this.player2, clockMessage);
  }

  makeMove(socket: WebSocket, move: ChessMove) {
    if (this.finished) {
      return;
    }

    const turn = this.board.turn();

    if (
      (turn === "w" && socket !== this.player1) ||
      (turn === "b" && socket !== this.player2)
    ) {
      this.send(socket, {
        type: "INVALID_MOVE",
        code: "NOT_YOUR_TURN",
        message: "Not your turn",
      });
      return;
    }

    // Deduct the time elapsed since the last clock update.
    const now = Date.now();
    const elapsed = now - this.turnStartedAt;

    if (turn === "w") {
      this.whiteTime -= elapsed;
    } else {
      this.blackTime -= elapsed;
    }

    // A player cannot move after their clock has expired.
    if (this.whiteTime <= 0) {
      this.whiteTime = 0;
      this.finish("black", "timeout");
      return;
    }

    if (this.blackTime <= 0) {
      this.blackTime = 0;
      this.finish("white", "timeout");
      return;
    }

    let playedMove;

    try {
      playedMove = this.board.move(move);
    } catch {
      // An invalid move must not reset the player's clock.
      this.turnStartedAt = now;

      this.send(socket, {
        type: "INVALID_MOVE",
        code: "INVALID_MOVE",
        message: "Invalid move",
      });
      return;
    }

    const promotion = playedMove.promotion;

    this.moves.push({
      from: playedMove.from,
      to: playedMove.to,
      ...(promotion === "q" ||
      promotion === "r" ||
      promotion === "b" ||
      promotion === "n"
        ? { promotion }
        : {}),
    });

    this.turnStartedAt = Date.now();

    const moveMessage = {
      type: "MOVE",
      gameId: this.id,
      move: playedMove,
      fen: this.board.fen(),
      pgn: this.board.pgn(),
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
      moves: [...this.moves],
    };

    this.send(this.player1, moveMessage);
    this.send(this.player2, moveMessage);

    if (this.board.isCheckmate()) {
      const winner = this.board.turn() === "w" ? "black" : "white";
      this.finish(winner, "checkmate");
      return;
    }

    if (this.board.isStalemate()) {
      this.finish(null, "stalemate");
      return;
    }

    if (this.board.isDraw()) {
      this.finish(null, "draw");
    }
  }

  resign(socket: WebSocket) {
    if (this.finished) {
      return;
    }

    if (socket !== this.player1 && socket !== this.player2) {
      return;
    }

    const winner = socket === this.player1 ? "black" : "white";
    this.finish(winner, "resignation");
  }

  playerDisconnected(socket: WebSocket) {
    if (this.finished) {
      return;
    }

    if (socket !== this.player1 && socket !== this.player2) {
      return;
    }

    const winner = socket === this.player1 ? "black" : "white";
    this.finish(winner, "opponent_disconnected");
  }
}

export default Game;
