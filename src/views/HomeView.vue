<template>
    <div class="home-view fade-in">
        <header class="hero-section" style="margin-bottom: 2rem; text-align: center">
            <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem">Tennis Class Booking</h1>
            <p style="color: var(--text-muted)">Select your session and join the game.</p>
        </header>

        <!-- My Bookings Summary -->
        <section v-if="user && myBookings.length > 0" class="my-bookings-section" style="margin-bottom: 3rem">
            <div class="glass" style="padding: 1.5rem; border-left: 4px solid var(--primary)">
                <h3 style="margin-bottom: 1rem"><i class="fas fa-calendar-check"></i> My Active Bookings</h3>
                <div style="display: grid; gap: 1rem">
                    <div v-for="item in myBookings" :key="item.slot.id" class="booking-item-mini" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                        <div>
                            <div style="font-weight: 700">{{ item.courseTitle }}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted)">
                                {{ formatDate(item.courseDate) }} | {{ item.slot.startTime }} - {{ item.slot.endTime }}
                            </div>
                            <div :class="item.type === 'attendee' ? 'text-success' : 'text-warning'" style="font-size: 0.8rem; font-weight: 600; margin-top: 2px;">
                                {{ item.type === 'attendee' ? '● Confirmed' : '● Waitlisted #' + item.queuePos }}
                            </div>
                        </div>
                        <button @click="handleCancel(item.courseId, item.slot)" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.8rem; color: var(--error); border-color: var(--error);">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Course List -->
        <div v-if="loading" class="glass" style="text-align: center; padding: 3rem">
            <div class="loader-sm" style="margin: 0 auto"></div>
            <p style="margin-top: 1rem; color: var(--text-muted)">Loading sessions...</p>
        </div>

        <!-- Empty State (No Active Sessions) -->
        <div v-else-if="sortedCourses.length === 0" class="glass" style="text-align: center; padding: 3rem">
            <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem; display: block;"></i>
            <p style="color: var(--text-muted); font-size: 1.1rem;">No active sessions available at the moment.</p>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Please check back later or contact the coach.</p>
        </div>

        <div v-else class="course-list" style="display: grid; gap: 2rem">
            <div v-for="course in sortedCourses" :key="course.id" class="glass course-card">
                <div class="course-header" style="margin-bottom: 1.5rem">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start">
                        <div>
                            <h2 style="color: var(--primary)">{{ course.title }}</h2>
                            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem;">
                                <p style="font-size: 1.1rem; font-weight: 600">
                                    <i class="far fa-calendar-alt"></i> {{ formatDate(course.date) }}
                                </p>
                                <p v-if="isRegistrationClosed(course) && !allSlotsClosed(course)" style="font-size: 0.9rem; color: var(--warning); background: rgba(255, 183, 77, 0.1); padding: 2px 8px; border-radius: 4px;">
                                    <i class="far fa-clock"></i> Estimate Open: {{ estimateOpenTime(course.registrationOpenAt) }}
                                </p>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem">
                            <button v-if="isAdmin" @click="editSession(course.id)" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.7rem; border-color: var(--primary); color: var(--primary);">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <div class="reg-status" :class="getRegistrationStatus(course).class">
                                {{ getRegistrationStatus(course).label }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="slots-grid" style="display: grid; gap: 1rem">
                    <div v-for="slot in course.slots" :key="slot.id" class="slot-item-wrapper">
                        <div class="slot-item" style="background: rgba(255, 255, 255, 0.03); padding: 1.2rem; border-radius: 12px; border: 1px solid var(--glass-border);">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                                <div class="slot-info">
                                    <div style="font-size: 1.2rem; font-weight: 700">{{ slot.startTime }} - {{ slot.endTime }}</div>
                                    <div style="color: var(--primary); font-weight: 600">{{ slot.price }} THB</div>
                                    
                                    <!-- Clickable Capacity & Waitlist to Expand -->
                                    <div @click="toggleExpand(slot.id)" style="cursor: pointer; margin-top: 6px;">
                                        <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                                            <span>Capacity: {{ slot.attendees.length }}/{{ slot.capacity }}</span>
                                            <i class="fas" :class="isExpanded(slot.id) ? 'fa-chevron-up' : 'fa-chevron-down'" style="font-size: 0.7rem;"></i>
                                        </div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500; margin-top: 2px;">
                                            Waitlist: {{ slot.waitlist.length }}
                                        </div>
                                    </div>
                                    
                                    <div v-if="slot.group" style="font-size: 0.7rem; background: var(--glass-border); padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block;">
                                        Group: {{ slot.group }}
                                    </div>
                                </div>

                                <div class="slot-action" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <!-- Admin Control Section -->
                                    <div v-if="isAdmin" style="flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: center;">
                                        <button 
                                            @click="toggleSlotStatus(course, slot)" 
                                            class="btn" 
                                            :class="slot.isActive ? 'btn-outline' : 'btn-primary'"
                                            style="padding: 0.8rem 0.5rem; font-size: 0.8rem; border-color: var(--error); color: var(--error); width: 100%;"
                                            v-if="slot.isActive"
                                        >
                                            <i class="fas fa-hand-paper"></i> Stop
                                        </button>
                                        <button 
                                            @click="toggleSlotStatus(course, slot)" 
                                            class="btn btn-primary" 
                                            style="padding: 0.8rem 0.5rem; font-size: 0.8rem; width: 100%;"
                                            v-else
                                        >
                                            <i class="fas fa-play"></i> Start
                                        </button>
                                    </div>

                                    <div style="flex: 2; min-width: 150px;">
                                        <div v-if="isUserInSlot(slot)" class="status-badge success" style="height: 100%; justify-content: center;">
                                            <i class="fas fa-check-circle"></i> Enrolled
                                        </div>
                                        <div v-else-if="isUserInWaitlist(slot)" class="status-badge warning" style="height: 100%; justify-content: center;">
                                            <i class="fas fa-clock"></i> Waitlisted
                                        </div>
                                        <button v-else @click="handleBooking(course, slot)" class="btn" :class="getButtonClass(course, slot)" :disabled="isButtonDisabled(course, slot)" style="width: 100%;">
                                            <span v-if="!user">Login</span>
                                            <span v-else-if="!slot.isActive">Closed</span>
                                            <span v-else-if="isConflicting(course, slot)">Conflict</span>
                                            <span v-else-if="isRegistrationClosed(course)">Upcoming</span>
                                            <span v-else-if="slot.attendees.length < slot.capacity">Join</span>
                                            <span v-else>Join</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Expandable Attendee List -->
                            <transition name="slide">
                                <div v-if="isExpanded(slot.id)" class="attendee-list-container" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
                                    <div v-if="slot.attendees.length === 0 && slot.waitlist.length === 0" style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">
                                        No one has joined yet.
                                    </div>
                                    
                                    <!-- Attendees Section -->
                                    <div v-if="slot.attendees.length > 0" class="list-section" style="margin-bottom: 1rem;">
                                        <h4 style="font-size: 0.8rem; color: var(--success); margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Confirmed Attendees</h4>
                                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.8rem;">
                                            <div v-for="person in slot.attendees" :key="person.email" class="person-tag" :class="{ 'is-paid': person.isPaid }">
                                                <img :src="person.photoURL || 'https://ui-avatars.com/api/?name='+person.displayName" class="avatar">
                                                <span class="name">{{ person.displayName || person.email.split('@')[0] }}</span>
                                                
                                                <!-- Paid Status Indicator (Admin only can toggle) -->
                                                <button v-if="isAdmin" @click.stop="togglePaymentStatus(course, slot, person)" class="paid-toggle" :class="{ 'active': person.isPaid }" title="Mark as paid">
                                                    <i class="fas fa-money-bill-wave"></i>
                                                </button>
                                                <i v-else-if="person.isPaid" class="fas fa-check-circle" style="color: var(--success); font-size: 0.7rem;"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Waitlist Section -->
                                    <div v-if="slot.waitlist.length > 0" class="list-section">
                                        <h4 style="font-size: 0.8rem; color: var(--warning); margin-bottom: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Waitlist Queue</h4>
                                        <div style="display: grid; gap: 0.5rem;">
                                            <div v-for="(person, idx) in slot.waitlist" :key="person.email" class="person-row">
                                                <span class="queue-num">#{{ idx + 1 }}</span>
                                                <img :src="person.photoURL || 'https://ui-avatars.com/api/?name='+person.displayName" class="avatar-sm">
                                                <span class="name-sm">{{ person.displayName || person.email.split('@')[0] }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>

                <!-- Admin End Session Section -->
                <div v-if="isAdmin && allSlotsClosed(course)" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--glass-border);">
                    <button @click="endSession(course)" class="btn btn-outline" style="width: 100%; color: var(--error); border-color: var(--error);">
                        <i class="fas fa-power-off"></i> Terminate Session
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, onSnapshot, doc, updateDoc, runTransaction, where } from 'firebase/firestore'

