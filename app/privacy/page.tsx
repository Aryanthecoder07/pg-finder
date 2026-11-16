export const metadata = { title: "Privacy Policy | PG Finder" };

const CONTACT = "streamlitfreelancer@gmail.com";

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-sm leading-relaxed text-slate-700">
      <h1 className="font-display text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="text-slate-500">Last updated: 16 November 2026</p>

      <p>
        PG Finder is a website where residents review paying-guest (PG) accommodation. This page explains what
        information we handle and why.
      </p>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">What we collect</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <b>Google sign-in.</b> When you sign in with Google we receive your name, email address and profile picture.
          We use your Google account ID only to make sure each person posts one review per PG. Your name, email and
          picture are not shown on your reviews.
        </li>
        <li>
          <b>What you post.</b> PG details, rent, room type, ratings, written reviews, the information you give about who
          lives there and the food, and any photos you upload.
        </li>
        <li>
          <b>Location.</b> When you submit a review, your browser may share your location so we can check you are near the
          PG. We store only whether the check passed, not your coordinates. The PG&apos;s own pinned location is stored
          so others can find it. If you use &quot;Near me&quot;, your location is used for that search only and is not saved.
        </li>
        <li>
          <b>Basic technical data.</b> Your IP address is used for abuse prevention (rate limiting), and a cookie keeps
          you signed in.
        </li>
      </ul>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">Services we use</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Google (sign-in).</li>
        <li>MongoDB Atlas (database).</li>
        <li>Cloudinary (photo storage).</li>
        <li>Vercel (hosting).</li>
        <li>An embedding service (such as Google Gemini) that receives review and search text to power search by meaning.</li>
      </ul>
      <p>We do not sell your personal information or use it for advertising.</p>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">Public content</h2>
      <p>
        Reviews and photos you post are visible to everyone. Please do not post other people&apos;s personal details or
        photos of people without their permission.
      </p>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">Your choices</h2>
      <p>
        You can ask us to delete your reviews or your data at any time by writing to{" "}
        <a className="text-teal-800 underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>. You can stop sharing your
        location in your browser settings; reviews will then post without the on-site badge.
      </p>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">Changes and contact</h2>
      <p>
        We may update this policy and will change the date above when we do. Questions:{" "}
        <a className="text-teal-800 underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </article>
  );
}