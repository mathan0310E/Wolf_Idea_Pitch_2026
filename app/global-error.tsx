"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/10 bg-[#151515]">
        <h1 className="font-display text-2xl font-extrabold">
          SOMETHING WENT <span className="text-[#E50914]">WRONG</span>
        </h1>
        <p className="text-sm text-zinc-400">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
