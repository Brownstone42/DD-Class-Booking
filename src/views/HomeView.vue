<template>
    <div class="fade-in">
        <!-- Loading -->
        <div v-if="!authChecked || sessionsLoading" class="text-center py-12 text-muted">
            <div class="w-6 h-6 rounded-full border-2 border-white/10 border-t-primary animate-spin mx-auto mb-4"></div>
            Loading...
        </div>

        <div v-else>
            <header class="mb-8">
                <h1 class="text-3xl font-bold">Book a Session</h1>
                <p class="text-muted mt-1">Select your preferred time slots below.</p>
            </header>

            <div v-if="activeSessions.length === 0" class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center text-muted">
                No sessions available right now.
            </div>

            <div v-else class="grid gap-8">
                <div
                    v-for="session in activeSessions"
                    :key="session.id"
                    class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8"
                >
                    <!-- Session header -->
                    <div class="flex items-start justify-between gap-4 flex-wrap mb-6">
                        <div>
                            <h2 class="text-xl font-bold">{{ session.title }}</h2>
                            <p class="text-muted text-sm mt-1">
                                {{ formatDate(session.date) }} &middot; {{ session.startTime }}–{{ session.endTime }}
                            </p>
                        </div>
                        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 self-start">
                            Tier {{ session.activeTier }} Open
                        </span>
                    </div>

                    <!-- Registration not open yet -->
                    <div
                        v-if="!isRegistrationOpen(session)"
                        class="text-center py-6 text-muted text-sm bg-white/[0.03] rounded-xl border border-white/10"
                    >
                        <i class="fas fa-clock text-2xl mb-2 block"></i>
                        Registration opens {{ formatDateTime(session.registrationOpenAt) }}
                    </div>

                    <!-- User's existing booking -->
                    <div v-else-if="userBooking(session)">
                        <div
                            :class="[
                                'rounded-xl p-5 border',
                                userBooking(session).status === 'confirmed'
                                    ? 'bg-success/5 border-success/30'
                                    : 'bg-warning/5 border-warning/30'
                            ]"
                        >
                            <div class="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <p :class="['font-bold', userBooking(session).status === 'confirmed' ? 'text-success' : 'text-warning']">
                                        {{ userBooking(session).status === 'confirmed' ? 'Booking Confirmed' : 'On Waitlist' }}
                                    </p>
                                    <p class="text-sm text-muted mt-1" v-if="userBooking(session).status === 'confirmed'">
                                        {{ userBooking(session).confirmedStart }}–{{ userBooking(session).confirmedEnd }}
                                        &middot; ฿{{ bookingPrice(session, userBooking(session)) }}
                                        <span :class="['ml-2 text-xs px-2 py-0.5 rounded-full', userBooking(session).isPaid ? 'text-success bg-success/10' : 'text-warning bg-warning/10']">
                                            {{ userBooking(session).isPaid ? 'Paid' : 'Unpaid' }}
                                        </span>
                                    </p>
                                    <p class="text-sm text-muted mt-1" v-else>
                                        Preferred: {{ userBooking(session).yellowStart }}–{{ userBooking(session).yellowEnd }}
                                        <span v-if="userBooking(session).blueStart !== userBooking(session).yellowStart || userBooking(session).blueEnd !== userBooking(session).yellowEnd">
                                            &middot; must: {{ userBooking(session).blueStart }}–{{ userBooking(session).blueEnd }}
                                        </span>
                                        &middot; Tier {{ userBooking(session).preferredTier }}
                                    </p>
                                </div>
                                <button
                                    @click="cancelBooking(session)"
                                    :disabled="cancelling === session.id"
                                    class="text-sm px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/10 transition-colors cursor-pointer bg-transparent disabled:opacity-50"
                                >Cancel</button>
                            </div>
                        </div>
                    </div>

                    <!-- Tile selection -->
                    <div v-else>
                        <!-- Login prompt -->
                        <div v-if="!user" class="text-center py-6 text-muted text-sm bg-white/[0.03] rounded-xl border border-white/10 mb-4">
                            <i class="fas fa-lock text-xl mb-2 block"></i>
                            Log in to book a slot.
                        </div>

                        <!-- Tiles -->
                        <div class="flex flex-wrap gap-2 mb-4">
                            <button
                                v-for="(slot, si) in session.slots"
                                :key="si"
                                @click="user && handleTileClick(session.id, si, session)"
                                :class="tileClass(session.id, si, session)"
                                :disabled="!user"
                            >
                                <span class="font-mono font-semibold text-sm">{{ slot.startTime }}</span>
                                <span class="text-xs mt-0.5 opacity-80">฿{{ slot.price }}</span>
                                <span v-if="slotIsFull(session, si)" class="text-[0.6rem] mt-0.5 opacity-60">FULL</span>
                                <span v-else class="text-[0.6rem] mt-0.5 opacity-60">{{ slotRemaining(session, si) }} left</span>
                            </button>
                        </div>

                        <!-- Legend -->
                        <div class="flex gap-4 flex-wrap text-xs text-muted mb-5">
                            <span class="flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded bg-blue-500 inline-block"></span> Must have
                            </span>
                            <span class="flex items-center gap-1.5">
                                <span class="w-3 h-3 rounded bg-amber-400 inline-block"></span> Prefer but optional
                            </span>
                        </div>

                        <!-- Selection summary + book button -->
                        <div v-if="user && selectionInfo(session)" class="bg-white/[0.05] border border-white/10 rounded-xl p-4">
                            <div class="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <p class="font-semibold">
                                        {{ selectionInfo(session).yellowStart }}–{{ selectionInfo(session).yellowEnd }}
                                        <span
                                            v-if="selectionInfo(session).blueStart !== selectionInfo(session).yellowStart || selectionInfo(session).blueEnd !== selectionInfo(session).yellowEnd"
                                            class="text-muted text-sm font-normal ml-1"
                                        >(must: {{ selectionInfo(session).blueStart }}–{{ selectionInfo(session).blueEnd }})</span>
                                    </p>
                                    <p class="text-sm text-muted mt-0.5">
                                        Tier {{ selectionInfo(session).tier }}
                                        &middot; up to ฿{{ selectionInfo(session).maxPrice }}
                                    </p>
                                </div>
                                <button
                                    @click="book(session)"
                                    :disabled="booking === session.id"
                                    class="bg-primary text-black font-bold px-6 py-2.5 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(192,255,0,0.3)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    <span v-if="booking === session.id">
                                        <span class="inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin align-middle mr-1"></span>
                                        Booking...
                                    </span>
                                    <span v-else>Book</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, runTransaction } from 'firebase/firestore'
