<script setup lang="ts">import { onMounted, ref } from 'vue'
import { getSummary, getTasks } from '@/api/apis'
import {type Task} from '@/types/type'
import { useAuthStore } from '@/stores/auth'
import PolarChart from '@/components/PolarChart.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
const auth = useAuthStore();
const error = ref<boolean>(false)
const summary = ref<any>({
    total:0,
    pending:0,
    inProgress:0,
    completed:0,
    failed:0,
    activeUsers:0,
    completionRate:0,
    trend:[]
  });

const polarData = ref<any[]>([])

const tasks = ref<Task[]>([])
const statusText = (status:string) => ({
    PENDING:'待领取',
    IN_PROGRESS:'跟进中',
    COMPLETED:'已完成',
    FAILED:'已失败'
  }
  [status] || status)

onMounted(async () => {
    try{
    summary.value = await getSummary(auth.headers(),30);
    tasks.value = await getTasks(auth.headers())

    polarData.value = [
      {label:'待领取',num:summary.value.pending},
      {label:'跟进中',num:summary.value.inProgress},
      {label:'已完成',num:summary.value.completed},
      {label:'已失败',num:summary.value.failed}
    ]
    }catch(e){
      error.value = true
    }
  })

</script>
<template>
<div class="flex flex-col gap-[25px]">
  <div class="flex items-end justify-between gap-5 max-[780px]:flex-col max-[780px]:items-start">
    <div>
      <p class="text-[15px] font-bold tracking-[1.6px] text-[#95a19d]">
        {{ new Date().toLocaleDateString() }}
      </p>
      <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] text-ink max-[780px]:text-[25px]">
        今天，保持推进。
      </h2>
      <p class="text-xs leading-[1.65] text-muted"> 这里汇总所有站点的委托流转、人员状态和风险信号。</p>
    </div>
    <RouterLink to="/tasks/add" class="inline-flex h-9 items-center justify-center gap-[14px] rounded bg-ink px-[17px] text-[11px] font-bold text-[#dcffed] shadow-[0_8px_14px_rgba(31,42,40,.12)] transition-colors hover:bg-green-dark" v-if="['AbyssZero','superAdministrator'].includes(auth.user?.role || '')"><span>创建新事务</span><span>＋</span></RouterLink>
  </div>
  <div class="grid grid-cols-4 gap-[13px] max-[1050px]:grid-cols-2 max-[480px]:grid-cols-1">
    <div class="min-h-[126px] border border-line bg-white p-[19px] pb-[18px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="text-[11px] font-bold text-[#82908a]">
        事务总量 <span class="float-right font-mono text-[10px] text-[#b9c5c0]">01</span>
      </div>
      <strong class="my-3 block text-[34px] leading-[1.25] tracking-[-1.5px]">{{ summary.total }}</strong><span class="text-[10px] text-[#38a97e]">本周期已同步</span>
    </div>
    <div class="min-h-[126px] border border-ink bg-ink p-[19px] pb-[18px] text-white shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="text-[11px] font-bold text-[#a6b7b0]">
        进行中 <span class="float-right font-mono text-[10px] text-[#b9c5c0]">02</span>
      </div>
      <strong class="my-3 block text-[34px] leading-[1.25] tracking-[-1.5px]">{{ summary.inProgress }}</strong><span class="text-[10px] text-[#b8cbc3]">需要持续跟进</span>
    </div>
    <div class="min-h-[126px] border border-line bg-white p-[19px] pb-[18px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="text-[11px] font-bold text-[#82908a]">
        完成率 <span class="float-right font-mono text-[10px] text-[#b9c5c0]">03</span>
      </div>
      <strong class="my-3 block text-[34px] leading-[1.25] tracking-[-1.5px]">{{ summary.completionRate }}<small class="text-[19px]">%</small></strong>
    </div>
    <div class="min-h-[126px] border border-line bg-white p-[19px] pb-[18px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="text-[11px] font-bold text-[#82908a]">
        活跃成员 <span class="float-right font-mono text-[10px] text-[#b9c5c0]">04</span>
      </div>
      <strong class="my-3 block text-[34px] leading-[1.25] tracking-[-1.5px]">{{ summary.activeUsers }}</strong><span class="text-[10px] text-[#9ca9a4]">覆盖 {{ summary.departmentTotal }} 个站点</span>
    </div>
  </div>
  <div class="grid grid-cols-[1.5fr_1fr] gap-[15px] max-[780px]:grid-cols-1">
    <section class="border border-line bg-white p-[22px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="flex items-start justify-between gap-[15px]">
        <div>
          <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> FLOW / 07 DAYS</p>
          <h3 class="mt-1.5 text-base tracking-[-0.3px]"> 委托流转统计</h3>
        </div>
        <span class="flex items-center gap-[7px] text-[10px] text-[#86928d]"><i class="h-[7px] w-[7px] rounded-sm bg-green"></i>新增事务</span>
      </div>
      <div v-if="error" class="text-[10px] text-danger">获取事务统计数据失败，请稍后重试</div>
      <PolarChart v-else-if="polarData?.length" :data="polarData" />
      <LoadingSpinner v-else />
    </section>
    <section class="border border-line bg-white p-[22px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="flex items-start justify-between gap-[15px]">
        <div>
          <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> DISTRIBUTION</p>
          <h3 class="mt-1.5 text-base tracking-[-0.3px]"> 事务状态分布</h3>
        </div>
        <RouterLink to="/tasks" class="text-[11px] font-bold text-green-dark">查看全部 ↗</RouterLink>
      </div>
      <div class="flex items-center gap-8 px-2.5 pb-[15px] pt-[27px] max-[780px]:gap-[19px]">
        <div class="relative grid h-[170px] w-[170px] shrink-0 place-items-center rounded-full bg-[conic-gradient(var(--color-green)_0_var(--done),#a8d9c2_var(--done)_calc(var(--done)_+_var(--progress)),#edf1ef_calc(var(--done)_+_var(--progress))_100%)] max-[780px]:h-[140px] max-[780px]:w-[140px] before:absolute before:inset-[17px] before:rounded-full before:bg-white">
          <div class="relative text-center">
            <strong class="block text-[30px] leading-none">{{ summary.total }}</strong><small class="mt-[5px] block text-[10px] text-muted">全部事务</small>
          </div>
        </div>
        <div class="flex flex-1 flex-col gap-[15px]">
          <div class="grid grid-cols-[12px_1fr_auto] items-center gap-[7px] text-[11px] text-[#718079]">
            <i class="h-[7px] w-[7px] rounded-full bg-[#d8dedb]"></i><span>待领取</span><strong class="text-sm text-ink">{{ summary.pending }}</strong>
          </div>
          <div class="grid grid-cols-[12px_1fr_auto] items-center gap-[7px] text-[11px] text-[#718079]">
            <i class="h-[7px] w-[7px] rounded-full bg-[#a8d9c2]"></i><span>跟进中</span><strong class="text-sm text-ink">{{ summary.inProgress }}</strong>
          </div>
          <div class="grid grid-cols-[12px_1fr_auto] items-center gap-[7px] text-[11px] text-[#718079]">
            <i class="h-[7px] w-[7px] rounded-full bg-green"></i><span>已完成</span><strong class="text-sm text-ink">{{ summary.completed }}</strong>
          </div>
          <div class="grid grid-cols-[12px_1fr_auto] items-center gap-[7px] text-[11px] text-[#718079]">
            <i class="h-[7px] w-[7px] rounded-full bg-danger"></i><span>已失败</span><strong class="text-sm text-ink">{{ summary.failed }}</strong>
          </div>
        </div>
      </div>
    </section>
  </div>
  <section class="border border-line bg-white p-[22px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
    <div class="mb-[18px] flex items-start justify-between gap-[15px]">
      <div>
        <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> LATEST ACTIVITY</p>
        <h3 class="mt-1.5 text-base tracking-[-0.3px]"> 最新事务动态</h3>
      </div>
      <RouterLink to="/tasks" class="text-[11px] font-bold text-green-dark">进入事务列表 ↗</RouterLink>
    </div>
    <div class="overflow-auto">
      <table class="min-w-[730px] w-full border-collapse text-left text-xs">
        <thead>
          <tr>
            <th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">事务 / 标题</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">站点</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">跟进人</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">状态</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks.slice(0,5)" :key="task.id">
            <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle last:border-b-0"><strong class="block text-xs">{{ task.taskNo }}</strong><span class="mt-[5px] block max-w-[260px] overflow-hidden text-ellipsis text-[10px] text-[#9aa7a1]">{{ task.title }}</span></td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">{{ task.department }}</td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle"><span v-if="task.assigneeAlias" class="inline-flex items-center gap-1.5 text-[11px] font-bold"><i class="grid h-[23px] w-[23px] place-items-center rounded-md bg-[#e5f5ec] text-[8px] not-italic text-green-dark">{{ task.assigneeAlias.slice(0,2) }}</i>{{ task.assigneeAlias }}</span><span v-else class="text-[11px] text-[#a2ada8]">公海池</span></td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle"><span class="inline-flex items-center gap-1.5 rounded-[3px] bg-[#f1f4f2] px-2 py-[5px] text-[10px] text-[#7f8c86]" :class="{'bg-[#eaf8f1] text-green-dark':task.status==='IN_PROGRESS','bg-[#eff8f4] text-[#278a63]':task.status==='COMPLETED','bg-[#fff0ef] text-[#ba5c58]':task.status==='FAILED'}"><i class="h-[5px] w-[5px] rounded-full bg-[#adb8b3]" :class="{'bg-green':task.status==='IN_PROGRESS','bg-[#45b98a]':task.status==='COMPLETED','bg-danger':task.status==='FAILED'}"></i>{{ statusText(task.status) }}</span></td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle text-xs text-muted">{{ new Date(task.createdAt).toLocaleDateString('zh-CN') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</div>
</template>
