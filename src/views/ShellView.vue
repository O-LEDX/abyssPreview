<script setup lang="ts">import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import Logo from '@/assets/logo.png'
import defaultAvatarUrl from '@/assets/manbo.png'
import { useAvatarUrlStore } from '@/stores/avatarUrl'

const avatarUrlStore = useAvatarUrlStore()
const avatarUrl = computed(() => avatarUrlStore.avatarUrl)
const auth = useAuthStore();
const route = useRoute()
const toastStore = useToastStore()
const showSearch = ref(false)
const searchTapCount = ref(0)
const nav = computed(() => [
    {
      label:'委托情况总览',
      path:'/overview',
      icon:'iconfont icon-tasks-general',
      roles:[
        'AbyssZero',
        'superAdministrator',
        'siteOfficer',
        'siteEmployees'
      ]
    },
    {
      label:'事务列表',
      path:'/tasks',
      icon:'iconfont icon-table',
      roles:[
        'AbyssZero',
        'superAdministrator',
        'siteOfficer',
        'siteEmployees'
      ],
      children:[
        {label:'详细事务列表',path:'/tasks'},
        {label:'事务统计数据',path:'/tasks/stats'}
      ]
    },
    {
      label:'事务添加',
      path:'/tasks/add',
      icon:'iconfont icon-tasks-plus',
      roles:['AbyssZero','superAdministrator']
    },
    {
      label:'事务管理',
      path:'/tasks/manage',
      icon:'iconfont icon-tasks-control',
      roles:['AbyssZero','superAdministrator','siteOfficer']
    },
    {
      label:'公海池',
      path:'/pool',
      icon:'iconfont icon-pool',
      roles:[
        'AbyssZero',
        'superAdministrator',
        'siteOfficer',
        'siteEmployees'
      ]
    },
    {
      label:'人员管理',
      path:'/people',
      icon:'iconfont icon-team',
      roles:['AbyssZero','superAdministrator','siteOfficer']
    },
    {
      label:'个人资料',
      path:'/personalView',
      icon:'iconfont icon-team',
      roles:['AbyssZero','superAdministrator','siteOfficer','siteEmployees']
    },
    {
      label:'公告通知',
      path:'/announcements',
      icon:'iconfont icon-bell',
      roles:[
        'AbyssZero',
        'superAdministrator',
        'siteOfficer',
        'siteEmployees'
      ]
    },
    {
      label:'接口管理',
      path:'/api',
      icon:'iconfont icon-api',
      roles:['AbyssZero','superAdministrator']
    },
  ].filter(item => auth.user && item.roles.includes(auth.user.role)))
const roleLabel = computed(() => ({
      AbyssZero:'全域指挥',
      superAdministrator:'超级管理员',
      siteOfficer:'部长',
      siteEmployees:'雇员'
    } as Record<string, string>)[auth.user?.role || ''] || '成员')

async function logout() {
  await auth.signOut();
  toastStore.show('已退出登录',2000);
}

function openShowSearch() {
  showSearch.value = true
}
function closeShowSearch() {
  searchTapCount.value++;
  if (searchTapCount.value % 2 === 0) {
    showSearch.value = false
    searchTapCount.value = 0
  }
}

//判断是否激活（激活条件：当前路径是该父项/父项某个子路径）
function isActive(item: typeof nav.value[number]) {
  // 精确匹配父路径本身
  if (route.path === item.path) return true
  // 当前路径是该父项的某个子路径，返回true，父项也激活激活样式
  if (item.children) {
    return item.children.some(child => child.path === route.path)
  }
  return false
}
  
