<template>
    <div class="admin-view fade-in">
        <!-- Unauthenticated State -->
        <div v-if="!authChecked" class="glass" style="text-align: center; padding: 3rem">
            <div class="loader-sm" style="margin: 0 auto"></div>
            <p style="margin-top: 1rem; color: var(--text-muted)">Verifying permissions...</p>
        </div>

        <!-- Access Denied State -->
        <div v-else-if="!isAdmin" class="glass" style="text-align: center; padding: 3rem">
            <div style="font-size: 4rem; margin-bottom: 1rem">🚫</div>
            <h2>Access Denied</h2>
            <p style="color: var(--text-muted); margin-top: 1rem">
                Sorry, only authorized coaches can access this page.
            </p>
            <router-link to="/" class="btn btn-outline" style="margin-top: 2rem">
                Go Back Home
            </router-link>
        </div>

        <!-- Admin Content -->
        <div v-else class="admin-content">
            <header style="margin-bottom: 2rem">
                <h1>Coach Dashboard</h1>
                <p style="color: var(--text-muted)">Welcome back, {{ user.displayName }}</p>
            </header>

            <div class="glass session-form">
                <h2 style="margin-bottom: 1.5rem">
                    <i class="fas fa-plus-circle" style="color: var(--primary)"></i> Setup New
                    Session
                </h2>

                <div class="form-grid" style="display: grid; gap: 1.5rem">
                    <div class="form-group">
                        <label>Session Title</label>
                        <input
                            type="text"
                            v-model="form.title"
                            placeholder="e.g. Friday Tennis Night"
                        />
                    </div>

                    <div class="form-group">
                        <label>Session Date</label>
                        <VueDatePicker
                            v-model="form.date"
                            :enable-time-picker="false"
                            :formats="{ input: 'dd-MM-yyyy' }"
                            dark
                            placeholder="Select date"
                            auto-apply
                        />
                    </div>

                    <div
                        class="slots-section"
                        style="padding: 1rem; border: 1px solid var(--glass-border); border-radius: 12px"
                    >
                        <div
                            style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 1rem;
                            "
                        >
                            <h3 style="font-size: 1.1rem">Time Slots, Pricing & Logic</h3>
                            <button @click="addSlot" class="btn btn-outline" style="padding: 0.5rem 1rem">
                                <i class="fas fa-plus"></i> Add Slot
                            </button>
                        </div>

                        <div
                            v-for="(slot, index) in form.slots"
                            :key="index"
                            class="slot-card"
                            style="
                                background: rgba(255, 255, 255, 0.03);
                                padding: 1.2rem;
                                border-radius: 12px;
                                margin-bottom: 1.2rem;
                                position: relative;
                                border-left: 4px solid var(--primary);
                            "
                        >
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem">
                                <div class="form-group">
                                    <label>Start Time</label>
                                    <VueDatePicker
                                        v-model="slot.startTime"
                                        time-picker
                                        dark
                                        placeholder="Start"
                                        :time-config="{ minutesIncrement: 15 }"
                                        auto-apply
                                    />
                                </div>
                                <div class="form-group">
                                    <label>End Time</label>
                                    <VueDatePicker
                                        v-model="slot.endTime"
                                        time-picker
                                        dark
                                        placeholder="End"
                                        :time-config="{ minutesIncrement: 15 }"
                                        auto-apply
                                    />
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem">
                                <div class="form-group">
                                    <label>Capacity</label>
                                    <input type="number" v-model="slot.capacity" min="1" />
                                </div>
                                <div class="form-group">
                                    <label>Price (THB)</label>
                                    <input type="number" v-model="slot.price" min="0" />
                                </div>
                                <div class="form-group">
                                    <label>Group</label>
                                    <input
                                        type="text"
                                        v-model="slot.group"
                                        placeholder="e.g. A"
                                        style="text-transform: uppercase"
                                    />
                                </div>
                            </div>
                            <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.5rem">
                                *Slots with the same Conflict Group cannot be booked together.
                            </p>

                            <button
                                v-if="form.slots.length > 1"
                                @click="removeSlot(index)"
                                style="
                                    position: absolute;
                                    top: -10px;
                                    right: -10px;
                                    background: var(--error);
                                    color: white;
                                    border: none;
                                    border-radius: 50%;
                                    width: 24px;
                                    height: 24px;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    z-index: 1;
                                "
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>

                    <div
                        class="form-group"
                        style="
                            padding: 1.5rem;
                            background: rgba(192, 255, 0, 0.05);
                            border: 1px solid var(--primary);
                            border-radius: 12px;
                        "
                    >
                        <label style="color: var(--primary); font-weight: 700"
                            >Registration Opening Time</label
                        >
                        <p
                            style="
                                font-size: 0.8rem;
                                color: var(--text-muted);
                                margin-bottom: 0.8rem;
                            "
                        >
                            When should people be able to start booking?
                        </p>
                        <VueDatePicker
                            v-model="form.registrationOpenAt"
                            :formats="{ input: 'dd-MM-yyyy HH:mm' }"
                            dark
                            placeholder="Select date and time"
                            auto-apply
                        />
                    </div>

                    <div v-if="!editingId">
                        <button
                            @click="saveSession"
                            class="btn btn-primary"
                            :disabled="saving"
                            style="width: 100%; padding: 1.2rem"
                        >
                            <i v-if="saving" class="loader-sm"></i>
                            <span v-else>Create Session</span>
                        </button>
                    </div>
                    <div v-else style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem">
                        <button
                            @click="$router.push('/')"
                            class="btn btn-outline"
                            style="padding: 1.2rem"
                        >
                            Cancel
                        </button>
                        <button
                            @click="updateSession"
                            class="btn btn-primary"
                            :disabled="saving"
                            style="padding: 1.2rem"
                        >
                            <i v-if="saving" class="loader-sm"></i>
                            <span v-else>Update Session</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'

