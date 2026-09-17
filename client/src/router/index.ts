import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/random',
    name: 'random-list',
    component: () => import('@/views/RandomListView.vue'),
  },
  {
    path: '/saved',
    name: 'saved-list',
    component: () => import('@/views/SavedListView.vue'),
  },
  {
    path: '/profile/:uuid',
    name: 'profile-detail',
    component: () => import('@/views/ProfileDetailView.vue'),
  },
]

// In-memory history (not the URL bar): a full page reload always resets the SPA to
// Screen 0 (product spec #4), and Screen 3 is never directly navigable via URL (#5).
export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
