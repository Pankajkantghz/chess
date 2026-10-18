export type ChessMove = {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
};
export type TimeControl = 5 | 10 | 25;

export type ClientMessage =
  | {
      type: "MOVE";
      move: ChessMove;
    }
  | {
      type: "RESIGN";
    }
  | {
      type: "JOIN_GAME";
      timeControl: TimeControl;
    };

export type GameOverReason =
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resignation"
  | "timeout"
  | "disconnect";
export type ServerMessage =
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
      type: "GAME_OVER";
      gameId: string;
      winner: "white" | "black" | null;
      reason: GameOverReason;
    }
  | {
      type: "INVALID_MOVE";
      code: string;
      message: string;
    }
  | {
      type: "WAITING_FOR_PLAYER";
    }
  | {
      type: "CLOCK";
      gameId: string;
      whiteTime: number;
      blackTime: number;
    }
  | {
      type: "ERROR";
      code: string;
      message: string;
    };
