<script setup lang="ts">import { onMounted, ref, computed, watch } from 'vue'
import { getSummary, getTasks } from '@/api/apis'
import {type Task} from '@/types/type'
import { useAuthStore } from '@/stores/auth'
import TrendChart from '@/components/TrendChart.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useToastStore } from '@/stores/toast'
const auth=useAuthStore();
const toast = useToastStore();
const summary=ref<any>({trend:[]});
const tasks=ref<Task[]>([])
const days=ref('7');
const error=ref(false)
const chartKey=ref(0)
let requestSeq=0

async function loadSummary(){
  const seq=++requestSeq
  error.value=false
  try {
    const data=await getSummary(auth.headers(),Number(days.value))
    if(seq!==requestSeq) return
    summary.value=data
    chartKey.value++
  } catch (e) {
    if(seq!==requestSeq) return
    error.value=true
    toast.show('获取事务统计数据失败')
  }
}
watch(days,loadSummary,{immediate:true})

// 站点分布与时间窗口无关，进入页面时拉取一次即可
onMounted(async()=>{
  try {
    tasks.value=await getTasks(auth.headers())
  } catch (e) {
    toast.show('获取事务列表失败')
  }
  })
const byDept = computed(() => {
    const counts: Record<string,number> = {};
    tasks.value.forEach((task) => {
        counts[task.department] = (counts[task.department] || 0) + 1
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  })
</script>
<template>
<div class="flex flex-col gap-[25px]">
  <div class="flex items-end justify-between gap-5 max-[780px]:flex-col max-[780px]:items-start">
    <div>
      <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> ANALYTICS / PERFORMANCE</p>
      <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] max-[780px]:text-[25px]"> 事务统计数据</h2>
      <p class="text-xs leading-[1.65] text-muted"> 从状态、站点与流转趋势观察团队负载。</p>
    </div>
  </div>
  <div class="grid grid-cols-4 gap-[13px] max-[1050px]:grid-cols-2 max-[480px]:grid-cols-1">
    <div class="min-h-28 border border-line bg-white p-[19px] pb-[18px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="text-[11px] font-bold text-[#82908a]"> 待领取</div>
      <strong class="my-3 block text-[34px] leading-[1.25] tracking-[-1.5px]">{{summary.pending}}</strong><span class="text-[10px] text-[#9ca9a4]">公海池待分配</span>
    </div>
    <div class="min-h-28 border border-line bg-white p-[19px] pb-[18px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="text-[11px] font-bold text-[#82908a]"> 跟进中</div>
      <strong class="my-3 block text-[34px] leading-[1.25] tracking-[-1.5px]">{{summary.inProgress}}</strong><span class="text-[10px] text-[#9ca9a4]">当前活跃负载</span>
    </div>
    <div class="min-h-28 border border-line bg-white p-[19px] pb-[18px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="text-[11px] font-bold text-[#82908a]"> 已完成</div>
      <strong class="my-3 block text-[34px] leading-[1.25] tracking-[-1.5px]">{{summary.completed}}</strong><span class="text-[10px] text-[#38a97e]">稳定推进</span>
    </div>
    <div class="min-h-28 border border-line bg-white p-[19px] pb-[18px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="text-[11px] font-bold text-[#82908a]"> 失败 / 风险</div>
      <strong class="my-3 block text-[34px] leading-[1.25] tracking-[-1.5px]">{{summary.failed}}</strong><span class="text-[10px] text-danger">需要复盘</span>
    </div>
  </div>
  <div class="grid grid-cols-[1.5fr_1fr] gap-[15px] max-[780px]:grid-cols-1">
    <section class="border border-line bg-white p-[22px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="flex items-center justify-between gap-[15px]">
        <div>
          <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> VOLUME / TREND</p>
          <h3 class="mt-1.5 text-base tracking-[-0.3px]"> 历史新增与完成趋势</h3>
        </div>
        <select v-model="days" class="border border-line bg-white px-[22px] py-2.5 text-[11px] text-[#6f7d77]">
          <option value="7">近 7 天</option>
          <option value="15">近 15 天</option>
          <option value="30">近 30 天</option>
        </select>
      </div>
      <div v-if="error">获取事务统计数据失败，请稍后重试</div>
      <TrendChart v-else-if="summary.trend?.length" :key="chartKey" :data="summary.trend" />
      <LoadingSpinner v-else />
    </section>
    <section class="border border-line bg-white p-[22px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="flex items-start justify-between gap-[15px]">
        <div>
          <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> BY SITE</p>
          <h3 class="mt-1.5 text-base tracking-[-0.3px]"> 站点事务分布</h3>
        </div>
      </div>
      <div class="mt-7 flex flex-col gap-5">
        <div v-for="([name,count], index) in byDept" :key="name">
          <div class="mb-[7px] flex justify-between text-[11px] text-[#718079]">
            <span>{{name}}</span><strong class="text-ink">{{count}}</strong>
          </div>
          <div class="h-1.5 bg-[#eef2ef]">
            <i class="block h-full rounded-sm bg-green" :style="{width:`${count / Math.max(tasks.length,1)*100}%`, opacity:1-index*.1}"></i>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>
</template>
