# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build to /dist
npm run preview   # Preview the production build locally
npm run format    # Format src/ with Prettier (no semicolons, single quotes, 4-space indent, 100 col)
```

## Architecture

**Vue 3 + Firebase SPA** for managing tennis class bookings. No backend — all data lives in Firestore with client-side Firebase SDK calls.

### Two pages

- `/` → `HomeView.vue` — public booking page (users browse slots and book/cancel)
- `/admin` → `AdminView.vue` — coach dashboard (create/edit sessions, mark payments, toggle slots)

`App.vue` owns the global auth state (`onAuthStateChanged`) and renders the top/bottom nav. Admin access is a hardcoded email whitelist check (`anawatbooch@gmail.com`, `wow0873233650@gmail.com`) — there is no roles collection.

### Firestore data model

Single `courses` collection. A course has an array of `slots`; each slot has `attendees[]` and `waitlist[]` arrays embedded in it. All booking mutations go through `runTransaction()` to prevent race conditions on concurrent joins/cancellations.

```
courses/{id}
  title, date (YYYY-MM-DD), registrationOpenAt (Timestamp), isTerminated (bool)
  slots[]: { id, startTime, endTime, capacity, price, group, isActive, attendees[], waitlist[] }
  attendee/waitlist item: { email, displayName, photoURL, isPaid }
```

Key invariants:
- `isTerminated: false` is always filtered — terminated courses are soft-deleted
- `group` on a slot prevents a user from booking two slots in the same group
- When an attendee cancels, the first waitlist entry is auto-promoted (inside the same transaction)

### Real-time updates

`HomeView` and `AdminView` both open a Firestore `onSnapshot` listener. Unsubscribe the listener in `beforeUnmount` / component cleanup to avoid leaks.

### Firebase config

Credentials are hardcoded in `src/firebase.js` (not in `.env`). Exports: `auth`, `db`, `provider` (GoogleAuthProvider).

### State management

Pinia is installed but unused for app state. All shared state (current user, courses list) is component-local or passed via props. The `stores/counter.js` is the template placeholder — ignore it.

### Styling

**Tailwind CSS v4** via `@tailwindcss/vite` plugin (no `tailwind.config.js` — CSS-first config). Custom theme defined in `src/assets/style.css` with `@theme`:
- `text-primary` / `bg-primary` → `#c0ff00` neon yellow
- `text-success` / `text-warning` / `text-error` → `#00e676` / `#ffb74d` / `#ff4d4d`
- `text-muted` → `#a1a1aa`

Glass card pattern: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`  
Primary button: `bg-primary text-black font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(192,255,0,0.3)]`  
Font Awesome 6 loaded from CDN in `index.html`. Breakpoint at 768px — mobile uses a fixed bottom navbar, desktop uses a top navbar.

### Path alias

`@` resolves to `./src` (configured in both `vite.config.js` and `jsconfig.json`).
