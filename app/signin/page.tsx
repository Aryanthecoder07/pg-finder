import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

// Only allow redirects to paths on this site.
function safePath(p?: string) {
  try {
    const u = new URL(p ?? "/", "http://local");
    return u.pathname + u.search;
  } catch {
    return "/";
  }
}

const POINTS = [
  "One review per person per PG, so no ballot stuffing",
  "Rent shown by sharing type, as paid by residents",
  "Your name and email are never shown on reviews",
  "Your location is only used to check you are at the PG. It is not saved.",
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const to = safePath(sp.callbackUrl);
  if (await auth()) redirect(to);

  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
      <div className="relative overflow-hidden bg-teal-950 p-8 text-white md:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-700/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
<img src="/logo.png" alt="" className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium uppercase tracking-widest text-amber-300">PG Finder</p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight">Real reviews, checked on-site.</h2>
          <ul className="mt-6 space-y-3 text-sm text-teal-50/90">
            {POINTS.map((t) => (
              <li key={t} className="flex gap-3">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col justify-center p-8 md:p-10">
        <h1 className="font-display text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to add a PG or write a review. Browsing and searching never needs an account.
        </p>

        {sp.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign-in did not work. Please try again.
          </p>
        )}

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: to });
          }}
        >
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          By continuing you agree to post honest, first-hand reviews only.
        </p>
      </div>
    </div>
  );
}