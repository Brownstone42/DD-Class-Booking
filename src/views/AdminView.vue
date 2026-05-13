<template>
    <div class="fade-in">
        <!-- Auth loading -->
        <div
            v-if="!authChecked"
            class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
        >
            <div
                class="w-6 h-6 rounded-full border-2 border-white/10 border-t-primary animate-spin mx-auto"
            ></div>
            <p class="mt-4 text-muted">Verifying permissions...</p>
        </div>

        <!-- Access denied -->
        <div
            v-else-if="!isAdmin"
            class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
        >
            <div class="text-6xl mb-4">🚫</div>
            <h2 class="text-2xl font-bold">Access Denied</h2>
            <p class="text-muted mt-3">Sorry, only authorized coaches can access this page.</p>
            <router-link
                to="/"
                class="inline-flex items-center gap-2 mt-8 border border-white/10 text-white px-6 py-3 rounded-xl hover:bg-white/5 transition-colors"
            >
                Go Back Home
            </router-link>
        </div>

        <!-- Admin content -->
        <div v-else>
            <header class="mb-8">
                <h1 class="text-3xl font-bold">Coach Dashboard</h1>
                <p class="text-muted mt-1">Welcome back, {{ user.displayName }}</p>
            </header>

            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
                <h2 class="text-xl font-bold mb-6">
                    <i class="fas fa-plus-circle text-primary mr-2"></i>
                    {{ editingId ? 'Edit Session' : 'Setup New Session' }}
                </h2>

                <div class="grid gap-6">
                    <!-- Title -->
                    <div>
                        <label class="block mb-2 font-semibold text-sm">Session Title</label>
                        <input
                            type="text"
                            v-model="form.title"
                            placeholder="e.g. Friday Tennis Night"
                            class="field"
                        />
                    </div>

                    <!-- Date -->
                    <div>
                        <label class="block mb-2 font-semibold text-sm">Session Date</label>
                        <input ref="dateInput" type="text" class="field" placeholder="dd/mm/yyyy" />
                    </div>

                    <!-- Slots -->
                    <div class="border border-white/10 rounded-xl p-5">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-base font-semibold">Time Slots</h3>
                            <button
                                @click="addSlot"
                                class="inline-flex items-center gap-1.5 border border-white/10 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer bg-transparent"
                            >
                                <i class="fas fa-plus"></i> Slot
                            </button>
                        </div>

                        <div
                            v-for="(slot, index) in form.slots"
                            :key="index"
                            class="relative bg-white/[0.03] p-5 rounded-xl mb-4 border-l-4 border-l-primary border border-white/10"
                        >
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="block mb-2 font-semibold text-sm"
                                        >Start Time</label
                                    >
                                    <input
                                        type="time"
                                        v-model="slot.startTime"
                                        step="900"
                                        class="field"
                                    />
                                </div>
                                <div>
                                    <label class="block mb-2 font-semibold text-sm"
                                        >End Time</label
                                    >
                                    <input
                                        type="time"
                                        v-model="slot.endTime"
                                        step="900"
                                        class="field"
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="block mb-2 font-semibold text-sm"
                                        >Capacity</label
                                    >
                                    <input
                                        type="number"
                                        v-model="slot.capacity"
                                        min="1"
                                        class="field"
                                    />
                                </div>
                                <div>
                                    <label class="block mb-2 font-semibold text-sm"
                                        >Price (THB)</label
                                    >
                                    <input
                                        type="number"
                                        v-model="slot.price"
                                        min="0"
                                        class="field"
                                    />
                                </div>
                                <div>
                                    <label class="block mb-2 font-semibold text-sm">Group</label>
                                    <input
                                        type="text"
                                        v-model="slot.group"
                                        placeholder="e.g. A"
                                        class="field uppercase"
                                    />
                                </div>
                            </div>
                            <p class="text-[0.7rem] text-muted mt-2">
                                *Slots with the same group cannot be booked together.
                            </p>

                            <!-- Remove slot -->
                            <button
                                v-if="form.slots.length > 1"
                                @click="removeSlot(index)"
                                class="absolute -top-3 -right-3 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center cursor-pointer border-none text-xs hover:bg-red-400 transition-colors z-10"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Registration opening time -->
                    <div class="p-5 bg-primary/5 border border-primary rounded-xl">
                        <label class="block mb-1 font-bold text-sm text-primary"
                            >Registration Opening Time</label
                        >
                        <p class="text-xs text-muted mb-3">
                            When should people be able to start booking?
                        </p>
                        <input ref="dtInput" type="text" class="field" placeholder="dd/mm/yyyy HH:MM" />
                    </div>

                    <!-- Submit -->
                    <div v-if="!editingId">
                        <button
                            @click="saveSession"
                            :disabled="saving"
                            class="w-full py-4 bg-primary text-black font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(192,255,0,0.3)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            <span v-if="saving">
                                <span
                                    class="inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin align-middle mr-2"
                                ></span>
                                Saving...
                            </span>
                            <span v-else>Create Session</span>
                        </button>
                    </div>
                    <div v-else class="grid grid-cols-2 gap-4">
                        <button
                            @click="$router.push('/')"
                            class="py-4 border border-white/10 text-white bg-transparent rounded-xl hover:bg-white/5 transition-colors cursor-pointer font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            @click="updateSession"
                            :disabled="saving"
                            class="py-4 bg-primary text-black font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(192,255,0,0.3)] transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <span v-if="saving">
                                <span
                                    class="inline-block w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin align-middle mr-2"
                                ></span>
                                Saving...
                            </span>
                            <span v-else>Update Session</span>
                        </button>
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
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
} from 'firebase/firestore'

