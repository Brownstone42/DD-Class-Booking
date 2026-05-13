<template>
    <div class="fade-in">
        <!-- Hero -->
        <header class="mb-8 text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-2">Tennis Class Booking</h1>
            <p class="text-muted">Select your session and join the game.</p>
        </header>

        <!-- My Active Bookings -->
        <section v-if="user && myBookings.length > 0" class="mb-12">
            <div
                class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 border-l-4 border-l-primary"
            >
                <h3 class="font-bold text-lg mb-4">
                    <i class="fas fa-calendar-check mr-2"></i> My Active Bookings
                </h3>
                <div class="grid gap-3">
                    <div
                        v-for="item in myBookings"
                        :key="item.slot.id"
                        class="flex justify-between items-center bg-white/5 px-4 py-3 rounded-xl"
                    >
                        <div>
                            <div class="font-bold">{{ item.courseTitle }}</div>
                            <div class="text-sm text-muted mt-0.5">
                                {{ formatDate(item.courseDate) }} | {{ item.slot.startTime }} –
                                {{ item.slot.endTime }}
                            </div>
                            <div
                                class="text-xs font-semibold mt-1"
                                :class="
                                    item.type === 'attendee' ? 'text-success' : 'text-warning'
                                "
                            >
                                {{
                                    item.type === 'attendee'
                                        ? '● Confirmed'
                                        : '● Waitlisted #' + item.queuePos
                                }}
                            </div>
                        </div>
                        <button
                            @click="handleCancel(item.courseId, item.slot)"
                            class="text-sm px-4 py-2 rounded-xl border border-error text-error bg-transparent hover:bg-error/10 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Loading -->
        <div
            v-if="loading"
            class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
        >
            <div
                class="w-6 h-6 rounded-full border-2 border-white/10 border-t-primary animate-spin mx-auto"
            ></div>
            <p class="mt-4 text-muted">Loading sessions...</p>
        </div>

        <!-- Empty state -->
        <div
            v-else-if="sortedCourses.length === 0"
            class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center"
        >
            <i class="fas fa-calendar-times block text-5xl text-muted mb-4"></i>
            <p class="text-muted text-lg">No active sessions available at the moment.</p>
            <p class="text-muted text-sm mt-2">Please check back later or contact the coach.</p>
        </div>

        <!-- Course list -->
        <div v-else class="grid gap-8">
            <div
                v-for="course in sortedCourses"
                :key="course.id"
                class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8"
            >
                <!-- Course header -->
                <div class="mb-6">
                    <div class="flex justify-between items-start gap-4">
                        <div>
                            <h2 class="text-2xl font-bold text-primary">{{ course.title }}</h2>
                            <div class="flex items-center gap-3 flex-wrap mt-2">
                                <p class="text-lg font-semibold">
                                    <i class="far fa-calendar-alt mr-1"></i>
                                    {{ formatDate(course.date) }}
                                </p>
                                <span
                                    v-if="
                                        isRegistrationClosed(course) && !allSlotsClosed(course)
                                    "
                                    class="text-sm text-warning bg-warning/10 px-2 py-0.5 rounded"
                                >
                                    <i class="far fa-clock mr-1"></i> Estimate Open:
                                    {{ estimateOpenTime(course.registrationOpenAt) }}
                                </span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <button
                                v-if="isAdmin"
                                @click="editSession(course.id)"
                                class="inline-flex items-center gap-1 border border-primary text-primary text-xs px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer bg-transparent"
                            >
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <span
                                :class="[
                                    'px-3 py-0.5 rounded-full text-xs font-bold',
                                    getRegistrationStatus(course).class === 'upcoming'
                                        ? 'bg-warning/20 text-warning'
                                        : getRegistrationStatus(course).class === 'open'
                                          ? 'bg-success/20 text-success'
                                          : 'bg-error/20 text-error',
                                ]"
                            >
                                {{ getRegistrationStatus(course).label }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Slots -->
                <div class="grid gap-3">
                    <div v-for="slot in course.slots" :key="slot.id">
                        <div
                            class="bg-white/[0.03] p-5 rounded-xl border border-white/10 transition-all"
                        >
                            <div
                                class="flex justify-between items-center flex-wrap gap-4"
                            >
                                <!-- Slot info -->
                                <div class="min-w-0">
                                    <div class="text-xl font-bold">
                                        {{ slot.startTime }} – {{ slot.endTime }}
                                    </div>
                                    <div class="text-primary font-semibold mt-0.5">
                                        {{ slot.price }} THB
                                    </div>

                                    <!-- Clickable capacity row -->
                                    <div
                                        @click="toggleExpand(slot.id)"
                                        class="cursor-pointer mt-1.5"
                                    >
                                        <div
                                            class="flex items-center gap-1.5 text-sm text-muted"
                                        >
                                            <span
                                                >Capacity:
                                                {{ slot.attendees.length }}/{{
                                                    slot.capacity
                                                }}</span
                                            >
                                            <i
                                                class="fas text-[0.7rem]"
                                                :class="
                                                    isExpanded(slot.id)
                                                        ? 'fa-chevron-up'
                                                        : 'fa-chevron-down'
                                                "
                                            ></i>
                                        </div>
                                        <div class="text-sm text-muted font-medium mt-0.5">
                                            Waitlist: {{ slot.waitlist.length }}
                                        </div>
                                    </div>

                                    <span
                                        v-if="slot.group"
                                        class="inline-block mt-1.5 text-[0.7rem] bg-white/10 px-1.5 py-0.5 rounded"
                                        >Group: {{ slot.group }}</span
                                    >
                                </div>

                                <!-- Actions -->
                                <div class="flex gap-2 flex-wrap">
                                    <!-- Admin: start/stop toggle -->
                                    <div
                                        v-if="isAdmin"
                                        class="flex-none w-24 flex items-center justify-center"
                                    >
                                        <button
                                            v-if="slot.isActive"
                                            @click="toggleSlotStatus(course, slot)"
                                            class="w-full py-2 text-sm font-semibold rounded-xl border border-error text-error bg-transparent hover:bg-error/10 transition-colors cursor-pointer"
                                        >
                                            <i class="fas fa-hand-paper mr-1"></i> Stop
                                        </button>
                                        <button
                                            v-else
                                            @click="toggleSlotStatus(course, slot)"
                                            class="w-full py-2 text-sm font-semibold rounded-xl bg-primary text-black hover:shadow-[0_4px_15px_rgba(192,255,0,0.3)] transition-all cursor-pointer border-none"
                                        >
                                            <i class="fas fa-play mr-1"></i> Start
                                        </button>
                                    </div>

                                    <!-- User: booking status / join button -->
                                    <div class="flex-1 min-w-36">
                                        <div
                                            v-if="isUserInSlot(slot)"
                                            class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success font-bold h-full text-sm"
                                        >
                                            <i class="fas fa-check-circle"></i> Enrolled
                                        </div>
                                        <div
                                            v-else-if="isUserInWaitlist(slot)"
                                            class="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-warning/10 text-warning font-bold h-full text-sm"
                                        >
                                            <i class="fas fa-clock"></i> Waitlisted
                                        </div>
                                        <button
                                            v-else
                                            @click="handleBooking(course, slot)"
                                            :class="[
                                                'w-full py-2 px-4 text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-all border-none',
                                                isButtonDisabled(course, slot)
                                                    ? 'bg-white/5 text-muted cursor-not-allowed'
                                                    : 'bg-primary text-black cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(192,255,0,0.3)]',
                                            ]"
                                            :disabled="isButtonDisabled(course, slot)"
                                        >
                                            <span v-if="!user">Login</span>
                                            <span v-else-if="!slot.isActive">Closed</span>
                                            <span v-else-if="isConflicting(course, slot)"
                                                >Conflict</span
                                            >
                                            <span v-else-if="isRegistrationClosed(course)"
                                                >Upcoming</span
                                            >
                                            <span v-else>Join</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Expandable attendee / waitlist list -->
                            <transition name="slide">
                                <div
                                    v-if="isExpanded(slot.id)"
                                    class="mt-6 pt-4 border-t border-white/10"
                                >
                                    <div
                                        v-if="
                                            slot.attendees.length === 0 &&
                                            slot.waitlist.length === 0
                                        "
                                        class="text-center text-muted text-sm py-4"
                                    >
                                        No one has joined yet.
                                    </div>

                                    <!-- Confirmed attendees -->
                                    <div v-if="slot.attendees.length > 0" class="mb-4">
                                        <h4
                                            class="text-xs text-success uppercase tracking-widest font-semibold mb-3"
                                        >
                                            Confirmed Attendees
                                        </h4>
                                        <div
                                            class="grid gap-2"
                                            style="
                                                grid-template-columns: repeat(
                                                    auto-fill,
                                                    minmax(140px, 1fr)
                                                );
                                            "
                                        >
                                            <div
                                                v-for="person in slot.attendees"
                                                :key="person.email"
                                                :class="[
                                                    'flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border transition-colors',
                                                    person.isPaid
                                                        ? 'border-success/30 bg-success/5'
                                                        : 'border-white/10',
                                                ]"
                                            >
                                                <img
                                                    :src="
                                                        person.photoURL ||
                                                        'https://ui-avatars.com/api/?name=' +
                                                            person.displayName
                                                    "
                                                    class="w-6 h-6 rounded-full object-cover shrink-0"
                                                />
                                                <span
                                                    class="text-sm truncate max-w-[90px] min-w-0"
                                                    >{{
                                                        person.displayName ||
                                                        person.email.split('@')[0]
                                                    }}</span
                                                >
                                                <button
                                                    v-if="isAdmin"
                                                    @click.stop="
                                                        togglePaymentStatus(
                                                            course,
                                                            slot,
                                                            person,
                                                        )
                                                    "
                                                    :class="[
                                                        'bg-transparent border-none p-0.5 cursor-pointer transition-colors text-xs shrink-0',
                                                        person.isPaid
                                                            ? 'text-success'
                                                            : 'text-muted hover:text-primary',
                                                    ]"
                                                    title="Toggle payment"
                                                >
                                                    <i class="fas fa-money-bill-wave"></i>
                                                </button>
                                                <i
                                                    v-else-if="person.isPaid"
                                                    class="fas fa-check-circle text-success text-xs shrink-0"
                                                ></i>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Waitlist -->
                                    <div v-if="slot.waitlist.length > 0">
                                        <h4
                                            class="text-xs text-warning uppercase tracking-widest font-semibold mb-3"
                                        >
                                            Waitlist Queue
                                        </h4>
                                        <div class="grid gap-1.5">
                                            <div
                                                v-for="(person, idx) in slot.waitlist"
                                                :key="person.email"
                                                class="flex items-center gap-3 p-2 bg-white/[0.02] rounded-lg"
                                            >
                                                <span
                                                    class="text-xs text-warning font-bold w-6 shrink-0"
                                                    >#{{ idx + 1 }}</span
                                                >
                                                <img
                                                    :src="
                                                        person.photoURL ||
                                                        'https://ui-avatars.com/api/?name=' +
                                                            person.displayName
                                                    "
                                                    class="w-5 h-5 rounded-full shrink-0"
                                                />
                                                <span class="text-sm text-muted">{{
                                                    person.displayName ||
                                                    person.email.split('@')[0]
                                                }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>

                <!-- Admin: terminate session -->
                <div
                    v-if="isAdmin && allSlotsClosed(course)"
                    class="mt-4 pt-4 border-t border-dashed border-white/10"
                >
                    <button
                        @click="endSession(course)"
                        class="w-full py-3 border border-error text-error bg-transparent rounded-xl hover:bg-error/10 transition-colors cursor-pointer font-semibold"
                    >
                        <i class="fas fa-power-off mr-2"></i> Terminate Session
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
    collection,
    query,
    onSnapshot,
    doc,
    updateDoc,
    runTransaction,
    where,
} from 'firebase/firestore'

