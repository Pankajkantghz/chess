import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const HomePage = () => {
  const navigate = useNavigate();

  const squares = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;

    return {
      index,
      isLight: (row + col) % 2 === 0,
    };
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#161512] px-5 py-12 text-white sm:px-8">
      {/* Background accents */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#81b64c]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-[#81b64c]/10 blur-3xl" />

      <section className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        {/* Hero content */}
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-[#81b64c]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a3c981]">
              Chess · Strategy · Focus
            </span>
          </div>

          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl xl:text-7xl">
            Every move
            <br />
            <span className="text-[#81b64c]">matters.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-7 text-[#aaa9a5] sm:text-lg lg:mx-0">
            Sharpen your mind, challenge your instincts, and discover your next
            great move — one game at a time.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              size="lg"
              className="min-h-14 w-full min-w-48 justify-center rounded-lg bg-[#81b64c] px-8 text-base font-bold text-[#17210f] transition-colors hover:bg-[#95c85e] sm:w-auto"
              onClick={() => navigate("/game")}
            >
              Play Chess
            </Button>

            <div className="flex items-center gap-2 text-sm text-[#888780]">
              <span className="text-lg">♟</span>
              <span>Make your first move</span>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mx-auto mt-12 grid max-w-md grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-6 lg:mx-0">
            <div className="px-2 text-center lg:text-left">
              <p className="text-sm font-semibold text-white">Real-time</p>
              <p className="mt-1 text-xs text-[#888780]">Multiplayer</p>
            </div>

            <div className="px-2 text-center lg:text-left">
              <p className="text-sm font-semibold text-white">Live clocks</p>
              <p className="mt-1 text-xs text-[#888780]">Timed games</p>
            </div>

            <div className="px-2 text-center lg:text-left">
              <p className="text-sm font-semibold text-white">Every level</p>
              <p className="mt-1 text-xs text-[#888780]">Keep improving</p>
            </div>
          </div>
        </div>

        {/* Chessboard preview */}
        <div className="order-1 mx-auto w-full max-w-[510px] lg:order-2">
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-semibold text-white">
                The next move is yours
              </p>
              <p className="mt-1 text-xs text-[#888780]">
                Think ahead. Play with purpose.
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#aaa9a5]">
              8 × 8
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#252421] p-2 shadow-2xl shadow-black/40 sm:p-3">
            <div className="grid grid-cols-8 overflow-hidden rounded-md">
              {squares.map(({ index, isLight }) => (
                <div
                  key={index}
                  className={`relative aspect-square ${
                    isLight ? "bg-[#eeeed2]" : "bg-[#779556]"
                  }`}
                >
                  {/* Subtle board details */}
                  {index === 0 && (
                    <span className="absolute left-1 top-0.5 text-[8px] font-bold text-[#779556] sm:text-xs">
                      8
                    </span>
                  )}

                  {index >= 56 && (
                    <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-[#779556] sm:text-xs">
                      {"abcdefgh"[index % 8]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#81b64c]/15 text-xl text-[#a3c981]">
                ♞
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Your game awaits
                </p>
                <p className="mt-0.5 text-xs text-[#888780]">
                  Ready when you are
                </p>
              </div>
            </div>

            <span className="text-lg text-[#81b64c]">→</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
