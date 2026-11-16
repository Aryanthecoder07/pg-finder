import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { auth, signOut } from "@/auth";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "PG Finder: real reviews from people who live there",
  description: "Find a PG by what living there is actually like.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-sans`}>
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
           <Link href="/" className="flex items-center gap-2">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src="/logo.png" alt="PG Finder logo" className="h-9 w-9 rounded-lg object-contain" />
  <span className="font-display text-lg font-bold tracking-tight text-slate-900">PG Finder</span>
</Link>
            <div className="flex items-center gap-2 text-sm">
              <Link href="/add" className="rounded-full bg-teal-800 px-4 py-2 font-medium text-white hover:bg-teal-900">
                Add your PG
              </Link>
              {session ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button className="rounded-full px-3 py-2 text-slate-600 hover:bg-slate-100">Sign out</button>
                </form>
              ) : (
                <Link href="/signin" className="rounded-full px-3 py-2 text-slate-700 hover:bg-slate-100">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-500">
          Reviews are written by residents. Rent and conditions can change, so confirm with the PG before paying.
        </footer>
      </body>
    </html>
  );
}