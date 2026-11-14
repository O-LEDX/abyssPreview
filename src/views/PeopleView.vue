<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createUser, deleteUser, getUsers, updateUser, getDepartments } from '@/api/apis'
import {type User,type Department} from '@/types/type'
import { useAuthStore } from '@/stores/auth'
import ExcelJs from 'exceljs'

const router = useRouter()
const auth=useAuthStore();
const users=ref<User[]>([]);
const departments=ref<Department[]>([]);
const keyword=ref('');
const showForm=ref(false);
const editingId=ref<number|null>(null);
const error=ref('');
const form=ref<any>({
    employeeNo:'',
    username:'',
    displayName:'',
    alias:'',
    role:'siteEmployees',
    department:'',
    contact:'',
    password:''
  })
const isOfficer = computed(() => auth.user?.role === 'siteOfficer')
const hasSuperAdmin = computed(() => users.value.some(u => u.role === 'superAdministrator'))
const editingUser = computed(() => editingId.value == null ? undefined : users.value.find(u => u.id === editingId.value))
const canOfferSuperAdmin = computed(() => !isOfficer.value && (!hasSuperAdmin.value || editingUser.value?.role === 'superAdministrator'))
const filtered=computed(()=>users.value.filter(u=>`${u.employeeNo}${u.displayName}${u.alias}${u.department}`.toLowerCase().includes(keyword.value.toLowerCase())))
const deptNodes=computed(()=>departments.value.map(d=>{
    const byDept=(role:string)=>users.value.filter(u=>u.role===role && u.department===d.name);
    return {
      id:d.id,
      name:d.name,
      zeroUsers:byDept('AbyssZero'),
      superAdmins:byDept('superAdministrator'),
      officers:users.value.filter(u=>u.role==='siteOfficer' && (u.departments ?? []).includes(d.name)),
      employees:byDept('siteEmployees')
    }
  }))
onMounted(async()=>{
    try{
      const [loadedUsers,loadedDepts]=await Promise.all([getUsers(auth.headers()),getDepartments(auth.headers())])
      users.value=loadedUsers
      departments.value=loadedDepts
    }catch(e){
      error.value=e instanceof Error?e.message:'无法加载人员'
    }
  })
