import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl border border-white/10 bg-[#151515]">
        <p className="text-xs font-mono text-[#E50914] tracking-widest">404</p>
        <h1 className="font-display text-3xl font-extrabold">
          PAGE NOT <span className="text-[#E50914]">FOUND</span>
        </h1>
        <p className="text-sm text-zinc-400">
          The page you are looking for does not exist or was moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#C10712] text-white font-bold text-xs uppercase tracking-wider"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