export default {
    name: 'HomeView',
    data() {
        return {
            user: null,
            loading: true,
            courses: [],
            expandedSlots: [],
        }
    },
    computed: {
        isAdmin() {
            const adminEmails = ['anawatbooch@gmail.com', 'wow0873233650@gmail.com']
            return this.user && adminEmails.includes(this.user.email)
        },
        sortedCourses() {
            return [...this.courses]
                .filter((c) => !c.isTerminated)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
        },
        myBookings() {
            if (!this.user) return []
            const bookings = []
            this.courses.forEach((course) => {
                if (course.isTerminated) return
                course.slots.forEach((slot) => {
                    const inAttendee = slot.attendees.some(
                        (a) => (a.email || a) === this.user.email,
                    )
                    const waitlistIdx = slot.waitlist.findIndex(
                        (a) => (a.email || a) === this.user.email,
                    )
                    if (inAttendee) {
                        bookings.push({
                            courseId: course.id,
                            courseTitle: course.title,
                            courseDate: course.date,
                            slot,
                            type: 'attendee',
                        })
                    } else if (waitlistIdx !== -1) {
                        bookings.push({
                            courseId: course.id,
                            courseTitle: course.title,
                            courseDate: course.date,
                            slot,
                            type: 'waitlist',
                            queuePos: waitlistIdx + 1,
                        })
                    }
                })
            })
            return bookings
        },
    },
    created() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.user = user
        })
        this.unsubscribeSnapshot = onSnapshot(
            query(collection(db, 'courses'), where('isTerminated', '==', false)),
            (snapshot) => {
                this.courses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                this.loading = false
            },
        )
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
        this.unsubscribeSnapshot?.()
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
            return `${String(hour).padStart(2, '0')}:00 – ${String(hour + 1).padStart(2, '0')}:00`
        },
        getRegistrationStatus(course) {
            if (this.allSlotsClosed(course)) return { label: 'Closed', class: 'closed' }
            const now = new Date()
            const openAt = course.registrationOpenAt.toDate()
            return now < openAt
                ? { label: 'Upcoming', class: 'upcoming' }
                : { label: 'Open', class: 'open' }
        },
        allSlotsClosed(course) {
            return course.slots.every((s) => !s.isActive)
        },
        isRegistrationClosed(course) {
            return new Date() < course.registrationOpenAt.toDate()
        },
        isUserInSlot(slot) {
            return this.user && slot.attendees.some((a) => (a.email || a) === this.user.email)
        },
        isUserInWaitlist(slot) {
            return this.user && slot.waitlist.some((a) => (a.email || a) === this.user.email)
        },
        isConflicting(course, slot) {
            if (!this.user || !slot.group) return false
            return course.slots.some(
                (s) => s.group === slot.group && s.id !== slot.id && this.isUserInSlot(s),
            )
        },
        isButtonDisabled(course, slot) {
            return (
                !slot.isActive || this.isRegistrationClosed(course) || this.isConflicting(course, slot)
            )
        },
        async toggleSlotStatus(course, slot) {
            try {
                const updatedSlots = course.slots.map((s) =>
                    s.id === slot.id ? { ...s, isActive: !s.isActive } : s,
                )
                await updateDoc(doc(db, 'courses', course.id), { slots: updatedSlots })
            } catch (error) {
                alert(error)
            }
        },
        async togglePaymentStatus(course, slot, person) {
            try {
                const updatedSlots = course.slots.map((s) => {
                    if (s.id === slot.id) {
                        const updatedAttendees = s.attendees.map((a) =>
                            (a.email || a) === person.email ? { ...a, isPaid: !a.isPaid } : a,
                        )
                        return { ...s, attendees: updatedAttendees }
                    }
                    return s
                })
                await updateDoc(doc(db, 'courses', course.id), { slots: updatedSlots })
            } catch (error) {
                alert(error)
            }
        },
        async endSession(course) {
            const input = prompt('Type "terminate":')
            if (input === 'terminate')
                await updateDoc(doc(db, 'courses', course.id), { isTerminated: true })
        },
        async handleBooking(course, slot) {
            if (!this.user) {
                alert('Please login first')
                return
            }
            if (!confirm('Join this class?')) return
            try {
                const courseRef = doc(db, 'courses', course.id)
                await runTransaction(db, async (transaction) => {
                    const sfDoc = await transaction.get(courseRef)
                    const currentData = sfDoc.data()
                    const slotIdx = currentData.slots.findIndex((s) => s.id === slot.id)
                    const targetSlot = currentData.slots[slotIdx]
                    const userProfile = {
                        email: this.user.email,
                        displayName: this.user.displayName,
                        photoURL: this.user.photoURL,
                        isPaid: false,
                    }
                    if (targetSlot.attendees.some((a) => (a.email || a) === userProfile.email))
                        throw 'Already registered.'
                    const updatedSlots = [...currentData.slots]
                    if (targetSlot.attendees.length < targetSlot.capacity)
                        updatedSlots[slotIdx].attendees.push(userProfile)
                    else updatedSlots[slotIdx].waitlist.push(userProfile)
                    transaction.update(courseRef, { slots: updatedSlots })
                })
                alert('Success!')
            } catch (error) {
                alert(error.code === 'permission-denied' ? 'Not open yet' : error)
            }
        },
        async handleCancel(courseId, slot) {
            if (!confirm('Cancel booking?')) return
            try {
                await runTransaction(db, async (transaction) => {
                    const sfDoc = await transaction.get(doc(db, 'courses', courseId))
                    const currentData = sfDoc.data()
                    const slotIdx = currentData.slots.findIndex((s) => s.id === slot.id)
                    const targetSlot = currentData.slots[slotIdx]
                    const updatedSlots = [...currentData.slots]
                    const isAttendee = targetSlot.attendees.some(
                        (a) => (a.email || a) === this.user.email,
                    )
                    if (isAttendee) {
                        updatedSlots[slotIdx].attendees = targetSlot.attendees.filter(
                            (a) => (a.email || a) !== this.user.email,
                        )
                        if (targetSlot.waitlist.length > 0)
                            updatedSlots[slotIdx].attendees.push(
                                updatedSlots[slotIdx].waitlist.shift(),
                            )
                    } else {
                        updatedSlots[slotIdx].waitlist = targetSlot.waitlist.filter(
                            (a) => (a.email || a) !== this.user.email,
                        )
                    }
                    transaction.update(doc(db, 'courses', courseId), { slots: updatedSlots })
                })
                alert('Cancelled')
            } catch (error) {
                alert(error)
            }
        },
    },
}
</script>

<style scoped>
/* Vue transition for expand/collapse attendee list */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
    max-height: 600px;
    overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
}
</style>
