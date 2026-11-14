<script setup lang="ts">import { onMounted, ref } from 'vue'
import { claimTask, getPool } from '@/api/apis'
import {type Task} from '@/types/type'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
const auth=useAuthStore();
const toast=useToastStore();
const pool=ref<Task[]>([]);
const poolError=ref<boolean>(false)
const claiming=ref<number|null>(null)
onMounted(async()=>{
  try{
    pool.value=await getPool()
  }catch(e:any){
    toast.show('获取公海池失败')
    poolError.value=true;
  }
})
async function claim(task:Task){
  try{
  claiming.value=task.id;
  const updated=await claimTask(task.id);
  pool.value=pool.value.filter(t=>t.id!==task.id);
  claiming.value=null;
  alert(`${updated.taskNo} 已进入你的跟进列表`)
  }catch(e:any){
      toast.show('领取失败')
  }finally{
      claiming.value=null;
  }
}
</script>
<template>
<div class="flex flex-col gap-[25px]">
  <div class="flex items-end justify-between gap-5 max-[780px]:flex-col max-[780px]:items-start">
    <div>
      <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> PUBLIC POOL / OPEN WORK</p>
      <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] max-[780px]:text-[25px]"> 公海池</h2>
      <p class="text-xs leading-[1.65] text-muted"> 没有绑定跟进人的事务会在这里等待认领。领取后，它会成为你的责任。</p>
    </div>
    <div class="text-right">
      <strong class="block text-[28px] leading-none text-green-dark">{{pool.length}}</strong><span class="text-[10px] text-muted">项待领取</span>
    </div>
  </div>
  <div class="grid grid-cols-3 gap-[15px] max-[1050px]:grid-cols-2 max-[780px]:grid-cols-1">
    <article v-for="task in pool" :key="task.id" class="flex min-h-[245px] flex-col border border-line bg-white p-5 shadow-[0_18px_40px_rgba(32,59,47,.06)]">
    <div class="flex items-center justify-between">
      <span class="rounded-[3px] bg-[#f2f4f3] px-2 py-[5px] text-[10px] text-[#7c8984]" :class="{'bg-[#fff0ef] text-[#bf6560]':task.priority==='高','bg-[#fff7e9] text-[#ad7d32]':task.priority==='中','bg-[#eef8f3] text-[#308c69]':task.priority==='低'}">{{task.priority}}优先</span><code class="font-mono text-[10px] text-[#708078]">{{task.taskNo}}</code>
    </div>
    <h3 class="my-5 mb-2 text-[15px] leading-[1.5]"> {{task.title}}</h3>
    <p class="m-0 text-[11px] leading-[1.7] text-[#82908a]"> {{task.description}}</p>
    <div class="mt-auto flex justify-between border-t border-line py-[13px] text-[10px] text-[#9ba6a1]">
      <span>{{task.department}}</span><span>创建于 {{new Date(task.createdAt).toLocaleDateString('zh-CN')}}</span>
    </div>
    <button
      v-if="['siteEmployees','siteOfficer'].includes(auth.user?.role || '')"
      class="inline-flex h-9 w-full items-center justify-center gap-[14px] rounded bg-ink px-[17px] text-[11px] font-bold text-[#dcffed] shadow-[0_8px_14px_rgba(31,42,40,.12)] transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-55"
      :disabled="claiming===task.id"
    @click="claim(task)">
      <span>{{claiming===task.id?'领取中…':'领取这项事务'}}</span><span>↗</span>
    </button>
    </article>
    <div
      v-if="!pool.length && !poolError"
    class="col-span-full border border-dashed border-[#cbd9d2] px-5 py-[70px] text-center text-[#86938d]">
      <strong class="block">公海池目前为空</strong>
      <span class="mt-[7px] block text-[11px]">新的待分配事务会出现在这里。</span>
    </div>
    <div
      v-if="poolError"
    class="col-span-full border border-dashed border-[#f2f4f3] px-5 py-[70px] text-center text-[#bf6560]">
      <strong class="block">获取公海池失败</strong>
      <span class="mt-[7px] block text-[11px]">请稍后重试。</span>
    </div>
  </div>
</div>
</template>