export default {
    name: 'HomeView',
    data() {
        return {
            user: null,
            loading: true,
            courses: [],
            expandedSlots: [], // To track which slots are expanded
        }
    },
    computed: {
        isAdmin() {
            const adminEmails = ['anawatbooch@gmail.com', 'wow0873233650@gmail.com']
            return this.user && adminEmails.includes(this.user.email)
        },
        sortedCourses() {
            return [...this.courses].filter((c) => !c.isTerminated).sort((a, b) => new Date(a.date) - new Date(b.date))
        },
        myBookings() {
            if (!this.user) return []
            const bookings = []
            this.courses.forEach((course) => {
                if (course.isTerminated) return
                course.slots.forEach((slot) => {
                    const inAttendee = slot.attendees.some(a => (a.email || a) === this.user.email)
                    const waitlistIdx = slot.waitlist.findIndex(a => (a.email || a) === this.user.email)
                    
                    if (inAttendee) {
                        bookings.push({ courseId: course.id, courseTitle: course.title, courseDate: course.date, slot, type: 'attendee' })
                    } else if (waitlistIdx !== -1) {
                        bookings.push({ courseId: course.id, courseTitle: course.title, courseDate: course.date, slot, type: 'waitlist', queuePos: waitlistIdx + 1 })
                    }
                })
            })
            return bookings
        },
    },
    created() {
        onAuthStateChanged(auth, (user) => { this.user = user })
        onSnapshot(query(collection(db, 'courses'), where('isTerminated', '==', false)), (snapshot) => {
            this.courses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            this.loading = false
        })
    },
    methods: {
        toggleExpand(slotId) {
            const index = this.expandedSlots.indexOf(slotId)
            if (index > -1) this.expandedSlots.splice(index, 1)
            else this.expandedSlots.push(slotId)
        },
        isExpanded(slotId) {
            return this.expandedSlots.includes(slotId)
        },
        editSession(id) {
            this.$router.push({ name: 'admin', query: { edit: id } })
        },
        formatDate(dateStr) {
            if (!dateStr) return ''
            const [year, month, day] = dateStr.split('-')
            return `${day}/${month}/${year}`
        },
        estimateOpenTime(openAt) {
            if (!openAt) return ''
            const date = openAt.toDate()
            const hour = date.getHours()
            return `${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00`
        },
        getRegistrationStatus(course) {
            if (this.allSlotsClosed(course)) return { label: 'Closed', class: 'closed' }
            const now = new Date(); const openAt = course.registrationOpenAt.toDate()
            return now < openAt ? { label: 'Upcoming', class: 'upcoming' } : { label: 'Open', class: 'open' }
        },
        allSlotsClosed(course) { return course.slots.every((s) => !s.isActive) },
        isRegistrationClosed(course) { return new Date() < course.registrationOpenAt.toDate() },
        isUserInSlot(slot) { return this.user && slot.attendees.some(a => (a.email || a) === this.user.email) },
        isUserInWaitlist(slot) { return this.user && slot.waitlist.some(a => (a.email || a) === this.user.email) },
        isConflicting(course, slot) {
            if (!this.user || !slot.group) return false
            return course.slots.some((s) => s.group === slot.group && s.id !== slot.id && this.isUserInSlot(s))
        },
        getButtonClass(course, slot) {
            if (!this.user) return 'btn-outline'
            if (!slot.isActive || this.isRegistrationClosed(course) || this.isConflicting(course, slot)) return 'btn-disabled'
            return 'btn-primary'
        },
        isButtonDisabled(course, slot) { return !slot.isActive || this.isRegistrationClosed(course) || this.isConflicting(course, slot) },
        async toggleSlotStatus(course, slot) {
            try {
                const updatedSlots = course.slots.map((s) => (s.id === slot.id ? { ...s, isActive: !s.isActive } : s))
                await updateDoc(doc(db, 'courses', course.id), { slots: updatedSlots })
            } catch (error) { alert(error) }
        },
        async togglePaymentStatus(course, slot, person) {
            try {
                const updatedSlots = course.slots.map((s) => {
                    if (s.id === slot.id) {
                        const updatedAttendees = s.attendees.map((a) => {
                            if ((a.email || a) === person.email) {
                                return { ...a, isPaid: !a.isPaid }
                            }
                            return a
                        })
                        return { ...s, attendees: updatedAttendees }
                    }
                    return s
                })
                await updateDoc(doc(db, 'courses', course.id), { slots: updatedSlots })
            } catch (error) { alert(error) }
        },
        async endSession(course) {
            const input = prompt('Type "terminate":')
            if (input === 'terminate') await updateDoc(doc(db, 'courses', course.id), { isTerminated: true })
        },
        async handleBooking(course, slot) {
            if (!this.user) { alert('Please login first'); return }
            if (!confirm('Join this class?')) return
            try {
                const courseRef = doc(db, 'courses', course.id)
                await runTransaction(db, async (transaction) => {
                    const sfDoc = await transaction.get(courseRef); const currentData = sfDoc.data()
                    const slotIdx = currentData.slots.findIndex((s) => s.id === slot.id)
                    const targetSlot = currentData.slots[slotIdx]
                    const userProfile = { 
                        email: this.user.email, 
                        displayName: this.user.displayName, 
                        photoURL: this.user.photoURL,
                        isPaid: false // Default to unpaid
                    }
                    if (targetSlot.attendees.some(a => (a.email || a) === userProfile.email)) throw 'Already registered.'
                    const updatedSlots = [...currentData.slots]
                    if (targetSlot.attendees.length < targetSlot.capacity) updatedSlots[slotIdx].attendees.push(userProfile)
                    else updatedSlots[slotIdx].waitlist.push(userProfile)
                    transaction.update(courseRef, { slots: updatedSlots })
                })
                alert('Success!')
            } catch (error) { alert(error.code === 'permission-denied' ? 'Not open yet' : error) }
        },
        async handleCancel(courseId, slot) {
            if (!confirm('Cancel booking?')) return
            try {
                await runTransaction(db, async (transaction) => {
                    const sfDoc = await transaction.get(doc(db, 'courses', courseId)); const currentData = sfDoc.data()
                    const slotIdx = currentData.slots.findIndex((s) => s.id === slot.id)
                    const targetSlot = currentData.slots[slotIdx]; const updatedSlots = [...currentData.slots]
                    const isAttendee = targetSlot.attendees.some(a => (a.email || a) === this.user.email)
                    if (isAttendee) {
                        updatedSlots[slotIdx].attendees = targetSlot.attendees.filter(a => (a.email || a) !== this.user.email)
                        if (targetSlot.waitlist.length > 0) updatedSlots[slotIdx].attendees.push(updatedSlots[slotIdx].waitlist.shift())
                    } else {
                        updatedSlots[slotIdx].waitlist = targetSlot.waitlist.filter(a => (a.email || a) !== this.user.email)
                    }
                    transaction.update(doc(db, 'courses', courseId), { slots: updatedSlots })
                })
                alert('Cancelled')
            } catch (error) { alert(error) }
        }
    }
}
</script>

