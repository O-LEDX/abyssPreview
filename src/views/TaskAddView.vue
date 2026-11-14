<script setup lang="ts">import { computed, onMounted, ref,watch } from 'vue'
import { useRouter } from 'vue-router'
import { createTask, getUsers, getDepartments } from '@/api/apis'
import {type User,type Department} from '@/types/type'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
const router=useRouter();
const auth=useAuthStore();
const toast=useToastStore();
const users=ref<User[]>([]);
const departments=ref<Department[]>([]);
const form=ref({
    title:'',
    description:'',
    priority:'中',
    department:'',
    dueAt:'',
    assignee:'pool'
  });
const saved=ref(false);
const error=ref('')
const assignableUsers = computed(() => users.value.filter(user => user.active && (user.role === 'siteEmployees' || user.role === 'siteOfficer') && (auth.user?.role !== 'siteOfficer' || user.department === auth.user?.department)))
onMounted(async()=>{
    try {
      const [loadedUsers,loadedDepts]=await Promise.all([getUsers(auth.headers()),getDepartments(auth.headers())])
      users.value=loadedUsers
      departments.value=loadedDepts
      if(!departments.value.some(d=>d.name===form.value.department)){
        form.value.department=departments.value.find(d=>d.name==='总部')?.name ?? departments.value[0]?.name ?? ''
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : '无法加载人员列表'
    }
  })
async function submit(){
  error.value = '';
  try {
    if(form.value.dueAt){
      form.value.dueAt=new Date(form.value.dueAt).toISOString()
    }
    await createTask(form.value,auth.headers());
    saved.value=true;
    setTimeout(()=>router.push('/tasks'),700)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '事务创建失败'
  } finally {
    form.value.dueAt='';
  }
}
// dueAt的时分秒不精确做了，我是懒鬼(
watch(()=>form.value.dueAt,()=>{
  if(new Date(form.value.dueAt).getTime()<new Date().getTime()){
    form.value.dueAt=''
    toast.show('截止日期不能早于当前日期')
  }
})
</script>
<template>
<div class="flex max-w-[1050px] flex-col gap-[25px]">
  <div>
    <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> DISPATCH / NEW RECORD</p>
    <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] max-[780px]:text-[25px]"> 添加一项事务</h2>
    <p class="text-xs leading-[1.65] text-muted"> 先描述清楚，再决定它进入公海池还是直接交给指定成员。</p>
  </div>
  <section class="grid grid-cols-[minmax(0,700px)_1fr] items-start gap-6 max-[780px]:grid-cols-1">
    <form
      class="border border-line bg-white p-7 shadow-[0_18px_40px_rgba(32,59,47,.06)]"
    @submit.prevent="submit">
      <div class="mb-6 flex gap-3">
        <div class="grid h-[26px] w-[26px] shrink-0 place-items-center bg-green-soft font-mono text-[10px] text-green-dark">
          01
        </div>
        <div>
          <h3 class="m-0 mb-1 text-[15px]"> 基本信息</h3>
          <p class="m-0 text-xs leading-[1.65] text-muted"> 事务会自动生成唯一编号。</p>
        </div>
      </div>
      <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d] first:mt-0">
        事务标题
        <input
          v-model="form.title"
          required
          placeholder="例如：北区节点巡检与风险复盘"
          class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 transition focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
        />
      </label>
      <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
        事务说明
        <textarea
          v-model="form.description"
          required
          rows="5"
          placeholder="补充目标、交付物和验收口径"
        class="resize-y rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 transition focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
        </textarea>
      </label>
      <div class="grid grid-cols-2 gap-[15px] max-[480px]:grid-cols-1">
        <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          <span>优先级</span>
          <select
            v-model="form.priority"
          class="h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
            <option>高</option><option>中</option><option>低</option>
          </select>
        </label>
        <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          <span>归属站点</span>
          <select
            v-model="form.department"
          class="h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
            <option v-for="d in departments" :key="d.id" :value="d.name">{{d.name}}</option>
          </select>
        </label>
        <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          <span>截止日期</span>
          <input
            v-model="form.dueAt"
            type="date"
            :class="form.dueAt? '' : 'text-transparent'"
          class="date-field h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
        </label>
      </div>
      <div class="mb-6 mt-7 flex gap-3 border-t border-line pt-[26px]">
        <div class="grid h-[26px] w-[26px] shrink-0 place-items-center bg-green-soft font-mono text-[10px] text-green-dark">
          02
        </div>
        <div>
          <h3 class="m-0 mb-1 text-[15px]"> 分配方式</h3>
          <p class="m-0 text-xs leading-[1.65] text-muted"> 未指定人员的事务会进入公海池。</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2.5 max-[480px]:grid-cols-1">
        <label
          class="flex cursor-pointer items-center gap-2.5 border border-line p-[15px]"
        :class="{'border-[#89d4b0] bg-green-soft':form.assignee==='pool'}">
          <input v-model="form.assignee" value="pool" type="radio" class="accent-green-dark" />
          <span class="flex-1"><strong class="block text-[11px]">发放到公海池</strong><small class="mt-1 block text-[10px] font-normal text-[#9aa7a1]">由符合权限的雇员主动领取</small></span><i class="text-[19px] not-italic text-green-dark">◎</i>
        </label>
        <label
          v-for="user in assignableUsers"
          :key="user.username"
          class="flex cursor-pointer items-center gap-2.5 border border-line p-[15px]"
        :class="{'border-[#89d4b0] bg-green-soft':form.assignee===user.username}">
          <input v-model="form.assignee" :value="user.username" type="radio" class="accent-green-dark" />
          <span class="flex-1"><strong class="block text-[11px]">直接委派给{{user.displayName}}</strong><small class="mt-1 block text-[10px] font-normal text-[#9aa7a1]">{{user.alias}} · {{user.department}}</small></span><i class="text-[19px] not-italic text-green-dark">↗</i>
        </label>
      </div>
      <div v-if="!assignableUsers.length" class="mt-3 text-xs leading-[1.65] text-muted">
        暂无可直接委派的活跃雇员/部长，可先发放到公海池。
      </div>
      <div v-if="error" class="mt-3 text-[11px] text-[#ba5c58]"> {{error}}</div>
      <div class="mt-7 flex items-center justify-end gap-2.5">
        <RouterLink class="inline-flex h-9 items-center justify-center gap-[14px] rounded border border-line bg-white px-[17px] text-[11px] font-bold text-[#64736c] transition-colors hover:border-[#afd9c3] hover:text-green-dark" to="/tasks">取消</RouterLink>
        <button
          class="inline-flex h-9 items-center justify-center gap-[14px] rounded bg-ink px-[17px] text-[11px] font-bold text-[#dcffed] shadow-[0_8px_14px_rgba(31,42,40,.12)] transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-55"
        :disabled="saved">
          <span>{{saved?'已创建':'创建事务'}}</span><span>↗</span>
        </button>
      </div>
    </form>
    <aside class="mt-[15px] border-t-2 border-green pt-[18px]">
      <span class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]">DISPATCH NOTE</span>
      <h3 class="my-[9px] text-[19px]"> 责任从分配开始。</h3>
      <p class="text-[11px] leading-[1.8] text-[#85918c]">
        进入公海池的事务不会绑定跟进人，直到成员主动领取。直接委派会绕过公海池，适合有明确 owner 的跨站点工作。
      </p>
    </aside>
  </section>
</div>
</template>