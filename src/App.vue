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
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            this.user = user
            this.loading = false
        })
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
    <nav class="navbar">
        <div class="logo"><span style="color: var(--primary)">🎾</span> {{ appName }}</div>
        <div class="nav-links">
            <router-link to="/">Home</router-link>
            <router-link to="/admin">Admin</router-link>
        </div>
        <div class="auth-section">
            <div v-if="loading" class="loader-sm"></div>
            <button v-else-if="!user" @click="handleLogin" class="btn btn-primary">
                <i class="fab fa-google"></i> Login
            </button>
            <div v-else class="user-profile" style="display: flex; align-items: center; gap: 12px">
                <img
                    :src="user.photoURL"
                    :alt="user.displayName"
                    style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        border: 2px solid var(--primary);
                    "
                />
                <button
                    @click="handleLogout"
                    class="btn btn-outline"
                    style="padding: 0.5rem 0.8rem"
                >
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
    </nav>

    <main class="container fade-in" style="margin-bottom: 80px">
        <!-- Added margin for mobile nav -->
        <router-view />
    </main>

    <nav class="mobile-nav">
        <router-link to="/">
            <i class="fas fa-calendar-alt"></i>
            <span>Booking</span>
        </router-link>
        <router-link to="/admin">
            <i class="fas fa-user-shield"></i>
            <span>Admin</span>
        </router-link>
    </nav>
</template>

<style>
/* Global layout styles are in style.css */
</style>
