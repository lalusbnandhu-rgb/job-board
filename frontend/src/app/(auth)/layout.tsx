import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left panel — branding ───────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          Job<span className="text-blue-200">Board</span>
        </Link>

        <div className="space-y-6">
          <blockquote className="text-3xl font-bold leading-tight">
            "The bridge between the talent you are and the career you deserve."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20" />
            <div>
              <p className="font-semibold">JobBoard Platform</p>
              <p className="text-sm text-blue-200">Connecting talent worldwide</p>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="pointer-events-none select-none">
          <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5" />
          <div className="absolute bottom-16 left-16 h-48 w-48 rounded-full bg-white/5" />
        </div>

        <p className="text-sm text-blue-300">
          © {new Date().getFullYear()} JobBoard. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12">
        {/* Mobile logo */}
        <Link
          href="/"
          className="mb-8 text-2xl font-extrabold tracking-tight lg:hidden"
        >
          Job<span className="text-blue-600">Board</span>
        </Link>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
