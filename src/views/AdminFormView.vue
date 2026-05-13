<template>
    <div class="fade-in">
        <div
            v-if="!authChecked"
            class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
        >
            <div class="w-6 h-6 rounded-full border-2 border-white/10 border-t-primary animate-spin mx-auto"></div>
            <p class="mt-4 text-muted">Verifying permissions...</p>
        </div>

        <div
            v-else-if="!isAdmin"
            class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
        >
            <div class="text-6xl mb-4">🚫</div>
            <h2 class="text-2xl font-bold">Access Denied</h2>
            <router-link to="/" class="inline-flex items-center gap-2 mt-8 border border-white/10 text-white px-6 py-3 rounded-xl hover:bg-white/5 transition-colors">
                Go Back Home
            </router-link>
        </div>

        <div v-else>
            <header class="mb-8 flex items-center gap-4">
                <router-link to="/admin" class="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-muted hover:text-white hover:bg-white/5 transition-colors">
                    <i class="fas fa-arrow-left text-sm"></i>
                </router-link>
                <h1 class="text-3xl font-bold">New Session</h1>
            </header>

            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
                <div class="grid gap-6">

                    <!-- Title -->
                    <div>
                        <label class="block mb-2 font-semibold text-sm">Session Title</label>
                        <input type="text" v-model="form.title" placeholder="e.g. Friday Tennis Night" class="field" />
                    </div>

                    <!-- Date -->
                    <div>
                        <label class="block mb-2 font-semibold text-sm">Date</label>
                        <input ref="dateInput" type="text" class="field" placeholder="dd/mm/yyyy" />
                    </div>

                    <!-- Session time range -->
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

                    <!-- Auto-generated slot rows -->
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
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h3 class="text-base font-semibold">Priority Tiers</h3>
                                <p class="text-xs text-muted mt-0.5">Tier 1 books immediately. Higher tiers wait for your trigger.</p>
                            </div>
                            <button
                                @click="addTier"
                                class="inline-flex items-center gap-1.5 border border-white/10 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer bg-transparent"
                            >
                                <i class="fas fa-plus"></i> Tier
                            </button>
                        </div>

                        <div v-if="form.tiers.length === 0" class="text-muted text-sm text-center py-4">
                            No tiers configured — all bookings treated equally (Tier 1).
                        </div>

                        <div
                            v-for="(tierDef, ti) in form.tiers"
                            :key="ti"
                            class="mb-4 bg-white/[0.03] p-4 rounded-xl border border-white/10"
                        >
                            <div class="flex items-center justify-between mb-3">
                                <span class="font-bold text-sm text-primary">Tier {{ tierDef.tier }}</span>
                                <button @click="removeTier(ti)" class="text-xs text-error hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none">
                                    Remove Tier
                                </button>
                            </div>

                            <div v-if="boundaryTimes.length < 2" class="text-xs text-muted mb-2">
                                Set session start &amp; end time first.
                            </div>

                            <div v-else class="grid gap-2 mb-3">
                                <div
                                    v-for="(block, bi) in tierDef.blocks"
                                    :key="bi"
                                    class="flex items-center gap-2"
                                >
                                    <select v-model="block.start" class="field text-sm py-2 flex-1">
                                        <option value="" disabled>Start</option>
                                        <option v-for="t in boundaryTimes.slice(0, -1)" :key="t" :value="t">{{ t }}</option>
                                    </select>
                                    <span class="text-muted text-sm">→</span>
                                    <select v-model="block.end" class="field text-sm py-2 flex-1">
                                        <option value="" disabled>End</option>
                                        <option
                                            v-for="t in boundaryTimes.slice(1)"
                                            :key="t"
                                            :value="t"
                                            :disabled="t <= block.start"
                                        >{{ t }}</option>
                                    </select>
                                    <button
                                        @click="removeBlock(ti, bi)"
                                        class="w-6 h-6 flex items-center justify-center text-error hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none flex-shrink-0"
                                    >
                                        <i class="fas fa-times text-xs"></i>
                                    </button>
                                </div>
                            </div>

                            <button
                                @click="addBlock(ti)"
                                :disabled="boundaryTimes.length < 2"
                                class="text-sm text-muted hover:text-white transition-colors cursor-pointer bg-transparent border-none disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                + Add Block
                            </button>
                        </div>
                    </div>

                    <!-- Registration opening time -->
                    <div class="p-5 bg-primary/5 border border-primary rounded-xl">
                        <label class="block mb-1 font-bold text-sm text-primary">Registration Opening Time</label>
                        <p class="text-xs text-muted mb-3">When should people be able to start booking?</p>
                        <input ref="dtInput" type="text" class="field" placeholder="dd/mm/yyyy HH:MM" />
                    </div>

                    <!-- Save -->
                    <button
                        @click="saveSession"
                        :disabled="saving"
                        class="w-full py-4 bg-primary text-black font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(192,255,0,0.3)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        <span v-if="saving">
                            <span class="inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin align-middle mr-2"></span>
                            Saving...
                        </span>
                        <span v-else>Create Session</span>
                    </button>

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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { generateSlots, toMins, toTime } from '../utils/booking'