export default {
    name: 'AdminView',
    components: { VueDatePicker },
    data() {
        return {
            user: null,
            authChecked: false,
            adminEmails: ['anawatbooch@gmail.com', 'wow0873233650@gmail.com'],
            saving: false,
            editingId: null,
            form: {
                title: '',
                date: null,
                slots: [
                    {
                        startTime: { hours: 18, minutes: 0 },
                        endTime: { hours: 20, minutes: 0 },
                        capacity: 8,
                        price: 300,
                        group: '',
                        isActive: true,
                    },
                ],
                registrationOpenAt: null,
            },
        }
    },
    computed: {
        isAdmin() {
            return this.user && this.adminEmails.includes(this.user.email)
        },
    },
    async created() {
        onAuthStateChanged(auth, (user) => {
            this.user = user
            this.authChecked = true
        })

        const editId = this.$route.query.edit
        if (editId) {
            this.editingId = editId
            await this.loadSession(editId)
        }
    },
    methods: {
        addSlot() {
            this.form.slots.push({
                startTime: { hours: 18, minutes: 0 },
                endTime: { hours: 20, minutes: 0 },
                capacity: 8,
                price: 300,
                group: '',
                isActive: true,
            })
        },
        removeSlot(index) {
            this.form.slots.splice(index, 1)
        },
        async loadSession(id) {
            try {
                const docRef = doc(db, 'courses', id)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    this.form = {
                        title: data.title,
                        date: new Date(data.date),
                        registrationOpenAt: data.registrationOpenAt.toDate(),
                        slots: data.slots.map(s => ({
                            startTime: this.parseTime(s.startTime),
                            endTime: this.parseTime(s.endTime),
                            capacity: s.capacity,
                            price: s.price,
                            group: s.group,
                            isActive: s.isActive
                        }))
                    }
                }
            } catch (error) {
                console.error('Error loading session:', error)
                alert('Failed to load session data')
            }
        },
        parseTime(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number)
            return { hours, minutes }
        },
        async updateSession() {
            if (!this.form.title || !this.form.date || !this.form.registrationOpenAt) {
                alert('Please fill all required fields.')
                return
            }

            this.saving = true
            try {
                const dateObj = new Date(this.form.date)
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`

                const processedSlots = this.form.slots.map((slot, idx) => {
                    const formatTime = (t) => {
                        if (t instanceof Date) {
                            return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
                        } else if (t && typeof t === 'object' && 'hours' in t) {
                            return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`
                        }
                        return t // fallback
                    }

                    // Keep existing ID and data if editing, or create new
                    // Wait, we should probably keep the ID if we are editing.
                    // But processing them again is fine as long as we match the structure.
                    // However, we must preserve attendees/waitlist!
                    
                    return {
                        ...slot,
                        startTime: formatTime(slot.startTime),
                        endTime: formatTime(slot.endTime),
                        capacity: parseInt(slot.capacity),
                        price: parseFloat(slot.price),
                        group: slot.group ? slot.group.toUpperCase() : '',
                    }
                })

                // When updating, we must NOT overwrite attendees/waitlist.
                // So we need to fetch the current doc again to merge or use transactional update.
                // For simplicity here, let's fetch current slots first.
                const docRef = doc(db, 'courses', this.editingId)
                const currentDoc = await getDoc(docRef)
                const currentSlots = currentDoc.data().slots

                const finalSlots = processedSlots.map((newSlot, idx) => {
                    const existingSlot = currentSlots[idx] 
                    return {
                        ...newSlot,
                        id: existingSlot ? existingSlot.id : `slot_${Date.now()}_${idx}`,
                        attendees: existingSlot ? existingSlot.attendees : [],
                        waitlist: existingSlot ? existingSlot.waitlist : [],
                        isActive: newSlot.isActive !== undefined ? newSlot.isActive : true
                    }
                })

                await updateDoc(docRef, {
                    title: this.form.title,
                    date: dateStr,
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
        async saveSession() {
            if (!this.form.title || !this.form.date || !this.form.registrationOpenAt) {
                alert('Please fill all required fields.')
                return
            }

            this.saving = true
            try {
                // Formatting date for comparison
                const dateObj = new Date(this.form.date)
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`

                // --- NEW: Duplicate Date Check ---
                const q = query(
                    collection(db, 'courses'),
                    where('date', '==', dateStr),
                    where('isTerminated', '==', false)
                )
                const querySnapshot = await getDocs(q)
                if (!querySnapshot.empty) {
                    alert(`Error: A session for ${dateStr} already exists and is active. Please terminate it before creating a new one.`)
                    this.saving = false
                    return
                }
                // ----------------------------------

                // Process Slots
                const processedSlots = this.form.slots.map((slot, idx) => {
                    const formatTime = (t) => {
                        if (t instanceof Date) {
                            return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
                        } else if (t && typeof t === 'object' && 'hours' in t) {
                            return `${String(t.hours).padStart(2, '0')}:${String(t.minutes).padStart(2, '0')}`
                        }
                        throw new Error(`Invalid Time Format in Slot ${idx + 1}`)
                    }

                    return {
                        id: `slot_${Date.now()}_${idx}`,
                        startTime: formatTime(slot.startTime),
                        endTime: formatTime(slot.endTime),
                        capacity: parseInt(slot.capacity),
                        price: parseFloat(slot.price),
                        group: slot.group ? slot.group.toUpperCase() : '',
                        isActive: true,
                        attendees: [],
                        waitlist: [],
                    }
                })

                await addDoc(collection(db, 'courses'), {
                    title: this.form.title,
                    date: dateStr,
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
    },
}
</script>

<style scoped>
.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
}

.form-group input {
    width: 100%;
    padding: 0.8rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 8px;
    color: #fff;
    font-family: inherit;
    font-size: 1rem;
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.1);
}

.admin-view {
    margin-bottom: 2rem;
}

:deep(.dp__theme_dark) {
    --dp-background-color: var(--bg-dark);
    --dp-text-color: var(--text-main);
    --dp-hover-color: var(--bg-card);
    --dp-hover-text-color: var(--primary);
    --dp-column-header-text-color: var(--text-muted);
    --dp-primary-color: var(--primary);
    --dp-primary-text-color: #000;
    --dp-secondary-color: var(--glass-border);
    --dp-border-color: var(--glass-border);
    --dp-menu-border-color: var(--glass-border);
    --dp-border-radius: 12px;
}
</style>