import {
    getBlockTier,
    findBestSubBlock,
    calcBlockPrice,
    findNextPromotion,
    getSlotLoad,
} from '../utils/booking'

export default {
    name: 'HomeView',
    data() {
        return {
            user: null,
            authChecked: false,
            sessionsLoading: true,
            sessions: [],
            tileSelections: {},
            booking: null,
            cancelling: null,
        }
    },
    computed: {
        activeSessions() {
            return this.sessions.filter((s) => !s.isTerminated)
        },
    },
    created() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.user = user
            this.authChecked = true
        })
        const q = query(collection(db, 'sessions'), where('isTerminated', '==', false))
        this.unsubscribeSessions = onSnapshot(q, (snap) => {
            this.sessions = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
            for (const s of this.sessions) {
                if (!this.tileSelections[s.id]) {
                    this.tileSelections[s.id] = Array(s.slots.length).fill('none')
                }
            }
            this.sessionsLoading = false
        })
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
        this.unsubscribeSessions?.()
    },
    methods: {
        formatDate(dateStr) {
            if (!dateStr) return ''
            const [y, m, d] = dateStr.split('-')
            return `${d}/${m}/${y}`
        },
        formatDateTime(ts) {
            if (!ts) return ''
            const d = ts.toDate ? ts.toDate() : new Date(ts)
            const pad = (n) => String(n).padStart(2, '0')
            return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        },
        isRegistrationOpen(session) {
            if (!session.registrationOpenAt) return false
            const openAt = session.registrationOpenAt.toDate
                ? session.registrationOpenAt.toDate()
                : new Date(session.registrationOpenAt)
            return new Date() >= openAt
        },
        userBooking(session) {
            if (!this.user) return null
            return (session.bookings || []).find((b) => b.email === this.user.email) ?? null
        },
        bookingPrice(session, bk) {
            if (!bk.confirmedStart) return 0
            return calcBlockPrice(session.slots, bk.confirmedStart, bk.confirmedEnd)
        },
        slotIsFull(session, slotIndex) {
            const slot = session.slots[slotIndex]
            return getSlotLoad(session.bookings || [], slot.startTime, slot.endTime) >= slot.capacity
        },
        slotRemaining(session, slotIndex) {
            const slot = session.slots[slotIndex]
            return Math.max(0, slot.capacity - getSlotLoad(session.bookings || [], slot.startTime, slot.endTime))
        },

        handleTileClick(sessionId, slotIndex, session) {
            const sel = [...(this.tileSelections[sessionId] || Array(session.slots.length).fill('none'))]
            const cur = sel[slotIndex]
            const next = cur === 'none' ? 'blue' : cur === 'blue' ? 'yellow' : 'none'
            const proposed = [...sel]
            proposed[slotIndex] = next
            if (this.isValidSelection(proposed)) {
                this.tileSelections[sessionId] = proposed
            }
        },
        isValidSelection(sel) {
            const blues = sel.map((s, i) => (s === 'blue' ? i : -1)).filter((i) => i >= 0)
            const yellows = sel.map((s, i) => (s === 'yellow' ? i : -1)).filter((i) => i >= 0)
            if (blues.length === 0) return yellows.length === 0
            const blueMin = Math.min(...blues)
            const blueMax = Math.max(...blues)
            if (blueMax - blueMin + 1 !== blues.length) return false
            if (yellows.some((y) => y >= blueMin && y <= blueMax)) return false
            const all = sel.map((s, i) => (s !== 'none' ? i : -1)).filter((i) => i >= 0)
            const allMin = Math.min(...all)
            const allMax = Math.max(...all)
            return allMax - allMin + 1 === all.length
        },
        selectionInfo(session) {
            const sel = this.tileSelections[session.id]
            if (!sel) return null
            const blues = sel.map((s, i) => (s === 'blue' ? i : -1)).filter((i) => i >= 0)
            if (blues.length === 0) return null
            const all = sel.map((s, i) => (s !== 'none' ? i : -1)).filter((i) => i >= 0)
            const blueStart = session.slots[Math.min(...blues)].startTime
            const blueEnd = session.slots[Math.max(...blues)].endTime
            const yellowStart = session.slots[Math.min(...all)].startTime
            const yellowEnd = session.slots[Math.max(...all)].endTime
            const tier = getBlockTier(session.tiers || [], yellowStart, yellowEnd)
            const maxPrice = calcBlockPrice(session.slots, yellowStart, yellowEnd)
            return { blueStart, blueEnd, yellowStart, yellowEnd, tier, maxPrice }
        },
        tileClass(sessionId, slotIndex, session) {
            const sel = this.tileSelections[sessionId] || []
            const state = sel[slotIndex] || 'none'
            const base = 'flex flex-col items-center justify-center w-20 h-20 rounded-xl border transition-all'
            if (state === 'blue') return `${base} bg-blue-500 border-blue-400 text-white cursor-pointer`
            if (state === 'yellow') return `${base} bg-amber-400 border-amber-300 text-black cursor-pointer`
            if (!this.user) return `${base} bg-white/5 border-white/10 text-muted opacity-60 cursor-default`
            return `${base} bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 cursor-pointer`
        },

        async book(session) {
            const info = this.selectionInfo(session)
            if (!info) return
            this.booking = session.id
            try {
                const sessionRef = doc(db, 'sessions', session.id)
                const result = await runTransaction(db, async (tx) => {
                    const snap = await tx.get(sessionRef)
                    const s = { id: snap.id, ...snap.data() }
                    if (!this.isRegistrationOpen(s)) throw new Error('Registration is not open yet.')
                    if ((s.bookings || []).find((b) => b.email === this.user.email)) {
                        throw new Error('You already have a booking for this session.')
                    }
                    const bestSub = findBestSubBlock(
                        s.slots, s.bookings || [],
                        info.blueStart, info.blueEnd, info.yellowStart, info.yellowEnd,
                    )
                    const preferredTier = getBlockTier(s.tiers || [], info.yellowStart, info.yellowEnd)
                    const newBooking = {
                        id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                        email: this.user.email,
                        displayName: this.user.displayName,
                        photoURL: this.user.photoURL,
                        blueStart: info.blueStart,
                        blueEnd: info.blueEnd,
                        yellowStart: info.yellowStart,
                        yellowEnd: info.yellowEnd,
                        preferredTier,
                        confirmedStart: bestSub?.start ?? null,
                        confirmedEnd: bestSub?.end ?? null,
                        status: bestSub ? 'confirmed' : 'waitlisted',
                        isPaid: false,
                        joinedAt: new Date(),
                    }
                    tx.update(sessionRef, { bookings: [...(s.bookings || []), newBooking] })
                    return newBooking.status
                })
                this.tileSelections[session.id] = Array(session.slots.length).fill('none')
                alert(result === 'confirmed' ? 'Booking confirmed!' : 'Added to waitlist.')
            } catch (err) {
                alert(err.message)
            } finally {
                this.booking = null
            }
        },

        async cancelBooking(session) {
            if (!confirm('Cancel your booking?')) return
            this.cancelling = session.id
            try {
                const sessionRef = doc(db, 'sessions', session.id)
                await runTransaction(db, async (tx) => {
                    const snap = await tx.get(sessionRef)
                    const s = { id: snap.id, ...snap.data() }
                    const toCancel = (s.bookings || []).find((b) => b.email === this.user.email)
                    if (!toCancel) throw new Error('Booking not found.')
                    const remaining = (s.bookings || []).filter((b) => b.email !== this.user.email)
                    let finalBookings = remaining
                    if (toCancel.status === 'confirmed') {
                        const promo = findNextPromotion({ ...s, bookings: remaining })
                        if (promo) {
                            finalBookings = finalBookings.map((b) =>
                                b.id === promo.bookingId
                                    ? { ...b, status: 'confirmed', confirmedStart: promo.confirmedStart, confirmedEnd: promo.confirmedEnd }
                                    : b,
                            )
                        }
                    }
                    tx.update(sessionRef, { bookings: finalBookings })
                })
            } catch (err) {
                alert(err.message)
            } finally {
                this.cancelling = null
            }
        },
    },
}
</script>
