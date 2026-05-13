// Pure booking logic — no Firebase dependencies

export const toMins = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
}

export const toTime = (mins) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

// Split a session time range into 1-hour slot objects
export function generateSlots(startTime, endTime) {
    const slots = []
    let cur = toMins(startTime)
    const end = toMins(endTime)
    while (cur < end) {
        slots.push({ startTime: toTime(cur), endTime: toTime(cur + 60) })
        cur += 60
    }
    return slots
}

// Tier number for a block. Unmapped blocks get (max defined tier + 1).
export function getBlockTier(tiers, blockStart, blockEnd) {
    for (const td of tiers) {
        for (const b of td.blocks) {
            if (b.start === blockStart && b.end === blockEnd) return td.tier
        }
    }
    return tiers.length ? Math.max(...tiers.map((t) => t.tier)) + 1 : 1
}

// All contiguous sub-blocks that contain every blue tile, ordered longest → shortest.
// Yellow tiles optionally extend the blue block on either side.
export function generateSubBlocks(blueStart, blueEnd, yellowStart, yellowEnd) {
    const bsM = toMins(blueStart)
    const beM = toMins(blueEnd)
    const leftCount = (bsM - toMins(yellowStart)) / 60
    const rightCount = (toMins(yellowEnd) - beM) / 60
    const results = []
    for (let extra = leftCount + rightCount; extra >= 0; extra--) {
        const iMax = Math.min(extra, leftCount)
        const iMin = Math.max(0, extra - rightCount)
        for (let i = iMax; i >= iMin; i--) {
            results.push({ start: toTime(bsM - i * 60), end: toTime(beM + (extra - i) * 60) })
        }
    }
    return results
}

// Number of confirmed bookings that cover a given slot
export function getSlotLoad(bookings, slotStart, slotEnd) {
    return bookings.filter(
        (b) => b.status === 'confirmed' && b.confirmedStart <= slotStart && b.confirmedEnd >= slotEnd,
    ).length
}

// True if every slot within [blockStart, blockEnd] has remaining capacity
export function canConfirmBlock(slots, bookings, blockStart, blockEnd) {
    const inBlock = slots.filter((s) => s.startTime >= blockStart && s.endTime <= blockEnd)
    return (
        inBlock.length > 0 &&
        inBlock.every((s) => getSlotLoad(bookings, s.startTime, s.endTime) < s.capacity)
    )
}

// Best (longest) confirmable sub-block for a user's blue/yellow selection, or null.
// Only tries sub-blocks that map to the same tier as the full yellow range.
export function findBestSubBlock(slots, bookings, blueStart, blueEnd, yellowStart, yellowEnd, tiers = []) {
    const preferredTier = getBlockTier(tiers, yellowStart, yellowEnd)
    return (
        generateSubBlocks(blueStart, blueEnd, yellowStart, yellowEnd).find((sub) =>
            getBlockTier(tiers, sub.start, sub.end) === preferredTier &&
            canConfirmBlock(slots, bookings, sub.start, sub.end),
        ) ?? null
    )
}

// Sum of slot prices within a block
export function calcBlockPrice(slots, blockStart, blockEnd) {
    return slots
        .filter((s) => s.startTime >= blockStart && s.endTime <= blockEnd)
        .reduce((sum, s) => sum + s.price, 0)
}

// Tier numbers that are currently active (≤ activeTier), sorted ascending
function getActiveTierNumbers(tiers, activeTier) {
    const defined = tiers.map((t) => t.tier).filter((t) => t <= activeTier)
    const lowest = tiers.length ? Math.max(...tiers.map((t) => t.tier)) + 1 : 1
    const set = new Set(defined)
    if (lowest <= activeTier) set.add(lowest)
    return [...set].sort((a, b) => a - b)
}

const tsMs = (ts) =>
    ts?.toMillis?.() ?? (ts instanceof Date ? ts.getTime() : Number(ts) ?? 0)

// Find the single next waitlisted booking to promote, checking tiers 1→N FCFS.
// Sub-blocks are only tried if they map to the same tier as the booking's preferredTier.
export function findNextPromotion(session) {
    const { slots, tiers, activeTier, bookings } = session

    const waitlisted = bookings
        .filter((b) => b.status === 'waitlisted')
        .sort((a, b) => tsMs(a.joinedAt) - tsMs(b.joinedAt))

    if (!waitlisted.length) return null

    for (const tier of getActiveTierNumbers(tiers, activeTier)) {
        for (const bk of waitlisted) {
            if (bk.preferredTier !== tier) continue
            for (const sub of generateSubBlocks(
                bk.blueStart, bk.blueEnd,
                bk.yellowStart, bk.yellowEnd,
            )) {
                if (
                    getBlockTier(tiers, sub.start, sub.end) === bk.preferredTier &&
                    canConfirmBlock(slots, bookings, sub.start, sub.end)
                ) {
                    return { bookingId: bk.id, confirmedStart: sub.start, confirmedEnd: sub.end }
                }
            }
        }
    }
    return null
}

// Simulate all cascading promotions after a tier opens or a cancellation
export function findAllPromotions(session) {
    const results = []
    const sim = session.bookings.map((b) => ({ ...b }))
    while (true) {
        const promo = findNextPromotion({ ...session, bookings: sim })
        if (!promo) break
        const idx = sim.findIndex((b) => b.id === promo.bookingId)
        sim[idx] = {
            ...sim[idx],
            status: 'confirmed',
            confirmedStart: promo.confirmedStart,
            confirmedEnd: promo.confirmedEnd,
        }
        results.push(promo)
    }
    return results
}
