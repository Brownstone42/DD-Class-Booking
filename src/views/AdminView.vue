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
            <p class="text-muted mt-3">Sorry, only authorized coaches can access this page.</p>
            <router-link
                to="/"
                class="inline-flex items-center gap-2 mt-8 border border-white/10 text-white px-6 py-3 rounded-xl hover:bg-white/5 transition-colors"
            >Go Back Home</router-link>
        </div>

        <div v-else>
            <header class="mb-8 flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-bold">Coach Dashboard</h1>
                    <p class="text-muted mt-1">Welcome back, {{ user.displayName }}</p>
                </div>
                <router-link
                    to="/admin/new"
                    class="inline-flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(192,255,0,0.3)] transition-all"
                >
                    <i class="fas fa-plus"></i> New Session
                </router-link>
            </header>

            <div v-if="loading" class="text-center py-12 text-muted">
                <div class="w-6 h-6 rounded-full border-2 border-white/10 border-t-primary animate-spin mx-auto mb-4"></div>
                Loading sessions...
            </div>

            <div
                v-else-if="sessions.length === 0"
                class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center text-muted"
            >
                No sessions yet. Create one to get started.
            </div>

            <div v-else class="grid gap-4">
                <div
                    v-for="session in sessions"
                    :key="session.id"
                    @click="$router.push('/admin/' + session.id)"
                    class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/20 hover:bg-white/[0.07] transition-all"
                >
                    <div class="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h3 class="text-lg font-bold">{{ session.title }}</h3>
                            <p class="text-muted text-sm mt-1">
                                {{ formatDate(session.date) }} &middot; {{ session.startTime }}–{{ session.endTime }}
                            </p>
                        </div>
                        <span
                            v-if="session.isTerminated"
                            class="text-xs font-semibold px-2.5 py-1 rounded-full bg-error/10 text-error border border-error/20"
                        >Terminated</span>
                        <span
                            v-else
                            class="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20"
                        >Tier {{ session.activeTier }} Open</span>
                    </div>
                    <p class="text-sm text-muted mt-3">
                        {{ confirmedCount(session) }} confirmed &middot;
                        {{ waitlistCount(session) }} waitlisted
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

export default {
    name: 'AdminView',
    data() {
        return {
            user: null,
            authChecked: false,
            loading: true,
            adminEmails: ['anawatbooch@gmail.com', 'wow0873233650@gmail.com'],
            sessions: [],
        }
    },
    computed: {
        isAdmin() {
            return this.user && this.adminEmails.includes(this.user.email)
        },
    },
    created() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.user = user
            this.authChecked = true
            if (user && this.adminEmails.includes(user.email)) {
                this.subscribeSessions()
            } else {
                this.loading = false
            }
        })
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
        this.unsubscribeSessions?.()
    },
    methods: {
        subscribeSessions() {
            const q = query(collection(db, 'sessions'), orderBy('date', 'desc'))
            this.unsubscribeSessions = onSnapshot(q, (snap) => {
                this.sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
                this.loading = false
            })
        },
        formatDate(dateStr) {
            if (!dateStr) return ''
            const [y, m, d] = dateStr.split('-')
            return `${d}/${m}/${y}`
        },
        confirmedCount(session) {
            return (session.bookings || []).filter((b) => b.status === 'confirmed').length
        },
        waitlistCount(session) {
            return (session.bookings || []).filter((b) => b.status === 'waitlisted').length
        },
    },
}
</script>
