// --- Basic Data & Game Types ---

export type ChessMove = {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
};

export type TimeControl = 1 | 3 | 5 | 10 | 25;

export type GameOverReason =
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resignation"
  | "timeout"
  | "disconnect";

// --- Client Message Protocols ---

export type ClientMessage =
  | {
      type: "JOIN_GAME";
      timeControl: TimeControl;
    }
  | {
      type: "MOVE";
      move: ChessMove;
    }
  | {
      type: "RESIGN";
    };

// --- Server Message Protocols ---

export type ServerMessage =
  | {
      type: "WAITING_FOR_PLAYER";
    }
  | {
      type: "INIT_GAME";
      gameId: string;
      color: "white" | "black";
      fen: string;
    }
  | {
      type: "MOVE";
      gameId: string;
      move: ChessMove[];
      fen: string;
    }
  | {
      type: "CLOCK";
      gameId: string;
      whiteTime: number;
      blackTime: number;
    }
  | {
      type: "INVALID_MOVE";
      code: string;
      message: string;
    }
  | {
      type: "GAME_OVER";
      gameId: string;
      winner: "white" | "black" | null;
      reason: GameOverReason;
    }
  | {
      type: "ERROR";
      code: string;
      message: string;
    };