</script>
<template>
<div class="flex min-h-screen bg-[#f7f9f7] text-ink">

  <!-- 侧方bar -->
  <aside class="flex w-[260px] shrink-0 flex-col border-r border-line bg-white px-[18px] py-[27px] pb-5 max-[1050px]:w-[220px] max-[780px]:w-16 max-[780px]:px-2 max-[780px]:py-5">
    <div class="flex items-center gap-[11px] px-3 pb-[24px] max-[780px]:px-[9px] max-[780px]:pb-[25px]">
    <div class="h-[42px] w-[96px] place-items-center text-[26px] font-extrabold text-[#d3ffe9]">
      <img :src="Logo" alt="LEDX" class="h-full w-full object-cover">
    </div>
      <div class="text-[13px] font-extrabold leading-[1.1] tracking-[1.4px] max-[780px]:hidden">
        ABYSS<span class="mt-1 block text-[9px] tracking-[2px] text-[#9aa7a1]">SYSTEM</span>
      </div>
    </div>
    <div class="px-3 pb-[13px] text-[12px] font-bold tracking-[1.6px] text-[#95a19d] max-[780px]:hidden">
      WORKSPACE / 内部工作台
    </div>
    <nav class="flex flex-col gap-[3px]">
      <template v-for="item in nav" :key="item.path">
        <RouterLink 
          :to="item.path" 
          class="relative flex h-[43px] items-center gap-3 rounded-md px-[13px] text-[13px] text-[#74817c] transition-colors hover:bg-green-soft hover:font-bold hover:text-green-dark max-[780px]:justify-center max-[780px]:px-0" 
          :class="{ 'bg-green-soft font-bold text-green-dark':route.path === item.path || isActive(item) }">
            <span class="w-[18px] text-center text-[18px] font-normal"><div :class="item.icon"></div></span>
            <span class="max-[780px]:hidden">{{ item.label }}</span>
            <span v-if="item.path === '/overview'" class="absolute right-0 h-[17px] w-[3px] rounded-full bg-green max-[780px]:right-[2px]"></span>
        </RouterLink>
        <div
          v-if="item.children"
        class="ml-[42px] flex flex-col gap-px border-l border-line pl-[13px] max-[780px]:hidden">
          <RouterLink v-for="child in item.children" :key="child.path" :to="child.path" class="py-2 text-[12px] text-[#9aa7a1] hover:font-bold hover:text-green-dark" :class="{ 'font-bold text-green-dark':route.path === child.path }">{{ child.label }}</RouterLink>
        </div>
      </template>
    </nav>
    <div class="mt-auto border-t border-line px-3 pt-[17px] max-[780px]:hidden">
      <div class="mb-[22px] flex items-center gap-[9px]">
        <span class="inline-block h-[7px] w-[7px] rounded-full bg-green shadow-[0_0_0_4px_#e6f8ef]"></span>
        <div>
          <strong class="block text-[11px]">系统在线</strong> 
        </div>
      </div>
      <div class="text-[9px] tracking-[1.2px] text-[#a9b2ae]">
        ABYSS SYSTEM <span class="float-right text-[#ccd3d0]">v1.0.0</span>
      </div>
    </div>
  </aside>

  <!-- routerView+顶部bar -->
  <div class="min-w-0 flex-1">

    <!-- 顶部bar -->
    <header class="flex h-[92px] items-center justify-between border-b border-line bg-white/80 px-[45px] max-[1050px]:px-7 max-[780px]:h-[74px] max-[780px]:px-[18px]">
      <div>
        <p class="hidden text-[10px] font-bold tracking-[1.6px] text-[#95a19d] max-[780px]:block">
          {{ route.meta.title || '工作台' }}
        </p>
        <h1 class="m-0 text-[20px] tracking-[-0.3px] max-[780px]:text-[17px]">
          {{ route.meta.title || '委托情况总览' }}
        </h1>
      </div>
      <div class="flex items-center gap-[17px] max-[780px]:gap-2">
        <button class="relative border-0 bg-transparent p-1.5 text-[#82908a]" title="搜索">
          <div v-show="showSearch"><input class="border-gray border-2 rounded-xl w-200 px-[10px] h-10 text-sm" type="text" placeholder="搜索..." @click="closeShowSearch"></div>
          <div v-show="!showSearch"><div class="iconfont icon-search" style="font-size: 1.5rem;" @click="openShowSearch"></div></div>
        </button>
        <RouterLink to="/announcements" class="relative border-0 bg-transparent p-1.5 text-xl text-[#82908a] transition-colors hover:text-green-dark" title="公告通知">
          <div class="iconfont icon-bell" style="font-size: 1.5rem;"></div>
        </RouterLink>
        <div class="flex items-center gap-[9px] border-l border-line pl-[18px] max-[780px]:pl-2">
          <img :src="avatarUrl || defaultAvatarUrl" alt="avatar" class="h-[33px] w-[33px] rounded-full">
          <div class="max-[780px]:hidden">
            <strong class="block text-xs">{{ auth.user?.displayName }}</strong><span class="mt-0.5 block text-[10px] text-[#95a19d]">{{ roleLabel }}</span>
          </div>
          <button
            class="border-0 bg-transparent text-base text-[#9aa7a1] max-[780px]:hidden"
            title="退出登录"
          @click="logout">
            <div class="iconfont icon-logout" style="font-size: 1.5rem;"></div>
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1500px] px-[18px] py-[25px] pb-[50px] min-[781px]:px-[45px] min-[781px]:py-[39px] min-[781px]:pb-[70px]">
      <RouterView />
    </main>

  </div>
</div>
</template>
