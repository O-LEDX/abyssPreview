<script setup lang="ts">import { computed, onMounted, ref } from 'vue'
import { getTasks } from '@/api/apis'
import {type Task} from '@/types/type'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import ExcelJs from 'exceljs'

const auth = useAuthStore();
const toast = useToastStore();
const tasks = ref<Task[]>([]);
const keyword = ref('');
const status = ref('ALL')
const filtered = computed(() => tasks.value.filter(t => (!keyword.value || `${t.taskNo}${t.title}${t.assigneeAlias || ''}`.toLowerCase().includes(keyword.value.toLowerCase())) && (status.value === 'ALL' || t.status === status.value)))

onMounted(async () => {
  try {
  tasks.value = await getTasks(auth.headers())
} catch (e) {
  toast.show('获取事务列表失败')
}
})

async function exportExcel(){
  const workbook=new ExcelJs.Workbook();
  const worksheet=workbook.addWorksheet('事务列表sheet1');
  const columnWidth=20;
  worksheet.columns=[
    {header:'事务编号',key:'taskNo',width:columnWidth},
    {header:'标题',key:'title',width:columnWidth},
    {header:'优先级',key:'priority',width:columnWidth},
    {header:'状态',key:'status',width:columnWidth},
    {header:'部门',key:'department',width:columnWidth},
    {header:'跟进人',key:'assigneeAlias',width:columnWidth}
  ];
  const headerRow = worksheet.getRow(1);
  headerRow.height=20;
  
  headerRow.eachCell(cell=>{
    cell.font={bold:true}
    cell.alignment={horizontal:'center',vertical:'middle'};
    cell.border={top:{style:'thin'}}
  })
  worksheet.addRows(filtered.value.map(t=>({
    taskNo:t.taskNo,
    title:t.title,
    priority:t.priority,
    status:statusText(t.status),
    department:t.department,
    assigneeAlias:t.assigneeAlias || '公海池'
  })));
  const buffer=await workbook.xlsx.writeBuffer();
  const blob=new Blob([buffer],{type:'/vnd.ms-excel;charset=utf-8'});
  const a=document.createElement('a');
  const date = new Date().toLocaleDateString().replaceAll('/','-');
  const timeStamp = new Date().toLocaleTimeString();
  a.href=URL.createObjectURL(blob);
  a.download=`abyss-tasks-${date}-${timeStamp}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href)
}

const statusText = (s:string) => ({
    PENDING:'待领取',
    IN_PROGRESS:'跟进中',
    COMPLETED:'已完成',
    FAILED:'已失败'
  }
  [s] || s)
</script>
<template>
<div class="flex flex-col gap-[25px]">
  <div class="flex items-end justify-between gap-5 max-[780px]:flex-col max-[780px]:items-start">
    <div>
      <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]">
        TASK REGISTER / {{ filtered.length }} RECORDS
      </p>
      <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] max-[780px]:text-[25px]"> 详细事务列表</h2>
      <p class="text-xs leading-[1.65] text-muted"> 统一查看事务唯一编号、责任归属与当前跟进状态。</p>
    </div>
    <div class="flex gap-[9px] max-[780px]:w-full">
      <button
        class="inline-flex h-9 flex-1 items-center justify-center gap-[14px] rounded border border-line bg-white px-[17px] text-[11px] font-bold text-[#64736c] transition-colors hover:border-[#afd9c3] hover:text-green-dark"
      @click="exportExcel">
        ↓ 导出 Excel
      </button>
      <RouterLink class="inline-flex h-9 flex-1 items-center justify-center gap-[14px] rounded bg-ink px-[17px] text-[11px] font-bold text-[#dcffed] shadow-[0_8px_14px_rgba(31,42,40,.12)] transition-colors hover:bg-green-dark" to="/tasks/add" v-if="['AbyssZero','superAdministrator'].includes(auth.user?.role || '')">＋ 新建事务</RouterLink>
    </div>
  </div>
  <section class="border border-line bg-white p-[22px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
    <div class="mb-[17px] flex items-center gap-2.5">
      <div class="flex h-[38px] max-w-[340px] flex-1 items-center gap-2 border border-line bg-white px-3">
        <span class="text-[19px] text-[#94a19b]">⌕</span>
        <input
          v-model="keyword"
          placeholder="搜索事务编号、标题或跟进人"
          class="w-full border-0 bg-transparent text-[11px] text-ink outline-0 placeholder:text-[#9aa7a1]"
        />
      </div>
      <select
        v-model="status"
      class="h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
        <option value="ALL">全部状态</option><option value="PENDING">待领取</option><option value="IN_PROGRESS">跟进中</option><option value="COMPLETED">已完成</option><option value="FAILED">已失败</option>
      </select>
      <RouterLink to="/tasks/stats" class="ml-auto text-[11px] font-bold text-green-dark">统计视图 ↗</RouterLink>
    </div>
    <div class="overflow-auto">
      <table class="min-w-[730px] w-full border-collapse text-left text-xs">
        <thead>
          <tr>
            <th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">唯一编号</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">事务标题</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">优先级</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">跟进人</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">跟进情况</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">截止时间</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filtered" :key="task.id">
            <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">
              <code class="font-mono text-[10px] text-[#708078]">{{ task.taskNo }}</code></td>
            <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">
              <strong class="block text-xs">{{ task.title }}</strong>
              <span class="mt-[5px] block max-w-[260px] overflow-hidden text-ellipsis text-[10px] text-[#9aa7a1]">{{ task.description }}</span>
            </td>
            <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">
              <span class="rounded-[3px] bg-[#f2f4f3] px-2 py-[5px] text-[10px] text-[#7c8984]" :class="{'bg-[#fff0ef] text-[#bf6560]':task.priority==='高','bg-[#fff7e9] text-[#ad7d32]':task.priority==='中','bg-[#eef8f3] text-[#308c69]':task.priority==='低'}">{{ task.priority }}</span>
            </td>
            <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">
              <span v-if="task.assigneeAlias" class="inline-flex items-center gap-1.5 text-[11px] font-bold">
                <i class="grid h-[23px] w-[23px] place-items-center rounded-md bg-[#e5f5ec] text-[8px] not-italic text-green-dark">
                  {{ task.assigneeAlias.slice(0,2) }}
                </i>
                {{ task.assigneeAlias }}
              </span>
                <span v-else class="text-[11px] text-[#a2ada8]">公海池</span>
              </td>
              <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">
                  <span class="inline-flex items-center gap-1.5 rounded-[3px] bg-[#f1f4f2] px-2 py-[5px] text-[10px] text-[#7f8c86]" :class="{'bg-[#eaf8f1] text-green-dark':task.status==='IN_PROGRESS','bg-[#eff8f4] text-[#278a63]':task.status==='COMPLETED','bg-[#fff0ef] text-[#ba5c58]':task.status==='FAILED'}">
                    <i class="h-[5px] w-[5px] rounded-full bg-[#adb8b3]" :class="{'bg-green':task.status==='IN_PROGRESS','bg-[#45b98a]':task.status==='COMPLETED','bg-danger':task.status==='FAILED'}"></i>
                    {{ statusText(task.status) }}
                  </span>
                </td>
                <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle text-xs text-muted">
                  {{ task.dueAt ? new Date(task.dueAt).toLocaleDateString('zh-CN') : '—' }}
                </td>
                <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle"><RouterLink class="text-[11px] font-bold text-green-dark" :to="`/tasks/manage?id=${task.id}`">查看 ↗</RouterLink></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</div>
</template>