export default {
    name: 'AdminFormView',
    data() {
        return {
            user: null,
            authChecked: false,
            adminEmails: ['anawatbooch@gmail.com', 'wow0873233650@gmail.com'],
            saving: false,
            form: {
                title: '',
                date: '',
                startTime: '',
                endTime: '',
                slots: [],
                tiers: [],
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
            while (cur <= end) {
                times.push(toTime(cur))
                cur += 60
            }
            return times
        },
    },
    created() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.user = user
            this.authChecked = true
        })
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
        this._fpDate?.destroy()
        this._fpStart?.destroy()
        this._fpEnd?.destroy()
        this._fpDT?.destroy()
    },
    watch: {
        authChecked(val) {
            if (val && this.isAdmin) this.$nextTick(() => this.initFlatpickr())
        },
        'form.date'(val) {
            if (this._fpDate) val ? this._fpDate.setDate(new Date(val + 'T00:00:00'), false) : this._fpDate.clear()
        },
        'form.registrationOpenAt'(val) {
            if (this._fpDT) val ? this._fpDT.setDate(new Date(val), false) : this._fpDT.clear()
        },
    },
    methods: {
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

        addTier() {
            const nextTier = this.form.tiers.length
                ? Math.max(...this.form.tiers.map((t) => t.tier)) + 1
                : 1
            this.form.tiers.push({ tier: nextTier, blocks: [] })
        },
        removeTier(ti) {
            this.form.tiers.splice(ti, 1)
            // Renumber remaining tiers
            this.form.tiers.forEach((t, i) => { t.tier = i + 1 })
        },
        addBlock(ti) {
            this.form.tiers[ti].blocks.push({ start: '', end: '' })
        },
        removeBlock(ti, bi) {
            this.form.tiers[ti].blocks.splice(bi, 1)
        },

        async saveSession() {
            if (!this.form.title.trim()) { alert('Please enter a session title.'); return }
            if (!this.form.date) { alert('Please select a date.'); return }
            if (!this.form.startTime || !this.form.endTime) { alert('Please set the session time range.'); return }
            if (this.form.slots.length === 0) { alert('Session must have at least one slot.'); return }
            if (!this.form.registrationOpenAt) { alert('Please set the registration opening time.'); return }

            // Validate tier blocks
            for (const td of this.form.tiers) {
                for (const b of td.blocks) {
                    if (!b.start || !b.end) { alert(`Tier ${td.tier} has an incomplete block.`); return }
                    if (b.end <= b.start) { alert(`Tier ${td.tier}: block end must be after start.`); return }
                }
            }

            this.saving = true
            try {
                await addDoc(collection(db, 'sessions'), {
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
                    tiers: this.form.tiers.map((td) => ({
                        tier: td.tier,
                        blocks: td.blocks.map((b) => ({ start: b.start, end: b.end })),
                    })),
                    registrationOpenAt: new Date(this.form.registrationOpenAt),
                    activeTier: 1,
                    bookings: [],
                    isTerminated: false,
                    createdAt: serverTimestamp(),
                    createdBy: this.user.email,
                })
                this.$router.push('/admin')
            } catch (err) {
                alert('Failed to create session: ' + err.message)
            } finally {
                this.saving = false
            }
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
select.field option {
    background: #1a1a1e;
    color: #fff;
}
:global(.flatpickr-day.selected),
:global(.flatpickr-day.selected:hover) {
    background: #c0ff00;
    border-color: #c0ff00;
    color: #000;
}
:global(.flatpickr-day:hover) {
    background: rgba(192, 255, 0, 0.15);
    border-color: transparent;
    color: #fff;
}
:global(.flatpickr-day.today) { border-color: #c0ff00; }
:global(.flatpickr-day.today:hover) { background: rgba(192, 255, 0, 0.15); color: #fff; }
:global(.flatpickr-time input:hover),
:global(.flatpickr-time input:focus) { background: rgba(192, 255, 0, 0.1); }
</style>
