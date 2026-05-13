import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AdminView from '../views/AdminView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'home', component: HomeView },
        { path: '/admin', name: 'admin', component: AdminView },
        {
            path: '/admin/new',
            name: 'admin-new',
            component: () => import('../views/AdminFormView.vue'),
        },
        {
            path: '/admin/:id',
            name: 'admin-session',
            component: () => import('../views/AdminSessionView.vue'),
        },
    ],
})

export default router
