<template>
    <div class="fade-in">
        <div v-if="!authChecked" class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <div class="w-6 h-6 rounded-full border-2 border-white/10 border-t-primary animate-spin mx-auto"></div>
            <p class="mt-4 text-muted">Verifying permissions...</p>
        </div>

        <div v-else-if="!isAdmin" class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <div class="text-6xl mb-4">🚫</div>
            <h2 class="text-2xl font-bold">Access Denied</h2>
            <router-link to="/" class="inline-flex items-center gap-2 mt-8 border border-white/10 text-white px-6 py-3 rounded-xl hover:bg-white/5 transition-colors">Go Back Home</router-link>
        </div>

        <div v-else-if="sessionLoading" class="text-center py-12 text-muted">
            <div class="w-6 h-6 rounded-full border-2 border-white/10 border-t-primary animate-spin mx-auto mb-4"></div>
            Loading session...
        </div>

        <div v-else-if="!session" class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center text-muted">
            Session not found.
            <router-link to="/admin" class="block mt-4 text-primary hover:underline">Back to Dashboard</router-link>
        </div>

        <div v-else>
            <!-- Header -->
            <header class="mb-8 flex items-start gap-4 flex-wrap justify-between">
                <div class="flex items-center gap-4">
                    <router-link to="/admin" class="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-muted hover:text-white hover:bg-white/5 transition-colors flex-shrink-0">
                        <i class="fas fa-arrow-left text-sm"></i>
                    </router-link>
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold">{{ session.title }}</h1>
                        <p class="text-muted text-sm mt-1">{{ formatDate(session.date) }} &middot; {{ session.startTime }}–{{ session.endTime }}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <span v-if="session.isTerminated" class="text-xs font-semibold px-2.5 py-1 rounded-full bg-error/10 text-error border border-error/20 self-center">Terminated</span>
                    <span v-else class="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20 self-center">Tier {{ session.activeTier }} Open</span>
                    <button
                        v-if="!session.isTerminated"
                        @click="terminateSession"
                        class="text-xs px-3 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/10 transition-colors cursor-pointer bg-transparent"
                    >Terminate</button>
                </div>
            </header>

            <!-- Open Next Tier -->
            <div v-if="!session.isTerminated && hasMoreTiers" class="bg-primary/5 border border-primary rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <p class="font-bold text-primary">Ready to open Tier {{ session.activeTier + 1 }}?</p>
                    <p class="text-sm text-muted mt-0.5">This will promote eligible waitlisted users automatically.</p>
                </div>
                <button
                    @click="openNextTier"
                    :disabled="processing"
                    class="bg-primary text-black font-bold px-5 py-2.5 rounded-xl hover:-translate-y-0.5 transition-all cursor-pointer border-none disabled:opacity-60"
                >
                    Open Tier {{ session.activeTier + 1 }}
                </button>
            </div>

            <!-- Edit form -->
            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl mb-6 overflow-hidden">
                <button
                    @click="editExpanded = !editExpanded"
                    class="w-full flex items-center justify-between p-6 md:px-8 md:py-6 cursor-pointer bg-transparent border-none text-left"
                >
                    <h2 class="text-lg font-bold"><i class="fas fa-edit text-primary mr-2"></i>Edit Session</h2>
                    <i :class="editExpanded ? 'fa-chevron-up' : 'fa-chevron-down'" class="fas text-muted text-sm transition-transform"></i>
                </button>
                <div v-show="editExpanded" class="grid gap-6 px-6 md:px-8 pb-6 md:pb-8">
                    <div>
                        <label class="block mb-2 font-semibold text-sm">Session Title</label>
                        <input type="text" v-model="form.title" class="field" />
                    </div>
                    <div>
                        <label class="block mb-2 font-semibold text-sm">Date</label>
                        <input ref="dateInput" type="text" class="field" placeholder="dd/mm/yyyy" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block mb-2 font-semibold text-sm">Session Start</label>
                            <input ref="startInput" type="text" class="field" placeholder="HH:MM" />
                        </div>
                        <div>
                            <label class="block mb-2 font-semibold text-sm">Session End</label>
                            <input ref="endInput" type="text" class="field" placeholder="HH:MM" />
                        </div>
                    </div>

                    <!-- Slot capacities/prices -->
                    <div v-if="form.slots.length > 0" class="border border-white/10 rounded-xl p-5">
                        <h3 class="text-base font-semibold mb-4">Slot Configuration</h3>
                        <div class="grid gap-3">
                            <div
                                v-for="(slot, i) in form.slots"
                                :key="i"
                                class="grid grid-cols-4 gap-3 items-end bg-white/[0.03] p-3 rounded-xl border border-white/10"
                            >
                                <div class="col-span-2 font-mono text-sm text-muted self-center pt-5">
                                    {{ slot.startTime }} – {{ slot.endTime }}
                                </div>
                                <div>
                                    <label class="block mb-1 text-xs text-muted">Capacity</label>
                                    <input type="number" v-model.number="slot.capacity" min="1" class="field text-sm py-2" />
                                </div>
                                <div>
                                    <label class="block mb-1 text-xs text-muted">Price (THB)</label>
                                    <input type="number" v-model.number="slot.price" min="0" class="field text-sm py-2" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tier configuration -->
                    <div class="border border-white/10 rounded-xl p-5">
                        <div class="mb-4">
                            <h3 class="text-base font-semibold">Priority Tiers</h3>
                            <p class="text-xs text-muted mt-0.5">Tier 1 books immediately. Tier 2 &amp; 3 are auto-generated when opened.</p>
                        </div>
                        <!-- Tier 1 -->
                        <div class="mb-3 bg-white/[0.03] p-4 rounded-xl border border-white/10">
                            <span class="font-bold text-sm text-primary block mb-3">Tier 1</span>
                            <div v-if="boundaryTimes.length < 2" class="text-xs text-muted">Set session time first.</div>
                            <div v-else>
                                <label class="block text-xs text-muted mb-1.5">Fixed period (always blue — users cannot change)</label>
                                <div class="flex items-center gap-2 mb-4">
                                    <select v-model="form.tier1.fixedStart" class="field text-sm py-2 flex-1">
                                        <option value="" disabled>Fixed Start</option>
                                        <option v-for="t in boundaryTimes.slice(0, -1)" :key="t" :value="t">{{ t }}</option>
                                    </select>
                                    <span class="text-muted text-sm flex-shrink-0">→</span>
                                    <select v-model="form.tier1.fixedEnd" class="field text-sm py-2 flex-1">
                                        <option value="" disabled>Fixed End</option>
                                        <option v-for="t in boundaryTimes.slice(1)" :key="t" :value="t" :disabled="t <= form.tier1.fixedStart">{{ t }}</option>
                                    </select>
                                </div>
                                <label class="block text-xs text-muted mb-1.5">Allowed booking ranges (users can extend yellow up to these)</label>
                                <div class="grid gap-2 mb-3">
                                    <div v-for="(block, bi) in form.tier1.blocks" :key="bi" class="flex items-center gap-2">
                                        <select v-model="block.start" class="field text-sm py-2 flex-1">
                                            <option value="" disabled>Start</option>
                                            <option v-for="t in boundaryTimes.slice(0, -1)" :key="t" :value="t">{{ t }}</option>
                                        </select>
                                        <span class="text-muted text-sm flex-shrink-0">→</span>
                                        <select v-model="block.end" class="field text-sm py-2 flex-1">
                                            <option value="" disabled>End</option>
                                            <option v-for="t in boundaryTimes.slice(1)" :key="t" :value="t" :disabled="t <= block.start">{{ t }}</option>
                                        </select>
                                        <button @click="removeBlock(bi)" class="w-6 h-6 flex items-center justify-center text-error hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none flex-shrink-0">
                                            <i class="fas fa-times text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                                <button @click="addBlock" class="text-sm text-muted hover:text-white transition-colors cursor-pointer bg-transparent border-none">+ Add Range</button>
                            </div>
                        </div>
                        <!-- Tier 2/3 auto badges -->
                        <div class="mb-3 bg-white/[0.03] p-4 rounded-xl border border-white/10 opacity-50">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-sm text-muted">Tier 2</span>
                                <span class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted">Auto</span>
                            </div>
                            <p class="text-xs text-muted mt-1.5">Non-overlapping 2-hour blocks, auto-generated when opened.</p>
                        </div>
                        <div class="bg-white/[0.03] p-4 rounded-xl border border-white/10 opacity-50">
                            <div class="flex items-center justify-between">
                                <span class="font-bold text-sm text-muted">Tier 3 — Leftover</span>
                                <span class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted">Auto</span>
                            </div>
                            <p class="text-xs text-muted mt-1.5">Remaining 1-hour slots, auto-generated when opened.</p>
                        </div>
                    </div>

                    <!-- Registration opening time -->
                    <div class="p-5 bg-primary/5 border border-primary rounded-xl">
                        <label class="block mb-1 font-bold text-sm text-primary">Registration Opening Time</label>
                        <input ref="dtInput" type="text" class="field" placeholder="dd/mm/yyyy HH:MM" />
                    </div>

                    <button
                        @click="updateSession"
                        :disabled="saving"
                        class="w-full py-4 bg-primary text-black font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(192,255,0,0.3)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <span v-if="saving"><span class="inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin align-middle mr-2"></span>Saving...</span>
                        <span v-else>Save Changes</span>
                    </button>
                </div>
            </div>

            <!-- Bookings management -->
            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
                <h2 class="text-lg font-bold mb-6"><i class="fas fa-users text-primary mr-2"></i>Bookings</h2>

                <!-- Confirmed -->
                <h3 class="text-sm font-semibold text-success mb-3">Confirmed ({{ confirmedBookings.length }})</h3>
                <div v-if="confirmedBookings.length === 0" class="text-muted text-sm mb-6">No confirmed bookings yet.</div>
                <div v-else class="grid gap-2 mb-6">
                    <div
                        v-for="bk in confirmedBookings"
                        :key="bk.id"
                        class="flex items-center gap-3 bg-white/[0.03] p-3 rounded-xl border border-white/10"
                    >
                        <img :src="bk.photoURL" :alt="bk.displayName" class="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold truncate">{{ bk.displayName }}</p>
                            <p class="text-xs text-muted">{{ bk.confirmedStart }}–{{ bk.confirmedEnd }} &middot; ฿{{ blockPrice(bk) }}</p>
                            <p class="text-xs text-muted mt-0.5">
                                <span class="text-blue-400">Must</span> {{ bk.blueStart }}–{{ bk.blueEnd }}
                                <template v-if="bk.blueStart !== bk.yellowStart || bk.blueEnd !== bk.yellowEnd">
                                    &middot; <span class="text-amber-400">Preferred</span> {{ bk.yellowStart }}–{{ bk.yellowEnd }}
                                </template>
                            </p>
                        </div>
                        <button
                            @click="togglePayment(bk)"
                            :class="[
                                'text-xs px-2.5 py-1 rounded-full border font-semibold transition-colors cursor-pointer bg-transparent flex-shrink-0',
                                bk.isPaid
                                    ? 'border-success/30 text-success bg-success/5 hover:bg-success/10'
                                    : 'border-white/10 text-muted hover:border-white/20'
                            ]"
                        >{{ bk.isPaid ? 'Paid' : 'Unpaid' }}</button>
                    </div>
                </div>

                <!-- Waitlisted -->
                <h3 class="text-sm font-semibold text-warning mb-3">Waitlist ({{ waitlistedBookings.length }})</h3>
                <div v-if="waitlistedBookings.length === 0" class="text-muted text-sm">No one on the waitlist.</div>
                <div v-else class="grid gap-2">
                    <div
                        v-for="(bk, idx) in waitlistedBookings"
                        :key="bk.id"
                        class="flex items-center gap-3 bg-white/[0.03] p-3 rounded-xl border border-white/10"
                    >
                        <span class="text-xs text-muted w-5 text-center flex-shrink-0">#{{ idx + 1 }}</span>
                        <img :src="bk.photoURL" :alt="bk.displayName" class="w-8 h-8 rounded-full border border-white/10 flex-shrink-0" />
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold truncate">{{ bk.displayName }}</p>
                            <p class="text-xs text-muted">
                                <span class="text-blue-400">Must</span> {{ bk.blueStart }}–{{ bk.blueEnd }}
                                <template v-if="bk.blueStart !== bk.yellowStart || bk.blueEnd !== bk.yellowEnd">
                                    &middot; <span class="text-amber-400">Preferred</span> {{ bk.yellowStart }}–{{ bk.yellowEnd }}
                                </template>
                            </p>
                        </div>
                        <span class="text-xs px-2.5 py-1 rounded-full border border-warning/30 text-warning bg-warning/5 flex-shrink-0">
                            Tier {{ bk.preferredTier }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import flatpickr from 'flatpickr'
import 'flatpickr/dist/themes/dark.css'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot, updateDoc, runTransaction } from 'firebase/firestore'
import {
    generateSlots, toMins, toTime,
    findAllPromotions, calcBlockPrice,
    generateTier2Blocks, generateTier3Blocks, getConsumedIndicesFromTier2,
} from '../utils/booking'