export default {
    name: 'AdminView',
    data() {
        return {
            user: null,
            authChecked: false,
            adminEmails: ['anawatbooch@gmail.com', 'wow0873233650@gmail.com'],
            saving: false,
            editingId: null,
            form: {
                title: '',
                date: '',
                slots: [this.blankSlot()],
                registrationOpenAt: '',
            },
        }
    },
    computed: {
        isAdmin() {
            return this.user && this.adminEmails.includes(this.user.email)
        },
    },
    async created() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.user = user
            this.authChecked = true
        })
        const editId = this.$route.query.edit
        if (editId) {
            this.editingId = editId
            await this.loadSession(editId)
        }
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
        this._fpDate?.destroy()
        this._fpDT?.destroy()
    },
    watch: {
        // Init flatpickr only after auth resolves and the form DOM is rendered
        authChecked(val) {
            if (val && this.isAdmin) {
                this.$nextTick(() => this.initFlatpickr())
            }
        },
        // Sync async-loaded edit data into flatpickr after init
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
                onChange: ([date]) => {
                    if (!date) { this.form.date = ''; return }
                    this.form.date = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
                },
            })
            this._fpDT = flatpickr(this.$refs.dtInput, {
                enableTime: true,
                dateFormat: 'd/m/Y H:i',
                minuteIncrement: 15,
                onChange: ([date]) => {
                    if (!date) { this.form.registrationOpenAt = ''; return }
                    this.form.registrationOpenAt = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
                },
            })
            // Sync values already loaded by loadSession (edit mode)
            if (this.form.date) this._fpDate.setDate(new Date(this.form.date + 'T00:00:00'), false)
            if (this.form.registrationOpenAt) this._fpDT.setDate(new Date(this.form.registrationOpenAt), false)
        },
        blankSlot() {
            return { startTime: '18:00', endTime: '20:00', capacity: 8, price: 300, group: '', isActive: true }
        },
        addSlot() {
            this.form.slots.push(this.blankSlot())
        },
        removeSlot(index) {
            this.form.slots.splice(index, 1)
        },
        timestampToLocalInput(ts) {
            const d = ts.toDate()
            const pad = (n) => String(n).padStart(2, '0')
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        },
        async loadSession(id) {
            try {
                const docSnap = await getDoc(doc(db, 'courses', id))
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    this.form = {
                        title: data.title,
                        date: data.date,
                        registrationOpenAt: this.timestampToLocalInput(data.registrationOpenAt),
                        slots: data.slots.map((s) => ({
                            startTime: s.startTime,
                            endTime: s.endTime,
                            capacity: s.capacity,
                            price: s.price,
                            group: s.group,
                            isActive: s.isActive,
                        })),
                    }
                }
            } catch (error) {
                console.error('Error loading session:', error)
                alert('Failed to load session data')
            }
        },
        async saveSession() {
            if (!this.form.title || !this.form.date || !this.form.registrationOpenAt) {
                alert('Please fill all required fields.')
                return
            }
            if (this.form.slots.some((s) => !s.startTime || !s.endTime)) {
                alert('Please fill in start and end times for all slots.')
                return
            }
            this.saving = true
            try {
                const q = query(
                    collection(db, 'courses'),
                    where('date', '==', this.form.date),
                    where('isTerminated', '==', false),
                )
                const existing = await getDocs(q)
                if (!existing.empty) {
                    alert(
                        `Error: A session for ${this.form.date} already exists. Terminate it before creating a new one.`,
                    )
                    return
                }
                const processedSlots = this.form.slots.map((slot, idx) => ({
                    id: `slot_${Date.now()}_${idx}`,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    capacity: parseInt(slot.capacity),
                    price: parseFloat(slot.price),
                    group: slot.group ? slot.group.toUpperCase() : '',
                    isActive: true,
                    attendees: [],
                    waitlist: [],
                }))
                await addDoc(collection(db, 'courses'), {
                    title: this.form.title,
                    date: this.form.date,
                    slots: processedSlots,
                    registrationOpenAt: new Date(this.form.registrationOpenAt),
                    isTerminated: false,
                    createdAt: serverTimestamp(),
                    createdBy: this.user.email,
                })
                alert('Session created successfully!')
                this.$router.push('/')
            } catch (error) {
                console.error('Error saving session:', error)
                alert('Failed to save session: ' + error.message)
            } finally {
                this.saving = false
            }
        },
        async updateSession() {
            if (!this.form.title || !this.form.date || !this.form.registrationOpenAt) {
                alert('Please fill all required fields.')
                return
            }
            this.saving = true
            try {
                const docRef = doc(db, 'courses', this.editingId)
                const currentDoc = await getDoc(docRef)
                const currentSlots = currentDoc.data().slots
                const finalSlots = this.form.slots.map((slot, idx) => {
                    const existing = currentSlots[idx]
                    return {
                        id: existing ? existing.id : `slot_${Date.now()}_${idx}`,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        capacity: parseInt(slot.capacity),
                        price: parseFloat(slot.price),
                        group: slot.group ? slot.group.toUpperCase() : '',
                        isActive: slot.isActive !== undefined ? slot.isActive : true,
                        attendees: existing ? existing.attendees : [],
                        waitlist: existing ? existing.waitlist : [],
                    }
                })
                await updateDoc(docRef, {
                    title: this.form.title,
                    date: this.form.date,
                    slots: finalSlots,
                    registrationOpenAt: new Date(this.form.registrationOpenAt),
                })
                alert('Session updated successfully!')
                this.$router.push('/')
            } catch (error) {
                console.error('Error updating session:', error)
                alert('Failed to update session: ' + error.message)
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
    color-scheme: dark;
}
.field:focus {
    outline: none;
    border-color: #c0ff00;
    background: rgba(255, 255, 255, 0.1);
}

/* Flatpickr accent color overrides */
:global(.flatpickr-day.selected),
:global(.flatpickr-day.selected:hover),
:global(.flatpickr-day.selected:focus) {
    background: #c0ff00;
    border-color: #c0ff00;
    color: #000;
}
:global(.flatpickr-day:hover),
:global(.flatpickr-day:focus) {
    background: rgba(192, 255, 0, 0.15);
    border-color: transparent;
    color: #fff;
}
:global(.flatpickr-time input:hover),
:global(.flatpickr-time input:focus),
:global(.flatpickr-time .flatpickr-am-pm:hover),
:global(.flatpickr-time .flatpickr-am-pm:focus) {
    background: rgba(192, 255, 0, 0.1);
}
:global(.flatpickr-day.today) {
    border-color: #c0ff00;
}
:global(.flatpickr-day.today:hover) {
    background: rgba(192, 255, 0, 0.15);
    color: #fff;
}
</style>
