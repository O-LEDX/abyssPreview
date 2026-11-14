<script setup lang="ts">import { onMounted, ref,watch } from 'vue'
import {getTask,getTasks,updateTask,backToPool,deleteTask} from '@/api/apis'
import {type Task,type TaskReport} from '@/types/type'
import {useRoute} from "vue-router"
import { useAuthStore } from '@/stores/auth'
import {useToastStore} from '@/stores/toast'
import {type Department} from '@/types/type'
import {getDepartments} from '@/api/apis'

const auth=useAuthStore();
const toast=useToastStore();
const tasks=ref<Task[]>([]);
const selected=ref<Task|null>(null);
const reports=ref<TaskReport[]>([]);
const report=ref('');
const saving=ref(false);
const releasing=ref(false);
const deleting=ref(false);
const departments=ref<Department[]>([]);
const error=ref('')
const route=useRoute();
const formDueAt=ref<string|null>(null);
async function selectTask(task:Task){
  error.value='';
  try {
    const detail=await getTask(task.id,auth.headers());
    selected.value=detail.task;
    reports.value=detail.reports;
    report.value=''
  } catch (e) {
    error.value=e instanceof Error ? e.message : '无法加载事务详情'
  }
}
onMounted(async()=>{
    try {
      const id=Number(route.query.id);
      tasks.value=await getTasks(auth.headers());
      const task=tasks.value.find(t=>t.id===id);
      if(id &&task) {
        await selectTask(task);
      } else {
        await selectTask(tasks.value[0]);
      }
    } catch (e) {
      error.value=e instanceof Error ? e.message : '无法加载事务'
    }

    try {
      departments.value=await getDepartments(auth.headers());
    } catch (e) {
      error.value=e instanceof Error ? e.message : '无法加载站点'
    }
  })
async function save(){
  if(!selected.value)return;
  saving.value=true;
  error.value='';
  try {
    if(formDueAt.value){
      selected.value.dueAt=new Date(formDueAt.value).toISOString()
    }
    await updateTask(selected.value.id,{
        status:selected.value.status,
        department:selected.value.department,
        priority:selected.value.priority,
        dueAt:selected.value.dueAt,
        failureReason:selected.value.failureReason,
        reportContent:report.value
      },auth.headers());
    await selectTask(selected.value);
    report.value=''
    toast.show('已保存')
  } catch (e) {
    error.value=e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value=false 
    selected.value.dueAt=''
  }
}

async function release(){
  if(!selected.value)return;
  if(!window.confirm(`确认将「${selected.value.title}」退回公海池？跟进人将被清空并重置为待领取。`))return;
  releasing.value=true;
  error.value='';
  try {
    const updated=await backToPool(selected.value.id,auth.headers());
    const idx=tasks.value.findIndex(t=>t.id===updated.id);
    if(idx>=0) tasks.value[idx]=updated;
    await selectTask(updated);
    toast.show('已退回公海池')
  } catch (e) {
    error.value=e instanceof Error ? e.message : '退回失败'
  } finally {
    releasing.value=false
  }
}

async function remove(){
  if(!selected.value)return;
  if(!window.confirm(`确认删除「${selected.value.title}」？该事务及其全部记录报告将被永久删除，无法恢复。`))return;
  deleting.value=true;
  error.value='';
  try {
    await deleteTask(selected.value.id,auth.headers());
    tasks.value=tasks.value.filter(t=>t.id!==selected.value!.id);
    selected.value=null;
    toast.show('已删除')
  } catch (e) {
    error.value=e instanceof Error ? e.message : '删除失败'
  } finally {
    deleting.value=false
  }
}
const statusText=(s:string)=>({
    PENDING:'待领取',
    IN_PROGRESS:'跟进中',
    COMPLETED:'已完成',
    FAILED:'已失败'
  }
  [s]||s)

