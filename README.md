# PG Finder

Resident-written reviews of PGs (paying guest accommodation) with exact GPS pins,
structured questions (who lives there, community mix, food, cleanliness, rent),
photos, and natural-language (vector) search.

Stack: Next.js 15 (App Router, TypeScript, Tailwind 3), MongoDB Atlas (2dsphere + Atlas Vector Search),
Gemini embeddings (768 dims), Cloudinary for images, OpenStreetMap Nominatim for reverse geocoding.

## Setup (Windows PowerShell, Node 20.6 or newer)

```powershell
cd pg-finder
npm install
Copy-Item .env.example .env.local
# Fill in .env.local: MONGODB_URI, GEMINI_API_KEY, Cloudinary values, Google sign-in values (below)
npx auth secret       # generates AUTH_SECRET
npm run setup:db      # creates the geo index and the "pg_vector" Atlas Vector Search index
npm run dev           # http://localhost:3000
```

The vector index takes a minute or two to become ACTIVE in Atlas (Search & Vector Search tab).
Until then, search returns an error; "Show PGs near me" works immediately.

Geolocation only works on https:// or http://localhost.

## Google sign-in setup (free)

1. Go to https://console.cloud.google.com, create a project.
2. APIs & Services > OAuth consent screen: choose External, fill the app name and your email.
3. APIs & Services > Credentials > Create credentials > OAuth client ID > Web application.
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   (when live, also add `https://YOUR-DOMAIN/api/auth/callback/google`).
5. Copy the client ID and secret into `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env.local`.
6. While the consent screen is in "Testing", only test users you add can sign in. Publish the app to open it to everyone.

## Trust rules built in

- Sign-in is required to add a PG or a review. One review per Google account per PG (unique index).
- Rate limits: 5 reviews/day and 3 new PGs/day per account, 20 writes/day per IP.
- "Verified on-site": the browser's GPS at submit time must be within 150 m of the PG pin (accuracy 150 m or better).
  Only the yes/no result is stored, never the reviewer's position.
- The headline ratings use verified reviews only and appear after 3 of them. Unverified reviews still show, labelled.
- No owner accounts, and nobody can edit or delete a review through the API.

## Going live

- The Next.js app needs a host (for example Vercel, Render or any Node host). Set the same env vars there,
  and set `AUTH_TRUST_HOST=true` if the host is not Vercel.
- MongoDB Atlas and Cloudinary are already hosted services; there is nothing to deploy for them.
- In Cloudinary, restrict your unsigned upload preset (allowed formats, max file size, a folder) so strangers cannot abuse it.
- In Atlas > Network Access, allow your host's IPs.

## How it works

- Adding a PG creates a `pgs` document plus its first `reviews` document.
- Every new review recomputes the averages (ratings, community %, resident %, cuisines, rent range)
  and re-embeds a text summary + recent review text into `pgs.embedding`.
- `/api/search` embeds the query and runs `$vectorSearch`; `/api/pgs?lat&lng` runs `$geoNear`.

## Not built yet (do these before a public launch)

1. Reporting and editing of one's own review.
2. Moderation and reporting (fake reviews, owner retaliation, faces in photos).
3. Rent / gender / cuisine filters combined with vector search (add filter fields to the index).
4. A map view (Leaflet + OpenStreetMap) and a "pin on map" correction step.
5. Rate limiting on the API routes.
