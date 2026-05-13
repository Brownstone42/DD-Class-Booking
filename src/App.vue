<script>
import { auth, googleProvider } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'

export default {
    name: 'App',
    data() {
        return {
            appName: 'DD Tennis Booking',
            user: null,
            loading: true,
        }
    },
    created() {
        this.unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            this.user = user
            this.loading = false
        })
    },
    beforeUnmount() {
        this.unsubscribeAuth?.()
    },
    methods: {
        async handleLogin() {
            try {
                await signInWithPopup(auth, googleProvider)
            } catch (error) {
                console.error('Login failed:', error)
                alert('Login failed. Please try again.')
            }
        },
        async handleLogout() {
            try {
                await signOut(auth)
            } catch (error) {
                console.error('Logout failed:', error)
            }
        },
    },
}
</script>

<template>
    <!-- Top navbar -->
    <nav
        class="flex items-center justify-between sticky top-0 z-[100] px-4 py-4 md:px-8 bg-[#0a0a0c]/90 backdrop-blur-lg border-b border-white/10"
    >
        <div class="flex items-center gap-1.5 text-xl md:text-2xl font-bold text-primary">
            🎾 {{ appName }}
        </div>

        <div class="hidden md:flex gap-8">
            <router-link
                to="/"
                class="text-white/60 hover:text-primary transition-colors font-medium"
                >Home</router-link
            >
            <router-link
                to="/admin"
                class="text-white/60 hover:text-primary transition-colors font-medium"
                >Admin</router-link
            >
        </div>

        <div class="flex items-center gap-3">
            <div
                v-if="loading"
                class="w-5 h-5 rounded-full border-2 border-white/10 border-t-primary animate-spin"
            />
            <button
                v-else-if="!user"
                @click="handleLogin"
                class="inline-flex items-center gap-2 bg-primary text-black font-semibold px-4 py-2 rounded-xl text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(192,255,0,0.3)] transition-all cursor-pointer border-none"
            >
                <i class="fab fa-google"></i> Login
            </button>
            <div v-else class="flex items-center gap-3">
                <img
                    :src="user.photoURL"
                    :alt="user.displayName"
                    class="w-8 h-8 rounded-full border-2 border-primary"
                />
                <button
                    @click="handleLogout"
                    class="inline-flex items-center justify-center border border-white/10 bg-transparent text-white p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                >
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
    </nav>

    <!-- Page content -->
    <main class="w-full max-w-[1200px] mx-auto px-4 py-6 md:px-8 md:py-8 mb-24 fade-in">
        <router-view />
    </main>

    <!-- Mobile bottom nav -->
    <nav
        class="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-lg flex justify-around p-3 border-t border-white/10 z-[100]"
    >
        <router-link
            to="/"
            class="flex flex-col items-center gap-1 text-xs text-muted transition-colors [&.router-link-active]:text-primary"
        >
            <i class="fas fa-calendar-alt text-xl"></i>
            <span>Booking</span>
        </router-link>
        <router-link
            to="/admin"
            class="flex flex-col items-center gap-1 text-xs text-muted transition-colors [&.router-link-active]:text-primary"
        >
            <i class="fas fa-user-shield text-xl"></i>
            <span>Admin</span>
        </router-link>
    </nav>
</template>