function resetForm(){
  form.value={
    employeeNo:'',
    username:'',
    displayName:'',
    alias:'',
    role:'siteEmployees',
    department:auth.user?.role==='siteOfficer' ? auth.user.department : departments.value.find(d=>d.name==='总部')?.name ?? departments.value[0]?.name ?? '',
    contact:'',
    password:''
  };
  editingId.value=null
}
function openCreate(){
  resetForm();
  form.value.password='';
  showForm.value=true
}
function openEdit(user:User){
  if (user.id === auth.user?.id) {
    void router.push('/personalView');
    return;
  }
  form.value={...user,password:''};
  editingId.value=user.id;
  showForm.value=true
}
async function save(){
  error.value='';
  try {
    if(editingId.value){
      const payload:any={
          displayName:form.value.displayName,
          alias:form.value.alias,
          role:form.value.role,
          contact:form.value.contact,
          active:form.value.active,
          ...(form.value.password?{password:form.value.password}:{})
        };
      if(!isOfficer.value && form.value.department!==editingUser.value?.department) payload.department=form.value.department;
      const updated=await updateUser(editingId.value,payload,auth.headers());
      users.value=users.value.map(item=>item.id===updated.id?updated:item)
    } else {
      const created=await createUser(form.value,auth.headers());
      users.value.push(created)
    }
    showForm.value=false;
    resetForm()
  } catch(e){
    error.value=e instanceof Error?e.message:'保存失败'
  }
}
async function toggle(user:User){
  const next=!user.active;
  try {
    const updated=await updateUser(user.id,{active:String(next)},auth.headers());
    users.value=users.value.map(item=>item.id===updated.id?updated:item)
  } catch(e){
    error.value=e instanceof Error?e.message:'状态更新失败'
  }
}
async function remove(user:User){
  if(!window.confirm(`确认删除 ${user.displayName}？`))return;
  try {
    await deleteUser(user.id,auth.headers());
    users.value=users.value.filter(item=>item.id!==user.id)
  } catch(e){
    error.value=e instanceof Error?e.message:'删除失败'
  }
}
async function exportExcel(){
  const workbook=new ExcelJs.Workbook();
  const worksheet=workbook.addWorksheet('人员花名册sheet1');
  const columnWidth=20;
  worksheet.columns=[
    {header:'工号',key:'employeeNo',width:columnWidth},
    {header:'姓名',key:'displayName',width:columnWidth},
    {header:'代号',key:'alias',width:columnWidth},
    {header:'角色',key:'role',width:columnWidth},
    {header:'部门',key:'department',width:columnWidth},
    {header:'联系方式',key:'contact',width:columnWidth},
    {header:'状态',key:'active',width:columnWidth}
  ];
  const headerRow = worksheet.getRow(1);
  headerRow.height=20;
  
  headerRow.eachCell(cell=>{
    cell.font={bold:true}
    cell.alignment={horizontal:'center',vertical:'middle'};
    cell.border={top:{style:'thin'}}
  })
  worksheet.addRows(filtered.value.map(u=>({
    employeeNo:u.employeeNo,
    displayName:u.displayName,
    alias:u.alias,
    role:u.role,
    department:u.department,
    contact:u.contact,
    active:u.active?'正常':'已停用'
  })));
  const buffer=await workbook.xlsx.writeBuffer();
  const blob=new Blob([buffer],{type:'/vnd.ms-excel;charset=utf-8'});
  const a=document.createElement('a');
  const date = new Date().toLocaleDateString().replaceAll('/','-');
  const timeStamp = new Date().toLocaleTimeString();
  a.href=URL.createObjectURL(blob);
  a.download=`abyss-people-${date}-${timeStamp}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href)
}
const roleText=(r:string)=>({
    AbyssZero:'全域指挥',
    superAdministrator:'超级管理员',
    siteOfficer:'部长',
    siteEmployees:'雇员'
  }
  [r]||r)
</script>
<template>
<div class="flex flex-col gap-[25px]">
  <div class="flex items-end justify-between gap-5 max-[780px]:flex-col max-[780px]:items-start">
    <div>
      <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> PEOPLE / DIRECTORY</p>
      <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] max-[780px]:text-[25px]"> 人员管理</h2>
      <p class="text-xs leading-[1.65] text-muted"> 维护角色分支、成员状态与通讯录信息。</p>
    </div>
    <div class="flex gap-[9px] max-[780px]:w-full">
      <button
        class="inline-flex h-9 flex-1 items-center justify-center gap-[14px] rounded border border-line bg-white px-[17px] text-[11px] font-bold text-[#64736c] transition-colors hover:border-[#afd9c3] hover:text-green-dark"
      @click="exportExcel">
        ↓ 导出Excel
      </button>
      <button
        class="inline-flex h-9 flex-1 items-center justify-center gap-[14px] rounded bg-ink px-[17px] text-[11px] font-bold text-[#dcffed] shadow-[0_8px_14px_rgba(31,42,40,.12)] transition-colors hover:bg-green-dark"
      @click="openCreate">
        ＋ 新增成员
      </button>
    </div>
  </div>
  <div v-if="error" class="text-[11px] text-[#ba5c58]"> {{error}}</div>
  <div class="grid grid-cols-[320px_minmax(0,1fr)] items-start gap-[15px] max-[780px]:grid-cols-1">
    <section class="overflow-auto min-h-[480px] max-h-[480px] border border-line bg-white px-5 py-[22px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div>
        <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> ROLE TREE</p>
        <h3 class="mt-1.5 text-base tracking-[-0.3px]"> 人员分支</h3>
      </div>
      <details>
      <summary class="cursor-pointer cue flex justify-between items-center py-3.5 pb-5">
        <div class="flex items-center gap-2.5">
        <span class="grid h-[29px] w-[29px] place-items-center rounded-[7px] bg-ink text-[10px] font-bold text-[#d8ffeb]">A</span>
        <div>
          <strong class="block text-[11px]">AbyssSystem</strong>
          <small class="mt-1 block text-[10px] text-[#9aa7a1]">全域组织</small>
        </div>
        </div>
        <div class="h-[29px] w-[29px]">⌵</div>
      </summary>
      <div class="ml-[14px] flex flex-col gap-[18px] border-l border-[#dce7e1] pl-[19px]">
        <div
          v-for="d in deptNodes"
          :key="d.id"
        class="relative before:absolute before:-left-5 before:w-[13px] before:border-t before:border-[#dce7e1]">
        <details>
          <summary class="cursor-pointer cue flex justify-between items-center">
            <div class="flex items-center gap-2.5">
            <span class="grid h-[29px] w-[29px] place-items-center rounded-[7px] bg-[#fff5e4] text-[10px] font-bold text-[#ad7d32]">站</span>
            <div>
              <strong class="block text-[11px]">{{d.name}}</strong>
              <small class="mt-1 block text-[10px] text-[#9aa7a1]">{{d.zeroUsers.length+d.superAdmins.length+d.officers.length+d.employees.length}} 位成员</small>
            </div>
            </div>
            <div class="h-[29px] w-[29px]">⌵</div>
          </summary>
          <div v-if="d.zeroUsers.length||d.superAdmins.length||d.officers.length||d.employees.length" class="ml-[14px] mt-[10px] flex flex-col gap-[9px] border-l border-[#dce7e1] pl-[19px]">
            <div
              v-for="z in d.zeroUsers"
              :key="'z'+z.id"
            class="relative flex items-center gap-2 before:absolute before:-left-5 before:w-[13px] before:border-t before:border-[#dce7e1]">
              <span class="grid h-[24px] w-[24px] place-items-center rounded-[6px] bg-[#eef1f0] text-[9px] font-bold text-[#66746e]">ZE</span>
              <strong class="text-[11px]">{{z.displayName}}</strong><small class="text-[10px] text-[#9aa7a1]">{{z.username}}</small>
            </div>
            <div
              v-for="s in d.superAdmins"
              :key="'s'+s.id"
            class="relative flex items-center gap-2 before:absolute before:-left-5 before:w-[13px] before:border-t before:border-[#dce7e1]">
              <span class="grid h-[24px] w-[24px] place-items-center rounded-[6px] bg-[#eef1f0] text-[9px] font-bold text-[#66746e]">SA</span>
              <strong class="text-[11px]">{{s.displayName}}</strong><small class="text-[10px] text-[#9aa7a1]">{{s.username}}</small>
            </div>
            <div
              v-for="o in d.officers"
              :key="'o'+o.id"
            class="relative flex items-center gap-2 before:absolute before:-left-5 before:w-[13px] before:border-t before:border-[#dce7e1]">
              <span class="grid h-[24px] w-[24px] place-items-center rounded-[6px] bg-[#fff5e4] text-[9px] font-bold text-[#ad7d32]">部</span>
              <strong class="text-[11px]">{{o.displayName}}</strong><small class="text-[10px] text-[#9aa7a1]">{{o.username}}</small>
            </div>
            <div
              v-for="e in d.employees"
              :key="'e'+e.id"
            class="relative flex items-center gap-2 before:absolute before:-left-5 before:w-[13px] before:border-t before:border-[#dce7e1]">
              <span class="grid h-[24px] w-[24px] place-items-center rounded-[6px] bg-green-soft text-[9px] font-bold text-green-dark">员</span>
              <strong class="text-[11px]">{{e.displayName}}</strong><small class="text-[10px] text-[#9aa7a1]">{{e.username}}</small>
            </div>
          </div>
          </details>
        </div>
      </div>
      </details>
    </section>
    <section class="min-h-[480px] max-h-[480px] border border-line bg-white px-5 py-[21px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
      <div class="mb-[17px] flex items-center gap-2.5">
        <div class="flex h-[38px] max-w-[340px] flex-1 items-center gap-2 border border-line bg-white px-3">
          <span class="iconfont icon-search text-[19px] text-[#94a19b]"></span>
          <input
            v-model="keyword"
            placeholder="搜索工号、姓名、代号或站点"
            class="w-full border-0 bg-transparent text-[11px] text-ink outline-0 placeholder:text-[#9aa7a1]"
          />
        </div>
        <span class="text-xs leading-[1.65] text-muted">{{filtered.length}} 位成员</span>
      </div>
      <div class="relative overflow-auto max-h-[380px] min-w-[780px] w-full">
        <table class="relative overflow-auto max-h-[380px] min-w-[780px] w-full border-collapse text-left text-xs">
          <thead class="w-full min-h-[42px] bg-white absolute sticky top-0">
            <tr>
              <th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">成员</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">工号</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">角色</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">部门</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">联系方式</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">状态</th><th class="whitespace-nowrap border-b border-line px-[11px] py-3 text-[10px] font-bold uppercase tracking-[1px] text-[#9da9a4]">操作</th>
            </tr>
          </thead>
          <tbody class="w-full min-w-[780px]">
            <tr v-for="user in filtered" :key="user.id">
              <td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">
              <div class="flex items-center gap-2">
                <span class="grid h-[29px] w-[29px] place-items-center rounded-lg bg-[#dff5e9] text-[10px] font-bold text-green-dark">{{user.alias.slice(0,2)}}</span>
                <div>
                  <strong class="block text-xs">{{user.displayName}}</strong><span class="mt-0.5 block text-[10px] text-[#9aa7a1]">{{user.alias}}</span>
                </div>
              </div>
              </td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle"><code class="font-mono text-[10px] text-[#708078]">{{user.employeeNo}}</code></td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle text-[11px] text-[#687770]">{{roleText(user.role)}}</td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">{{user.department}}</td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle text-xs text-muted">{{user.contact}}</td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">
              <button
                v-if="user.id !== auth.user?.id"
                class="inline-flex items-center gap-[7px] border-0 bg-transparent text-[10px] text-[#a1ada8]"
                :class="{'text-green-dark':user.active}"
              @click="toggle(user)">
                <i class="relative h-3.5 w-[25px] rounded-[10px] bg-[#cbd4d0] after:absolute after:left-0.5 after:top-0.5 after:h-2.5 after:w-2.5 after:rounded-full after:bg-white after:transition-all" :class="{'bg-green after:left-[13px]':user.active}"></i><span>{{user.active?'正常':'停用'}}</span>
              </button>
              <span v-else :class="user.active ? 'text-green-dark' : 'text-danger'" class="text-[10px]">{{user.active?'正常':'已停用'}}</span>
              </td><td class="whitespace-nowrap border-b border-[#eef2f0] px-[11px] py-[15px] align-middle">
              <div class="flex gap-[9px]">
                <button
                  class="border-0 bg-transparent p-1.5 text-[11px] text-[#82908a] hover:text-green-dark"
                  title="编辑"
                @click="openEdit(user)">
                  编辑
                </button>
                <button
                  v-if="user.id !== auth.user?.id"
                  class="border-0 bg-transparent p-1.5 text-[11px] text-danger"
                  title="删除"
                @click="remove(user)">
                  删除
                </button>
              </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
  <div
    v-if="showForm"
    class="fixed inset-0 z-10 grid place-items-center bg-[rgba(24,37,31,.27)] p-5"
  @click.self="showForm=false">
    <form
      class="w-full max-w-[650px] border border-line bg-white p-[25px] shadow-[0_18px_40px_rgba(32,59,47,.06)]"
    @submit.prevent="save">
      <div class="flex items-start justify-between gap-[15px]">
        <div>
          <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]">
            {{editingId?'EDIT MEMBER':'NEW MEMBER'}}
          </p>
          <h3 class="mt-1.5 text-base tracking-[-0.3px]"> {{editingId?'编辑人员':'新增人员'}}</h3>
        </div>
        <button
          type="button"
          class="border-0 bg-transparent p-1.5 text-[23px] text-[#82908a]"
        @click="showForm=false">
          ×
        </button>
      </div>
      <div class="grid grid-cols-2 gap-[15px] max-[480px]:grid-cols-1">
        <label
          v-if="!editingId"
        class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          工号
          <input
            v-model="form.employeeNo"
            required
            placeholder="SE-XXX"
            class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
        <label
          v-if="!editingId"
        class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d] first:mt-0">
          登录账号
          <input
            v-model="form.username"
            required
            placeholder="username"
            class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
        <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d] first:mt-0">
          姓名
          <input
            v-model="form.displayName"
            required
            placeholder="姓名"
            class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
        <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          代号
          <input
            v-model="form.alias"
            required
            placeholder="ALIAS"
            class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
        <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          角色
          <select
            v-model="form.role"
            :disabled="isOfficer"
          class="h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
            <option value="siteEmployees">雇员</option><option v-if="!isOfficer" value="siteOfficer">部长</option><option v-if="canOfferSuperAdmin" value="superAdministrator">超级管理员</option>
          </select>
        </label>
        <label
        class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          部门
          <select
            v-model="form.department"
            :disabled="isOfficer"
          class="h-[38px] rounded-[3px] border border-line bg-white px-[11px] text-[11px] text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]">
            <option v-for="d in departments" :key="d.id" :value="d.name">{{d.name}}</option>
          </select>
        </label>
        <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          联系方式
          <input
            v-model="form.contact"
            placeholder="name@abyss.local"
            class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
        <label class="mt-[19px] flex flex-col gap-2 text-[11px] font-bold text-[#65746d]">
          {{editingId?'重置密码':'初始密码'}}
          <input
            v-model="form.password"
            :required="!editingId"
            type="password"
            placeholder="留空则不修改"
            class="rounded-[3px] border border-line bg-white px-3 py-[11px] text-xs text-ink outline-0 focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
      </div>
      <div class="mt-7 flex items-center justify-end gap-2.5">
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-[14px] rounded border border-line bg-white px-[17px] text-[11px] font-bold text-[#64736c] hover:border-[#afd9c3] hover:text-green-dark"
        @click="showForm=false">
          取消
        </button>
        <button class="inline-flex h-9 items-center justify-center gap-[14px] rounded bg-ink px-[17px] text-[11px] font-bold text-[#dcffed] shadow-[0_8px_14px_rgba(31,42,40,.12)] hover:bg-green-dark">
          {{editingId?'保存修改':'保存成员'}} ↗
        </button>
      </div>
    </form>
  </div>
</div>
</template>
