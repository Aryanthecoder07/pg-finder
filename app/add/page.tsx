import AddPgForm from "@/components/AddPgForm";
import { currentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AddPg() {
  if (!(await currentUserId())) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Sign in to add a PG</h1>
        <p className="text-sm text-slate-600">We use Google sign-in so each person can post one review per PG.</p>
        <a className="btn inline-block" href="/signin?callbackUrl=%2Fadd">Sign in with Google</a>
      </div>
    );
  }
  return <AddPgForm />;
}