<style scoped>
.course-card { padding: 2rem; }
.reg-status { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
.reg-status.upcoming { background: rgba(255, 183, 77, 0.2); color: var(--warning); }
.reg-status.open { background: rgba(0, 230, 118, 0.2); color: var(--success); }
.reg-status.closed { background: rgba(255, 82, 82, 0.2); color: var(--error); }
.status-badge { padding: 8px 16px; border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.status-badge.success { color: var(--success); background: rgba(0, 230, 118, 0.1); }
.status-badge.warning { color: var(--warning); background: rgba(255, 183, 77, 0.1); }
.btn-disabled { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); cursor: not-allowed; }

/* Attendee List Styles */
.person-tag {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid var(--glass-border);
}
.avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
.name { font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }

.person-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
}
.queue-num { font-size: 0.75rem; color: var(--warning); font-weight: 700; width: 25px; }
.avatar-sm { width: 20px; height: 20px; border-radius: 50%; }
.name-sm { font-size: 0.85rem; color: var(--text-muted); }

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; max-height: 500px; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; overflow: hidden; }

.text-success { color: var(--success); }
.text-warning { color: var(--warning); }

.paid-toggle {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    margin-left: 4px;
    transition: all 0.3s ease;
    font-size: 0.8rem;
}
.paid-toggle:hover { color: var(--primary); }
.paid-toggle.active { color: var(--success); }

.person-tag.is-paid {
    border-color: rgba(0, 230, 118, 0.3);
    background: rgba(0, 230, 118, 0.05);
}
</style>
