import { useEffect, useRef, useState } from "react";

export interface GameInfo {
  gameId: string;
  color: "white" | "black";
  fen: string;
  pgn: string;
  whiteTime: number;
  blackTime: number;
}

export function useSocket() {
  // State
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [matchStatus, setMatchStatus] = useState("Not searching");
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const errorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = (message: object): boolean => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  };

  // Clear error message and its timeout
  const clearErrorMessage = () => {
    if (errorTimeout.current) {
      clearTimeout(errorTimeout.current);
      errorTimeout.current = null;
    }

    setErrorMessage(null);
  };

  // WebSocket lifecycle and incoming messages
  useEffect(() => {
    const ws = new WebSocket(
      import.meta.env.VITE_WS_URL || "ws://localhost:8081",
    );

    let active = true;

    // Connection events
    ws.onopen = () => {
      if (!active) return;

      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.onclose = () => {
      if (!active) return;

      console.log("WebSocket disconnected");

      setConnected(false);
      setIsSearching(false);
      setMatchStatus("Disconnected from server");
    };

    ws.onerror = (event) => {
      if (!active) return;

      console.error("WebSocket error:", event);
    };

    // Incoming server messages
    ws.onmessage = (event) => {
      if (!active) return;

      try {
        const message = JSON.parse(event.data);

        console.log("Server message:", message);

        // Matchmaking: waiting for an opponent
        if (message.type === "WAITING_FOR_PLAYER") {
          setIsSearching(true);
          setMatchStatus("Waiting for an opponent...");
        }

        // Game initialization
        if (message.type === "INIT_GAME") {
          setIsSearching(false);
          setGameOverMessage(null);
          setErrorMessage(null);

          setGameInfo({
            gameId: message.gameId,
            color: message.color,
            fen: message.fen,
            pgn: message.pgn,
            whiteTime: message.whiteTime,
            blackTime: message.blackTime,
          });

          setMatchStatus("Game found!");
        }

        // Move updates
        if (message.type === "MOVE") {
          window.dispatchEvent(new Event("chess-move"));

          setGameInfo((current) => {
            if (!current || current.gameId !== message.gameId) {
              return current;
            }

            return {
              ...current,
              fen: message.fen,
              pgn: message.pgn,
              whiteTime: message.whiteTime,
              blackTime: message.blackTime,
            };
          });
        }

        // Clock updates
        if (message.type === "CLOCK") {
          setGameInfo((current) => {
            if (!current || current.gameId !== message.gameId) {
              return current;
            }

            return {
              ...current,
              whiteTime: message.whiteTime,
              blackTime: message.blackTime,
            };
          });
        }

        // Invalid move errors
        if (message.type === "INVALID_MOVE") {
          if (errorTimeout.current !== null) {
            clearTimeout(errorTimeout.current);
          }

          setErrorMessage(message.message || "Invalid move.");

          errorTimeout.current = setTimeout(() => {
            setErrorMessage(null);
            errorTimeout.current = null;
          }, 3000);
        }

        // Game completion
        if (message.type === "GAME_OVER") {
          console.log("Game over:", message);

          setGameOverMessage(
            message.winner
              ? `${message.winner} wins by ${message.reason}.`
              : `Draw by ${message.reason}.`,
          );

          setMatchStatus("Game over");

          setGameInfo((current) => {
            if (!current || current.gameId !== message.gameId) {
              return current;
            }

            return {
              ...current,
              fen: message.fen,
              pgn: message.pgn,
              whiteTime: message.whiteTime,
              blackTime: message.blackTime,
            };
          });
        }
      } catch {
        console.error("Invalid message form the server", event.data);
      }
    };

    socketRef.current = ws;

    // Cleanup
    return () => {
      active = false;

      if (errorTimeout.current) {
        clearTimeout(errorTimeout.current);
        errorTimeout.current = null;
      }

      socketRef.current = null;
      ws.close();
    };
  }, []);

  // Join matchmaking queue
  const joinGame = (timeControl: 1 | 3 | 5 | 10 | 25 = 10) => {
    if (isSearching || (gameInfo && !gameOverMessage)) return;

    const sent = sendMessage({
      type: "JOIN_GAME",
      timeControl,
    });

    if (!sent) return;

    setGameInfo(null);
    setGameOverMessage(null);
    setErrorMessage(null);
    setIsSearching(true);
    setMatchStatus("Searching for an opponent...");
  };

  // Expose hook state and actions
  return {
  connected,
  matchStatus,
  gameInfo,
  gameOverMessage,
  errorMessage,
  clearErrorMessage,
  isSearching,
  joinGame,
  sendMessage,
};
}
