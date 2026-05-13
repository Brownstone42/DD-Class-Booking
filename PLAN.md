# DD-Class-Booking — Pending Plan

## Latest changes (session ending here)

### Completed this session
- **Tier lock**: users cannot book a time period whose tier > `session.activeTier`; UI disables the Book button with a red message; transaction also enforces it server-side.
- **Must/prefer breakdown on booking cards**: confirmed and waitlisted cards in both HomeView and AdminSessionView now show coloured Must / Preferred labels.
- **Same-tier-only sub-blocks**: `findBestSubBlock` and `findNextPromotion` in `booking.js` now only try sub-blocks that map to the same tier as `preferredTier` — no cross-tier fallback.
- **Multiple waitlisted bookings per user**: users with only waitlisted bookings can make additional bookings for other tiers. If the new booking confirms, all their other waitlisted entries are auto-removed. If it stays waitlisted, both coexist until one confirms (then the other is dropped).
- **`cancelBooking` takes specific booking**: cancel button passes the exact booking object; after promoting the next person, that promoted person's other waitlisted entries are cleaned up.
- **`openNextTier` cleanup**: when coach opens next tier and `findAllPromotions` fires, each promoted user's remaining waitlisted entries are removed in the same transaction.
- **Edit Session collapsible**: the edit form card in AdminSessionView starts collapsed and toggles via a chevron header.
- **flatpickr init fix**: `initFlatpickr()` moved from `authChecked` watcher into the first Firestore snapshot callback so `$refs` exist before flatpickr tries to attach.

---

## Next planned features

### 0. ⭐ FIRST PRIORITY — Redesigned tier system

Complete rework of how tiers are defined, opened, and how users interact with them.

---

#### Tier 1 — Coach configures manually
Coach specifies two things per Tier 1 slot:
1. **List of connected time periods** — the allowed booking range (e.g. 10:00–14:00). Must be contiguous.
2. **Fixed time period (always blue)** — the must-have block within that range that every user's selection is locked to. Users cannot un-select this; it is pre-set blue for everyone.

So for Tier 1, the UI for a user would show tiles where the "fixed" slots are permanently blue and the surrounding optional slots can be toggled yellow.

---

#### Tier 2 — System auto-generates when coach opens it
No manual coach configuration. When coach clicks "Open Tier 2", the system:
1. Scans all 2-hour contiguous windows across the session's slots.
2. For each window where **both** slots still have remaining capacity, creates a Tier 2 block:
   - **Capacity** = `min(slot1.remaining, slot2.remaining)` (limited by the tighter slot)
   - **Price** = `slot1.price + slot2.price` (combined normally)
   - Both hours are **fixed blue** — users cannot modify the selection
3. Example: 18:00–19:00 has 3 left, 19:00–20:00 has 4 left → Tier 2 block is 18:00–20:00 with capacity 3 and combined price.

---

#### Tier 3 / Leftover — Coach opens remaining 1-hour blocks
After Tier 2 is filled or coach decides to move on, coach opens the leftover tier. This consists of all remaining individual 1-hour slots that weren't absorbed into Tier 2 blocks. These are also fixed blue (single-slot, no yellow extension).

---

#### Cross-tier waitlist participation
- Users waitlisted in a prior tier **can** register for the next tier when it opens (they see the new tier's slots as bookable).
- The moment a user is **confirmed** in any tier, they are automatically removed from **all** other tier waitlists they may be in.
- If a user books the new tier and it also goes to waitlist, both waitlist entries coexist until one confirms (existing behaviour).

---

#### Questions to clarify before implementation
- For Tier 1 "list of connected time periods": is this a single range (e.g. 10:00–14:00) or can there be multiple separate ranges in one tier?
- For Tier 2 auto-generation: does the system create ALL possible 2-hour windows, or only non-overlapping ones? (e.g. if 10–12 and 11–13 both qualify, do both become Tier 2 blocks?)
- Is "leftover" always Tier 3, or could there be more tiers beyond that?
- Admin UI: how does coach configure the Tier 1 fixed blue period — a time-range picker inside the tier card?

---

### 1. Tier descriptions on booking page
Show a short description for each tier in the session card on HomeView so users understand what time period each tier covers before selecting tiles.
- Source data: `session.tiers[].blocks[]` — each block has `start` and `end`.
- Display: under the session header (above the tiles), list each tier with its time blocks, e.g. "Tier 1 — 10:00–14:00, 11:00–14:00".
- Only show tiers that are already open (tier ≤ `session.activeTier`) so locked tiers stay hidden.

### 2. Registration countdown / estimated open time
Coach sets `registrationOpenAt` to an exact time (e.g. 15:32). Show a human-readable estimate in **1-hour intervals** on the booking page when registration is not yet open.

Rules:
- Round down to the nearest hour boundary: 15:32 → show "opens around 15:00–16:00".
- Once inside that hour window, show the exact time.
- After registration opens, the countdown disappears (existing behaviour).
- Use the existing `formatDateTime` / `isRegistrationOpen` helpers as a base.

### 3. Pull-to-refresh with animation
On HomeView, implement pull-to-refresh for mobile:
- Touch events (`touchstart`, `touchmove`, `touchend`) on the sessions container.
- Threshold: ~60 px pull distance before triggering refresh.
- Animation: a spinner or arrow indicator that appears at the top while pulling, plays a spin animation when released, then hides once the Firestore snapshot re-fires.
- Since data is already live via `onSnapshot`, the "refresh" just forces a re-fetch or shows a brief loading overlay — consider unsubscribing and re-subscribing the snapshot listener to force a server round-trip, or simply toggle a visual loading state for UX feedback.