export default {
    name: 'AdminSessionView',
    data() {
        return {
            user: null,
            authChecked: false,
            sessionLoading: true,
            editExpanded: false,
            adminEmails: ['anawatbooch@gmail.com', 'wow0873233650@gmail.com'],
            session: null,
            saving: false,
            processing: false,
            form: {
                title: '',
                date: '',
                startTime: '',
                endTime: '',
                slots: [],
                tier1: { fixedStart: '', fixedEnd: '', blocks: [] },
                registrationOpenAt: '',
            },
        }
    },
    computed: {
        isAdmin() {
            return this.user && this.adminEmails.includes(this.user.email)
        },
        boundaryTimes() {
            if (!this.form.startTime || !this.form.endTime) return []
            const times = []
            let cur = toMins(this.form.startTime)
            const end = toMins(this.form.endTime)
            while (cur <= end) { times.push(toTime(cur)); cur += 60 }
            return times
        },
        confirmedBookings() {
            return (this.session?.bookings || []).filter((b) => b.status === 'confirmed')
        },
        waitlistedBookings() {
            return (this.session?.bookings || [])
                .filter((b) => b.status === 'waitlisted')
                .sort((a, b) => {
                    const aMs = a.joinedAt?.toMillis?.() ?? 0
                    const bMs = b.joinedAt?.toMillis?.() ?? 0
                    return aMs - bMs
                })
        },
        hasMoreTiers() {
            if (!this.session || this.session.isTerminated) return false
            return this.session.activeTier < 3
        },
    },
    created() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.user = user
            this.authChecked = true
            if (user && this.adminEmails.includes(user.email)) {
                this.subscribeSession()
            } else {
                this.sessionLoading = false
            }
        })
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
        this.unsubscribeSession?.()
        this._fpDate?.destroy()
        this._fpStart?.destroy()
        this._fpEnd?.destroy()
        this._fpDT?.destroy()
    },
    watch: {
        'form.date'(val) {
            if (this._fpDate) val ? this._fpDate.setDate(new Date(val + 'T00:00:00'), false) : this._fpDate.clear()
        },
        'form.startTime'(val) {
            if (this._fpStart) val ? this._fpStart.setDate(new Date(`2000-01-01T${val}:00`), false) : this._fpStart.clear()
        },
        'form.endTime'(val) {
            if (this._fpEnd) val ? this._fpEnd.setDate(new Date(`2000-01-01T${val}:00`), false) : this._fpEnd.clear()
        },
        'form.registrationOpenAt'(val) {
            if (this._fpDT) val ? this._fpDT.setDate(new Date(val), false) : this._fpDT.clear()
        },
    },
    methods: {
        subscribeSession() {
            const sessionRef = doc(db, 'sessions', this.$route.params.id)
            this.unsubscribeSession = onSnapshot(sessionRef, (snap) => {
                if (!snap.exists()) { this.session = null; this.sessionLoading = false; return }
                this.session = { id: snap.id, ...snap.data() }
                this.populateForm(this.session)
                this.sessionLoading = false
                if (!this._fpDate) this.$nextTick(() => this.initFlatpickr())
            })
        },

        populateForm(session) {
            this.form = {
                title: session.title,
                date: session.date,
                startTime: session.startTime,
                endTime: session.endTime,
                slots: session.slots.map((s) => ({ ...s })),
                tier1: (() => {
                    const t1 = (session.tiers || []).find((td) => td.tier === 1)
                    return {
                        fixedStart: t1?.fixedStart ?? '',
                        fixedEnd: t1?.fixedEnd ?? '',
                        blocks: (t1?.blocks || []).map((b) => ({ ...b })),
                    }
                })(),
                registrationOpenAt: this.timestampToLocal(session.registrationOpenAt),
            }
        },

        timestampToLocal(ts) {
            const d = ts.toDate()
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        },

        initFlatpickr() {
            const pad = (n) => String(n).padStart(2, '0')

            this._fpDate = flatpickr(this.$refs.dateInput, {
                dateFormat: 'd/m/Y',
                onChange: ([d]) => {
                    if (!d) { this.form.date = ''; return }
                    this.form.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
                },
            })

            const timeOpts = (field) => ({
                noCalendar: true,
                enableTime: true,
                dateFormat: 'H:i',
                time_24hr: true,
                minuteIncrement: 60,
                onChange: ([d]) => {
                    if (!d) { this.form[field] = ''; return }
                    this.form[field] = `${pad(d.getHours())}:${pad(d.getMinutes())}`
                    this.regenerateSlots()
                },
            })
            this._fpStart = flatpickr(this.$refs.startInput, timeOpts('startTime'))
            this._fpEnd = flatpickr(this.$refs.endInput, timeOpts('endTime'))

            this._fpDT = flatpickr(this.$refs.dtInput, {
                enableTime: true,
                dateFormat: 'd/m/Y H:i',
                time_24hr: true,
                minuteIncrement: 15,
                onChange: ([d]) => {
                    if (!d) { this.form.registrationOpenAt = ''; return }
                    this.form.registrationOpenAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
                },
            })

            if (this.form.date) this._fpDate.setDate(new Date(this.form.date + 'T00:00:00'), false)
            if (this.form.startTime) this._fpStart.setDate(new Date(`2000-01-01T${this.form.startTime}:00`), false)
            if (this.form.endTime) this._fpEnd.setDate(new Date(`2000-01-01T${this.form.endTime}:00`), false)
            if (this.form.registrationOpenAt) this._fpDT.setDate(new Date(this.form.registrationOpenAt), false)
        },

        regenerateSlots() {
            if (!this.form.startTime || !this.form.endTime) return
            if (toMins(this.form.endTime) <= toMins(this.form.startTime)) return
            const newSlots = generateSlots(this.form.startTime, this.form.endTime)
            this.form.slots = newSlots.map((s) => {
                const existing = this.form.slots.find(
                    (e) => e.startTime === s.startTime && e.endTime === s.endTime,
                )
                return { ...s, capacity: existing?.capacity ?? 8, price: existing?.price ?? 300 }
            })
        },

        addBlock() { this.form.tier1.blocks.push({ start: '', end: '' }) },
        removeBlock(bi) { this.form.tier1.blocks.splice(bi, 1) },

        formatDate(dateStr) {
            if (!dateStr) return ''
            const [y, m, d] = dateStr.split('-')
            return `${d}/${m}/${y}`
        },

        blockPrice(bk) {
            if (!this.session || !bk.confirmedStart) return 0
            return calcBlockPrice(this.session.slots, bk.confirmedStart, bk.confirmedEnd)
        },

        async updateSession() {
            if (!this.form.title.trim() || !this.form.date || !this.form.startTime || !this.form.endTime || !this.form.registrationOpenAt) {
                alert('Please fill all required fields.')
                return
            }
            this.saving = true
            try {
                await updateDoc(doc(db, 'sessions', this.session.id), {
                    title: this.form.title.trim(),
                    date: this.form.date,
                    startTime: this.form.startTime,
                    endTime: this.form.endTime,
                    slots: this.form.slots.map((s) => ({
                        startTime: s.startTime,
                        endTime: s.endTime,
                        capacity: parseInt(s.capacity),
                        price: parseFloat(s.price),
                    })),
                    tiers: this._buildTiers(this.form.tier1, this.session.tiers || []),
                    registrationOpenAt: new Date(this.form.registrationOpenAt),
                })
            } catch (err) {
                alert('Failed to update: ' + err.message)
            } finally {
                this.saving = false
            }
        },

        _buildTiers(tier1Form, existingTiers) {
            // Preserve auto-generated Tier 2/3, replace Tier 1 from form
            const autoTiers = existingTiers.filter((t) => t.tier !== 1)
            const tiers = []
            if (tier1Form.fixedStart && tier1Form.fixedEnd) {
                tiers.push({
                    tier: 1,
                    fixedStart: tier1Form.fixedStart,
                    fixedEnd: tier1Form.fixedEnd,
                    blocks: tier1Form.blocks.map((b) => ({ start: b.start, end: b.end })),
                })
            }
            return [...tiers, ...autoTiers]
        },

        async openNextTier() {
            const newTier = this.session.activeTier + 1
            if (!confirm(`Open Tier ${newTier}? This will auto-generate blocks and promote eligible waitlisted users.`)) return
            this.processing = true
            try {
                const sessionRef = doc(db, 'sessions', this.session.id)
                let promotedCount = 0
                await runTransaction(db, async (tx) => {
                    const snap = await tx.get(sessionRef)
                    const s = { id: snap.id, ...snap.data() }
                    let newTierDef = null

                    if (newTier === 2) {
                        const { blocks } = generateTier2Blocks(s.slots, s.bookings || [])
                        newTierDef = { tier: 2, blocks }
                    } else if (newTier === 3) {
                        const tier2 = (s.tiers || []).find((t) => t.tier === 2)
                        const consumed = getConsumedIndicesFromTier2(s.slots, tier2?.blocks || [])
                        const blocks = generateTier3Blocks(s.slots, s.bookings || [], consumed)
                        newTierDef = { tier: 3, blocks }
                    }

                    const updatedTiers = [
                        ...(s.tiers || []).filter((t) => t.tier !== newTier),
                        ...(newTierDef ? [newTierDef] : []),
                    ]
                    const updatedSession = { ...s, activeTier: newTier, tiers: updatedTiers }
                    const promotions = findAllPromotions(updatedSession)
                    promotedCount = promotions.length

                    let bookings = [...(s.bookings || [])]
                    for (const promo of promotions) {
                        const promotedEmail = bookings.find((b) => b.id === promo.bookingId)?.email
                        bookings = bookings.map((b) =>
                            b.id === promo.bookingId
                                ? { ...b, status: 'confirmed', confirmedStart: promo.confirmedStart, confirmedEnd: promo.confirmedEnd }
                                : b,
                        )
                        if (promotedEmail) {
                            bookings = bookings.filter(
                                (b) => !(b.email === promotedEmail && b.status === 'waitlisted'),
                            )
                        }
                    }
                    tx.update(sessionRef, { activeTier: newTier, tiers: updatedTiers, bookings })
                })
                alert(`Tier ${newTier} opened. ${promotedCount} booking${promotedCount !== 1 ? 's' : ''} promoted.`)
            } catch (err) {
                alert('Failed: ' + err.message)
            } finally {
                this.processing = false
            }
        },

        async togglePayment(booking) {
            const sessionRef = doc(db, 'sessions', this.session.id)
            const updatedBookings = this.session.bookings.map((b) =>
                b.id === booking.id ? { ...b, isPaid: !b.isPaid } : b,
            )
            await updateDoc(sessionRef, { bookings: updatedBookings })
        },

        async terminateSession() {
            if (!confirm('Terminate this session? This cannot be undone.')) return
            await updateDoc(doc(db, 'sessions', this.session.id), { isTerminated: true })
            this.$router.push('/admin')
        },
    },
}
</script>

<style scoped>
.field {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    color: #fff;
    font-family: inherit;
    font-size: 1rem;
    transition: border-color 0.2s, background 0.2s;
}
.field:focus {
    outline: none;
    border-color: #c0ff00;
    background: rgba(255, 255, 255, 0.1);
}
select.field option { background: #1a1a1e; color: #fff; }
:global(.flatpickr-day.selected),
:global(.flatpickr-day.selected:hover) { background: #c0ff00; border-color: #c0ff00; color: #000; }
:global(.flatpickr-day:hover) { background: rgba(192, 255, 0, 0.15); border-color: transparent; color: #fff; }
:global(.flatpickr-day.today) { border-color: #c0ff00; }
:global(.flatpickr-day.today:hover) { background: rgba(192, 255, 0, 0.15); color: #fff; }
:global(.flatpickr-time input:hover),
:global(.flatpickr-time input:focus) { background: rgba(192, 255, 0, 0.1); }
</style>