watch(()=>formDueAt.value,()=>{
  if(formDueAt.value == null){
    return
  } else if(new Date(formDueAt.value).getTime() < new Date().getTime()){
    formDueAt.value=''
    toast.show('截止日期不能早于当前日期')
  } else {
    return
  }
})
</script>
<template>
<div class="flex flex-col gap-[25px]">
  <div class="flex items-end justify-between gap-5 max-[780px]:flex-col max-[780px]:items-start">
    <div>
      <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> CONTROL ROOM / OWNERSHIP</p>
      <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] max-[780px]:text-[25px]"> 事务管理</h2>
      <p class="text-xs leading-[1.65] text-muted"> 在这里确认责任边界、处理完成记录与失败原因。</p>
    </div>
    <span class="border border-line bg-white px-[13px] py-2.5 text-[11px] text-[#6f7d77] cursor-default hover:bg-green-soft">{{ auth.user?.role === 'siteOfficer' ? '视角：部门' : '视角：全局' }}</span>
  </div>
  <div v-if="error" class="text-[11px] text-[#ba5c58]"> {{error}}</div>
  <div class="grid grid-cols-[320px_minmax(0,1fr)] items-start gap-[15px] max-[780px]:grid-cols-1">
    <section class="border border-line bg-white py-[21px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="mb-4 flex items-start justify-between gap-[15px] px-5">
        <div>
          <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> ALL RECORDS</p>
          <h3 class="mt-1.5 text-base tracking-[-0.3px]"> 选择事务</h3>
        </div>
        <span class="text-xs leading-[1.65] text-muted">{{tasks.length}} 项</span>
      </div>
      <button
        v-for="task in tasks"
        :key="task.id"
        class="flex w-full items-center justify-between gap-2.5 border-0 border-t border-[#eef2f0] bg-white px-5 py-3.5 text-left hover:bg-green-soft"
        :class="{'bg-green-soft':selected?.id===task.id}"
      @click="selectTask(task)">
        <div>
          <code class="font-mono text-[10px] text-[#708078]">{{task.taskNo}}</code><strong class="mt-[5px] block max-w-[165px] overflow-hidden text-ellipsis text-[11px]">{{task.title}}</strong>
        </div>
        <span class="inline-flex items-center gap-1.5 rounded-[3px] bg-[#f1f4f2] px-2 py-[5px] text-[10px] text-[#7f8c86]" :class="{'bg-[#eaf8f1] text-green-dark':task.status==='IN_PROGRESS','bg-[#eff8f4] text-[#278a63]':task.status==='COMPLETED','bg-[#fff0ef] text-[#ba5c58]':task.status==='FAILED'}"><i class="h-[5px] w-[5px] rounded-full bg-[#adb8b3]" :class="{'bg-green':task.status==='IN_PROGRESS','bg-[#45b98a]':task.status==='COMPLETED','bg-danger':task.status==='FAILED'}"></i>{{statusText(task.status)}}</span>
      </button>
    </section>
    <section
      v-if="selected"
    class="border border-line bg-white p-6 shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="flex items-start justify-between gap-[15px]">
        <div class="w-[90%] flex items-start justify-between gap-[5px]">
          <div>
            <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> {{selected.taskNo}}</p>
            <h3 class="mt-1.5 text-base tracking-[-0.3px]"> {{selected.title}}</h3>
          </div>
          <div>
            <span class="mb-[7px] block font-bold text-[10px] text-[#95a19d]">截止日期</span>
            <strong class="mt-1.5 block text-md tracking-[-0.3px]">{{new Date(selected.dueAt).toLocaleDateString('zh-CN')}}</strong>
          </div>
        </div>
        <span class="rounded-[3px] bg-[#f2f4f3] px-2 py-[5px] text-[10px] text-[#7c8984]" :class="{'bg-[#fff0ef] text-[#bf6560]':selected.priority==='高','bg-[#fff7e9] text-[#ad7d32]':selected.priority==='中','bg-[#eef8f3] text-[#308c69]':selected.priority==='低'}">{{selected.priority }}优先</span>
      </div>
      <div class="my-5 grid grid-cols-3 gap-3 border-y border-line py-[19px] max-[480px]:grid-cols-1">
        <div>
          <span class="mb-[7px] block text-[10px] text-[#9aa7a1]">归属站点</span><strong class="block text-xs">{{selected.department}}</strong>
        </div>
        <div>
          <span class="mb-[7px] block text-[10px] text-[#9aa7a1]">跟进人</span><strong class="block text-xs">{{selected.assigneeAlias || '公海池'}}</strong>
        </div>
        <div>
          <span class="mb-[7px] block text-[10px] text-[#9aa7a1]">创建时间</span><strong class="block text-xs">{{new Date(selected.createdAt).toLocaleDateString('zh-CN')}}</strong>
        </div>
      </div>
      <div class="pb-[12px]">
        <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> DESCRIPTION</p>
        <p class="text-md font-bold leading-[1.8] text-[#66756e]"> {{selected.description}}</p>
      </div>
      <div class="grid grid-cols-2 gap-[15px] max-[480px]:grid-cols-1">
        <label class="mt-[5px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d] first:mt-0">
          <span>当前状态</span>
          <select
            v-model="selected.status"
          class=" h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
            <option value="PENDING">待领取</option><option value="IN_PROGRESS">跟进中</option><option value="COMPLETED">已完成</option><option value="FAILED">已失败</option>
          </select>
        </label>
        <label class="mt-[5px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d] first:mt-0">
          <span>归属站点</span>
          <select
            v-model="selected.department"
          class=" h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
            <option v-for="item in departments" :key="item.id" :value="item.name">{{item.name}}</option>
          </select>
        </label>
        <label class="mt-[5px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d] first:mt-0">
          <span>优先级</span>
          <select
            v-model="selected.priority"
          class=" h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
            <option value="高">高</option><option value="中">中</option><option value="低">低</option>
          </select>
        </label>
        <label class="mt-[5px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          <span>截止日期</span>
          <input
            v-model="formDueAt"
            type="date"
            :class="formDueAt ? '' : 'text-transparent'"
          class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
        </label>
        <label class="mt-[5px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          <span>失败原因</span>
          <input
            v-model="selected.failureReason"
            placeholder="仅失败状态填写"
            class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
      </div>
      <div class="mt-5 bg-[#f7faf8] p-4">
        <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> OPERATION NOTE</p>
        <h4 class="my-1.5 mb-3 text-xs"> 完成 / 失败记录报告</h4>
        <textarea
          v-model="report"
          rows="4"
          placeholder="记录本次处理结论、交付物位置或失败复盘"
        class="w-full resize-y rounded-[3px] border border-[#e2ebe6] bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
        </textarea>
      </div>
      <div v-if="reports.length" class="mt-[22px] border-t border-line pt-[18px]">
        <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> REPORT HISTORY</p>
        <div
          v-for="item in reports"
          :key="item.id"
        class="mt-[11px] border-l-2 border-green bg-[#fbfdfc] px-0 py-[9px] pl-3">
          <div>
            <strong class="text-[11px]">{{item.reporter}}</strong><span class="ml-2 text-[10px] text-[#9aa7a1]">{{statusText(item.status)}} · {{new Date(item.createdAt).toLocaleString('zh-CN')}}</span>
          </div>
          <p class="mt-[7px] text-[11px] leading-[1.65] text-[#66756e]">
            {{item.content || '未填写文字说明'}}
          </p>
        </div>
      </div>
      <div class="mt-7 flex items-center justify-end gap-3.5">
        <span class="mr-auto text-[11px] text-green-dark">-</span>
        <button
          class="inline-flex h-9 items-center justify-center gap-[14px] rounded bg-danger px-[17px] text-[11px] font-bold text-white shadow-[0_8px_14px_rgba(215,110,104,.25)] transition-colors hover:bg-[#c05e58] disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="deleting||releasing||saving"
        @click="remove">
          {{deleting?'删除中…':'删除事务'}}
        </button>
        <button
          class="inline-flex h-9 items-center justify-center gap-[14px] rounded border border-[#ecd5d3] bg-white px-[17px] text-[11px] font-bold text-danger transition-colors hover:bg-[#fff0ef] disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="releasing||saving||deleting"
        @click="release">
          {{releasing?'退回中…':'退回公海池'}}
        </button>
        <button
          class="inline-flex h-9 items-center justify-center gap-[14px] rounded bg-ink px-[17px] text-[11px] font-bold text-[#dcffed] shadow-[0_8px_14px_rgba(31,42,40,.12)] transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-55"
          :disabled="saving||deleting"
        @click="save">
          {{saving?'保存中…':'保存管理结果 ↗'}}
        </button>
      </div>
    </section>
  </div>
</div>
</template>
