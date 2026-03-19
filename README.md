```txt
npm install
npm run dev
```

**Clerk auth:** Protected routes (`/ask`, `/api/chat`, `/debug`) require a valid Clerk session. Add to `.dev.vars` (local) or Wrangler secrets (production):

```txt
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
```

Your frontend must send the Clerk session token in the `Authorization: Bearer <token>` header. Use `getToken()` from `@clerk/clerk-react` (or your Clerk client) to obtain the token before each request.

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
