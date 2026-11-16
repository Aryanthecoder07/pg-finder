export const metadata = { title: "Terms of Service | PG Finder" };

const CONTACT = "streamlitfreelancer@gmail.com";

export default function Terms() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-sm leading-relaxed text-slate-700">
      <h1 className="font-display text-3xl font-bold text-slate-900">Terms of Service</h1>
      <p className="text-slate-500">Last updated: 16 November 2026</p>

      <p>By using PG Finder you agree to these terms.</p>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">Posting reviews</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Post only honest, first-hand experience of a PG you live in or have lived in.</li>
        <li>Do not post reviews of a PG you own, manage or have been paid or asked to promote, and do not post fake or duplicate reviews.</li>
        <li>No hate speech, threats, harassment, or other people&apos;s private information. Do not upload photos that show people without their permission.</li>
        <li>You are responsible for what you post, and you confirm you have the right to share any photos you upload.</li>
      </ul>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">Our rights</h2>
      <p>
        We may remove content or restrict accounts that break these terms or that we believe are fake or harmful. By
        posting you give PG Finder permission to display your review and photos on the site.
      </p>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">No guarantees</h2>
      <p>
        Reviews are personal opinions from residents. Rent, food and conditions can change, and the information may be
        incomplete or out of date. Please confirm details with the PG and visit before paying. The site is provided
        &quot;as is&quot; without warranties, and we are not responsible for decisions made using it.
      </p>

      <h2 className="pt-2 font-display text-xl font-semibold text-slate-900">Contact</h2>
      <p>
        <a className="text-teal-800 underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </article>
  );
}