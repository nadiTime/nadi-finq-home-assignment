import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

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
    props: (route) => ({ uuid: route.params.uuid, source: route.query.source }),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
