import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { validateToken, clearValidTokenCache } from '@/static/authValid'
const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue')
      },
      {
        path: '/',
        component: () => import('@/views/ShellView.vue'),
        children: [
          { path: '', redirect: '/overview' },
          {
            path: 'overview',
            component: () => import('@/views/OverviewView.vue'),
            meta: { title: '委托情况总览' }
          },
          {
            path: 'announcements',
            component: () => import('@/views/AnnouncementView.vue'),
            meta: { title: '公告通知' }
          },
          {
            path: 'tasks',
            component: () => import('@/views/TaskListView.vue'),
            meta: { title: '详细事务列表' }
          },
          {
            path: 'tasks/stats',
            component: () => import('@/views/TaskStatsView.vue'),
            meta: { title: '事务统计数据' }
          },
          {
            path: 'tasks/add',
            component: () => import('@/views/TaskAddView.vue'),
            meta: {
              title: '事务添加',
              roles: ['AbyssZero', 'superAdministrator']
            }
          },
          {
            path: 'tasks/manage',
            component: () => import('@/views/TaskManageView.vue'),
            meta: {
              title: '事务管理',
              roles: ['AbyssZero', 'superAdministrator', 'siteOfficer']
            }
          },
          {
            path: 'pool',
            component: () => import('@/views/PoolView.vue'),
            meta: { title: '公海池' }
          },
          {
            path: 'people',
            component: () => import('@/views/PeopleView.vue'),
            meta: {
              title: '人员管理',
              roles: ['AbyssZero', 'superAdministrator', 'siteOfficer']
            }
          },
          {
            path: 'personalView',
            component: () => import('@/views/PersonalView.vue'),
            meta: { title: '个人资料' }
          },
          {
            path: 'api',
            component: () => import('@/views/ApiView.vue'),
            meta: { title: '接口管理', roles: ['AbyssZero', 'superAdministrator'] }
          },
        ],
      },
    ],
  })
router.beforeEach(async (to) => {
    const auth = useAuthStore()
    const validResult = auth.token ? await validateToken () : false
    if(to.path !== '/login') {
      if(!validResult) {
        auth.token= ''
        auth.user = null
        clearValidTokenCache()
        localStorage.removeItem('abyss-session')
        return '/login' 
      }
    } else if (to.path === '/login' && auth.isLoggedIn && validResult) 
      return '/overview'

    const roles = to.meta.roles as string[] | undefined
    if (roles && auth.user && !roles.includes(auth.user.role)) return '/overview'
  })
export default router
