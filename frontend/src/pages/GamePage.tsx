import { useEffect, useMemo, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import Button from "../components/ui/Button";
import { useSocket } from "../hooks/useSocket";

type TimeControl = 1 | 3 | 5 | 10 | 25;

interface DropParams {
  sourceSquare: string;
  targetSquare: string | null;
}

type PromotionPiece = "q" | "r" | "b" | "n";

const TIME_CONTROLS: { value: TimeControl; label: string }[] = [
  { value: 1, label: "Bullet · 1 min" },
  { value: 3, label: "Blitz · 3 min" },
  { value: 5, label: "Blitz · 5 min" },
  { value: 10, label: "Rapid · 10 min" },
  { value: 25, label: "Rapid · 25 min" },
];

const GamePage = () => {
  // 1. State and socket
  const [timeControl, setTimeControl] = useState<TimeControl>(10);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [showGameOver, setShowGameOver] = useState(true);

  // ref

  const {
    connected,
    matchStatus,
    gameInfo,
    gameOverMessage,
    errorMessage,
    clearErrorMessage,
    isSearching,
    joinGame,
    sendMessage,
  } = useSocket();

  // Derive the current chess position only after gameInfo is available.
  const game = useMemo(() => new Chess(gameInfo?.fen ?? undefined), [gameInfo]);

  const moveHistory: string[] = (() => {
    if (!gameInfo?.pgn) return [];

    const currentGame = new Chess();

    try {
      currentGame.loadPgn(gameInfo.pgn);
      return currentGame.history();
    } catch {
      return [];
    }
  })();
  // 2. Helpers
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const playMoveSound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 600;
    gain.gain.value = 0.08;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);

    oscillator.onended = () => {
      void audioContext.close();
    };
  };

  // 3. Derived game status
  const isMyTurn =
    !!gameInfo &&
    ((gameInfo.color === "white" && game.turn() === "w") ||
      (gameInfo.color === "black" && game.turn() === "b"));

  const gameStatus = game.isCheckmate()
    ? `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins.`
    : game.isDraw()
      ? "Game drawn."
      : game.isCheck()
        ? `${game.turn() === "w" ? "White" : "Black"} is in check.`
        : `${game.turn() === "w" ? "White" : "Black"} to move.`;

  // 4. Move handling
  const onPieceDrop = ({ sourceSquare, targetSquare }: DropParams): boolean => {
    if (!targetSquare || !gameInfo) return false;
    if (!connected || !isMyTurn || gameOverMessage) return false;

    const piece = game.get(sourceSquare as Square);
    const isPromotion =
      piece?.type === "p" &&
      (targetSquare[1] === "8" || targetSquare[1] === "1");

    if (isPromotion) {
      setPendingPromotion({
        from: sourceSquare,
        to: targetSquare,
      });
      return false;
    }

    sendMessage({
      type: "MOVE",
      move: {
        from: sourceSquare,
        to: targetSquare,
      },
    });

    return false;
  };

  const promotePawn = (piece: PromotionPiece) => {
    if (!pendingPromotion || !gameInfo || !connected) return;

    const sent = sendMessage({
      type: "MOVE",
      move: {
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: piece,
      },
    });

    if (sent) {
      setPendingPromotion(null);
    }
  };

  const resignGame = () => {
    if (!connected || !gameInfo) return;

    const sent = sendMessage({ type: "RESIGN" });

    if (sent) {
      setConfirmResign(false);
    }
  };

  // 5. Synchronize the local board with server state

  // Synchronize the local board with server state

  useEffect(() => {
    const handleMoveSound = () => playMoveSound();

    window.addEventListener("chess-move", handleMoveSound);

    return () => {
      window.removeEventListener("chess-move", handleMoveSound);
    };
  }, []);

  // 6. Reusable clock display
  const renderClock = (player: "you" | "opponent") => {
    if (!gameInfo) return null;

    const isYou = player === "you";
    const isWhite = isYou
      ? gameInfo.color === "white"
      : gameInfo.color !== "white";

    const isActive = isYou ? isMyTurn : !isMyTurn;
    const time = isWhite ? gameInfo.whiteTime : gameInfo.blackTime;

    return (
      <div
        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
          isActive && !gameOverMessage
            ? "border-[#81b64c]/50 bg-[#303d27]"
            : "border-white/[0.06] bg-[#262522]"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#45423e] text-xl">
          {isWhite ? "♙" : "♟"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#e8e6e3]">
            {isWhite ? "White" : "Black"}
          </p>
          <p className="text-xs text-[#a7a6a2]">{isYou ? "You" : "Opponent"}</p>
        </div>

        <div
          className={`min-w-[94px] rounded-md px-3 py-1.5 text-right font-mono text-2xl font-bold tabular-nums tracking-tight ${
            isActive && !gameOverMessage
              ? "bg-[#81b64c] text-[#18220f]"
              : "bg-[#3a3936] text-[#e8e6e3]"
          }`}
        >
          {formatTime(time)}
        </div>
      </div>
    );
  };

  // 7. Page
  return (
    <main className="min-h-screen bg-[#211f1c] text-[#e8e6e3]">
      {/* Top navigation */}
      <header className="border-b border-white/[0.07] bg-[#262522]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#81b64c] text-2xl text-[#18220f]">
              ♞
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                Chess
              </h1>
              <p className="text-xs text-[#a7a6a2]">Play. Think. Improve.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#302e2b] px-3 py-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-[#81b64c]" : "bg-red-400"
              }`}
            />
            <span className="text-xs text-[#c7c6c2] sm:text-sm">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Error notification */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-red-400/20 bg-red-950/60 px-4 py-3 text-sm text-red-200"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={clearErrorMessage}
              className="rounded px-2 text-xl hover:bg-white/10"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
          {/* Chessboard column */}
          <section className="mx-auto w-full max-w-[760px] min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a7a6a2]">
                  Online match
                </p>
                <h2 className="mt-1 text-lg font-semibold sm:text-xl">
                  {gameInfo
                    ? `${gameInfo.color === "white" ? "White" : "Black"} pieces`
                    : "Ready to play?"}
                </h2>
              </div>

              {gameInfo && (
                <span className="rounded-full border border-white/[0.08] bg-[#302e2b] px-3 py-1.5 text-xs text-[#c7c6c2]">
                  {gameOverMessage
                    ? "Game finished"
                    : isMyTurn
                      ? "Your turn"
                      : "Opponent's turn"}
                </span>
              )}
            </div>

            {/* Opponent clock */}
            {renderClock("opponent") && (
              <div className="mb-3">{renderClock("opponent")}</div>
            )}

            {/* Board */}
            <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#302e2b] p-1.5 shadow-2xl sm:p-2">
              <Chessboard
                options={{
                  position: gameInfo?.fen ?? game.fen(),
                  boardOrientation: gameInfo?.color ?? "white",
                  onPieceDrop,
                  boardStyle: {
                    borderRadius: "4px",
                  },
                  darkSquareStyle: {
                    backgroundColor: "#779556",
                  },
                  lightSquareStyle: {
                    backgroundColor: "#ebecd0",
                  },
                }}
              />
            </div>

            {/* Your clock */}
            {renderClock("you") && (
              <div className="mt-3">{renderClock("you")}</div>
            )}

            {/* Board footer */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#a7a6a2]">
              <span>
                {gameInfo
                  ? `Playing ${timeControl} minute${timeControl === 1 ? "" : "s"}`
                  : "Choose a time control and find an opponent"}
              </span>
              <span>Good luck, have fun.</span>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="flex min-w-0 flex-col gap-4">
            {/* Matchmaking */}
            <section className="rounded-xl border border-white/[0.07] bg-[#2b2926] p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#81b64c]/15 text-xl text-[#a8d477]">
                  ♟
                </div>
                <div>
                  <h2 className="font-semibold">Find a game</h2>
                  <p className="mt-0.5 text-xs text-[#a7a6a2]">
                    Choose your preferred pace
                  </p>
                </div>
              </div>

              <label
                htmlFor="time-control"
                className="mb-2 mt-5 block text-xs font-semibold uppercase tracking-wider text-[#a7a6a2]"
              >
                Time control
              </label>

              <select
                id="time-control"
                value={timeControl}
                onChange={(event) =>
                  setTimeControl(Number(event.target.value) as TimeControl)
                }
                disabled={isSearching || (!!gameInfo && !gameOverMessage)}
                className="w-full rounded-lg border border-white/10 bg-[#211f1c] px-3 py-3 text-sm text-white outline-none transition focus:border-[#81b64c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {TIME_CONTROLS.map((control) => (
                  <option key={control.value} value={control.value}>
                    {control.label}
                  </option>
                ))}
              </select>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {TIME_CONTROLS.slice(0, 3).map((control) => (
                  <button
                    key={control.value}
                    type="button"
                    onClick={() => setTimeControl(control.value)}
                    disabled={isSearching || (!!gameInfo && !gameOverMessage)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      timeControl === control.value
                        ? "border-[#81b64c] bg-[#81b64c]/15 text-[#b8e18c]"
                        : "border-white/[0.08] bg-[#211f1c] text-[#c7c6c2] hover:border-white/20"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {control.value} min
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-[#211f1c] p-3">
                <p className="text-xs text-[#a7a6a2]">Matchmaking status</p>
                <p
                  className="mt-1 text-sm font-medium text-[#e8e6e3]"
                  aria-live="polite"
                >
                  {matchStatus}
                </p>
              </div>

              <Button
                onClick={() => joinGame(timeControl)}
                disabled={
                  !connected || isSearching || (!!gameInfo && !gameOverMessage)
                }
                className="mt-4 w-full"
              >
                {isSearching ? "Searching..." : "Find Opponent"}
              </Button>
            </section>

            {/* Game status */}
            <section className="rounded-xl border border-white/[0.07] bg-[#2b2926] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Game status</h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    gameOverMessage
                      ? "bg-white/10 text-[#c7c6c2]"
                      : gameInfo
                        ? "bg-[#81b64c]/15 text-[#b8e18c]"
                        : "bg-white/[0.06] text-[#a7a6a2]"
                  }`}
                >
                  {gameOverMessage ? "Finished" : gameInfo ? "In game" : "Idle"}
                </span>
              </div>

              <p
                className="text-sm leading-6 text-[#c7c6c2]"
                aria-live="polite"
              >
                {gameOverMessage ??
                  (gameInfo
                    ? isMyTurn
                      ? "It's your turn. Make your move."
                      : "Waiting for your opponent to move."
                    : gameStatus)}
              </p>

              {gameInfo && (
                <div className="mt-4 border-t border-white/[0.07] pt-3">
                  <p className="text-xs text-[#a7a6a2]">Playing as</p>
                  <p className="mt-1 text-sm font-semibold capitalize">
                    {gameInfo.color}
                  </p>
                  <p className="mt-3 text-xs text-[#a7a6a2]">Game ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-[#c7c6c2]">
                    {gameInfo.gameId}
                  </p>
                </div>
              )}
            </section>

            {/* Move history */}
            <section className="flex min-h-[180px] max-h-[360px] flex-col rounded-xl border border-white/[0.07] bg-[#2b2926] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Move history</h2>
                <span className="rounded-md bg-[#211f1c] px-2 py-1 text-xs text-[#a7a6a2]">
                  {moveHistory.length} moves
                </span>
              </div>

              {moveHistory.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <span className="text-3xl text-[#77756f]">♞</span>
                  <p className="mt-3 text-sm text-[#c7c6c2]">No moves yet</p>
                  <p className="mt-1 text-xs text-[#8e8c86]">
                    Moves will appear here once the game begins.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-[36px_1fr_1fr] gap-x-3 gap-y-1 overflow-y-auto text-sm">
                  {Array.from(
                    { length: Math.ceil(moveHistory.length / 2) },
                    (_, index) => (
                      <div key={index} className="contents">
                        <span className="rounded-l px-2 py-2 text-xs text-[#8e8c86]">
                          {index + 1}.
                        </span>
                        <span className="rounded px-2 py-2 font-medium text-[#e8e6e3] odd:bg-white/[0.03]">
                          {moveHistory[index * 2]}
                        </span>
                        <span className="rounded px-2 py-2 font-medium text-[#e8e6e3] odd:bg-white/[0.03]">
                          {moveHistory[index * 2 + 1] ?? ""}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>

            {/* Game actions */}
            <section className="rounded-xl border border-white/[0.07] bg-[#2b2926] p-4 sm:p-5">
              <h2 className="mb-3 font-semibold">Game actions</h2>

              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={() => joinGame(timeControl)}
                  disabled={
                    !connected ||
                    isSearching ||
                    (!!gameInfo && !gameOverMessage)
                  }
                  className="w-full"
                >
                  Find Opponent
                </Button>

                <button
                  type="button"
                  onClick={() => setConfirmResign(true)}
                  disabled={!gameInfo || !!gameOverMessage}
                  className="w-full rounded-lg border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Resign game
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Resign confirmation */}
      {confirmResign && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resign-title"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#2b2926] p-6 shadow-2xl"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-300">
              !
            </div>

            <h2
              id="resign-title"
              className="mt-4 text-center text-xl font-bold"
            >
              Resign this game?
            </h2>
            <p className="mt-2 text-center text-sm leading-6 text-[#a7a6a2]">
              Your opponent will win this game. This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmResign(false)}
                className="flex-1 rounded-lg border border-white/10 bg-[#211f1c] px-4 py-3 text-sm font-semibold text-[#e8e6e3] transition hover:bg-white/[0.06]"
              >
                Keep playing
              </button>
              <button
                type="button"
                onClick={resignGame}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Resign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pawn promotion */}
      {pendingPromotion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promotion-title"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#2b2926] p-6 shadow-2xl"
          >
            <h2 id="promotion-title" className="text-center text-xl font-bold">
              Promote your pawn
            </h2>
            <p className="mb-5 mt-2 text-center text-sm text-[#a7a6a2]">
              Choose a piece for your promotion.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["q", "Queen", "♛"],
                  ["r", "Rook", "♜"],
                  ["b", "Bishop", "♝"],
                  ["n", "Knight", "♞"],
                ] as const
              ).map(([piece, label, symbol]) => (
                <Button
                  key={piece}
                  variant="secondary"
                  className="flex min-h-20 flex-col gap-1"
                  onClick={() => promotePawn(piece)}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {symbol}
                  </span>
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game over */}
      {gameOverMessage && showGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#2b2926] p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#81b64c]/15 text-3xl text-[#a8d477]">
              ♔
            </div>
            <h2 id="game-over-title" className="mt-4 text-2xl font-bold">
              Game Over
            </h2>
            <p className="my-4 text-sm leading-6 text-[#c7c6c2]">
              {gameOverMessage}
            </p>

            <Button
              onClick={() => {
                setPendingPromotion(null);
                setConfirmResign(false);
                setShowGameOver(true);
                joinGame(timeControl);
              }}
              disabled={!connected || isSearching}
              className="w-full"
            >
              {isSearching ? "Searching..." : "Find Opponent"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setConfirmResign(false);
                setPendingPromotion(null);
                clearErrorMessage();
                // Close the Game Over modal locally
                setShowGameOver(false);
              }}
              className="mt-3 w-full rounded-lg px-4 py-2 text-sm text-[#a7a6a2] transition hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default GamePage;
