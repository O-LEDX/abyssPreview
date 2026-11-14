<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { digestPassword, updateUser, validateToken, uploadAvatar } from '@/api/apis'
import {type User} from '@/types/type'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { getAvatar, deleteAvatar } from '@/api/apis'
import defaultAvatarUrl from '@/assets/manbo.png'
import { useAvatarUrlStore } from '@/stores/avatarUrl'

const avatarUrlStore = useAvatarUrlStore()
const auth = useAuthStore()
const toast = useToastStore()
const profile = ref<User | null>(null)
const form = ref({ displayName: '', alias: '', contact: '' })
const password = ref({ current: '', next: '', confirm: '' })
const loading = ref(true)
const saving = ref(false)
const changingPassword = ref(false)
const error = ref('')
const passwordError = ref('')
const avatorPanel = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref('')
const avatarError = ref('')
const avatarUrl = ref('')

const roleNames: Record<User['role'], string> = {
  AbyssZero: '全域指挥',
  superAdministrator: '超级管理员',
  siteOfficer: '部长',
  siteEmployees: '雇员'
}
const changed = computed(() => profile.value !== null && (
  form.value.displayName.trim() !== profile.value.displayName ||
  form.value.alias.trim() !== profile.value.alias ||
  form.value.contact.trim() !== profile.value.contact
))

function errorMessage(cause: unknown, fallback: string) {
  if (!(cause instanceof Error)) return fallback
  try {
    const detail = JSON.parse(cause.message) as { message?: string }
    return detail.message || fallback
  } catch {
    return cause.message || fallback
  }
}

function acceptProfile(user: User, resetForm = true) {
  profile.value = user
  if (resetForm) form.value = { displayName: user.displayName, alias: user.alias, contact: user.contact }
  auth.user = user
  localStorage.setItem('abyss-session', JSON.stringify({ token: auth.token, user }))
}

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const response = await validateToken(auth.headers())
    if (!('id' in response)) throw new Error(response.message)
    acceptProfile(response)
    downloadAvatar()
  } catch (cause) {
    error.value = errorMessage(cause, '个人资料加载失败')
  } finally {
    loading.value = false
  }
}

async function downloadAvatar() {
  if (!profile.value) return
  try {
    const response = await getAvatar(profile.value.id, auth.headers())
    avatarUrl.value = response.avatarUrl
    avatarUrlStore.setAvatarUrl(response.avatarUrl)
  } catch (cause) {
    avatarUrl.value = defaultAvatarUrl
  }
}

async function removeAvatar() {
  if (!profile.value) return
  if (avatarUrl.value === defaultAvatarUrl) {
    toast.show('默认头像不能删除')
    return
  }
  try {
    await deleteAvatar(profile.value.id, auth.headers())
    avatarUrl.value = defaultAvatarUrl
    toast.show('头像已删除')
    avatarUrlStore.setAvatarUrl('')
    refresh()
  } catch (cause) {
    toast.show(errorMessage(cause, '删除头像失败'))
  }
}

async function save() {
  if (!profile.value || !changed.value || saving.value || changingPassword.value) return
  error.value = ''
  const displayName = form.value.displayName.trim()
  const alias = form.value.alias.trim()
  if (!displayName || !alias) {
    error.value = '姓名和代号不能为空'
    return
  }
  saving.value = true
  try {
    const updated = await updateUser(profile.value.id, {
      displayName,
      alias,
      contact: form.value.contact.trim()
    }, auth.headers())
    acceptProfile(updated)
    toast.show('个人资料已保存')
  } catch (cause) {
    error.value = errorMessage(cause, '保存失败')
  } finally {
    saving.value = false
  }
}

async function savePassword() {
  if (!profile.value || changingPassword.value || saving.value) return
  passwordError.value = ''
  if (password.value.next !== password.value.confirm) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }
  if (!password.value.current || !password.value.next) {
    passwordError.value = '请填写当前密码和新密码'
    return
  }
  changingPassword.value = true
  try {
    const updated = await updateUser(profile.value.id, {
      currentPasswordDigest: await digestPassword(password.value.current),
      password: password.value.next
    }, auth.headers())
    acceptProfile(updated, false)
    password.value = { current: '', next: '', confirm: '' }
    toast.show('密码已更新')
  } catch (cause) {
    passwordError.value = errorMessage(cause, '密码修改失败')
  } finally {
    changingPassword.value = false
  }
}

function onAvatarPicked(event: Event) {
  //type=file(出文件夹) + input.files?.[0]（选择的文件对象） fileReader.result（图片base64编码）
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  avatarError.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    avatarError.value = '请选择图片文件'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    avatarPreview.value = typeof reader.result === 'string' ? reader.result : ''
  }
  reader.onerror = () => {
    avatarError.value = '图片读取失败，请重试'
  }
  reader.readAsDataURL(file)
}

async function submitAvatar() {
  if (!avatarPreview.value ) {
    toast.show('请先选择头像')
    return
  } else if (!profile.value) {
    toast.show('个人信息错误')
    return
  } else {
    try {
      await uploadAvatar(profile.value.id, 
      { avatar: avatarPreview.value}, 
      auth.headers())
        .then(() => {
        toast.show('头像上传成功')
        refresh()
      })
    } catch (e) {
      toast.show(errorMessage(e, '头像上传失败'))
    }
  }
}

function clearAvatar() {
  avatarPreview.value = ''
  avatarError.value = ''
}

onMounted(refresh)
</script>

<template>
  <div class="flex flex-col gap-6 relative">

    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]">ACCOUNT / PROFILE</p>
        <h2 class="my-2 text-[29px] text-ink max-[780px]:text-[25px]">个人资料</h2>
        <p class="text-xs text-muted">管理个人资料与登录密码。</p>
      </div>
      <button type="button" class="h-9 rounded border border-line bg-white px-4 text-xs font-bold text-[#64736c] hover:border-[#afd9c3] hover:text-green-dark disabled:opacity-50" :disabled="loading || saving || changingPassword" @click="refresh">刷新资料</button>
    </div>

    <div v-if="loading" class="border border-line bg-white p-6 text-sm text-muted" role="status">正在加载个人资料...</div>
    <div v-else-if="!profile" class="border border-line bg-white p-6 text-sm text-danger" role="alert">{{ error || '获取个人资料失败' }}</div>
    <template v-else>
      <div class="grid grid-cols-[minmax(220px,320px)_minmax(0,1fr)] items-start gap-4 max-[850px]:grid-cols-1">
        <section class="border border-line bg-white p-6 shadow-[0_18px_40px_rgba(32,59,47,.06)]">
          <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]">IDENTITY / 身份信息</p>
          <div class="mt-6 flex items-center gap-4">
            <img :src="avatarUrl" alt="头像" class="h-14 w-14 shrink-0 rounded-md bg-ink">
            <div class="min-w-0 overflow-auto">
              <strong class="pr-2 break-words text-base">{{ profile.displayName }}</strong>
              <span class="text-xs font-bold text-muted cursor-pointer text-[#afd9c3] hover:text-green-dark" @click="avatorPanel = !avatorPanel">头像设置↗</span>
              <span class="mt-1 block break-all text-xs text-muted">@{{ profile.username }}</span>
              <span class="text-xs font-bold text-muted cursor-pointer hover:text-danger" @click="removeAvatar">删除头像</span>
            </div>
          </div>
          <dl class="mt-6 divide-y divide-line text-xs">
            <div class="flex justify-between gap-4 py-3"><dt class="shrink-0 text-muted">角色</dt><dd class="text-right font-bold">{{ roleNames[profile.role] }}</dd></div>
            <div class="flex justify-between gap-4 py-3"><dt class="shrink-0 text-muted">部门</dt><dd class="break-words text-right font-bold">{{ profile.department || '未分配' }}</dd></div>
            <div class="flex justify-between gap-4 py-3"><dt class="shrink-0 text-muted">工号</dt><dd class="break-all text-right font-mono">{{ profile.employeeNo }}</dd></div>
            <div class="flex justify-between gap-4 py-3"><dt class="shrink-0 text-muted">账号 ID</dt><dd class="text-right font-mono">{{ profile.id }}</dd></div>
            <div class="flex justify-between gap-4 py-3"><dt class="shrink-0 text-muted">状态</dt><dd :class="profile.active ? 'text-green-dark' : 'text-danger'" class="text-right font-bold">{{ profile.active ? '正常' : '已停用' }}</dd></div>
          </dl>

          <section v-if="avatorPanel" class="relative pt-2"> 
            <div class="bg-gray-600 h-[1px] w-full"></div>
            <div class="mt-5">
              <span class="pr-2 text-[10px] font-bold tracking-[1.6px] text-[#95a19d]">AVATAR / 头像设置</span>  
              <span class="text-xs font-bold text-muted cursor-pointer text-[#afd9c3] hover:text-green-dark" @click="avatorPanel = false">关闭↗</span>
              <div class="mt-4 grid grid-cols-1 gap-3">
                <div class="grid h-18 w-18 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-white text-[10px] text-muted">
                  <img v-if="avatarPreview" :src="avatarPreview" alt="头像预览" class="h-full w-full object-cover" />
                  <template v-else>+</template>
                </div>
                <div class="min-w-0 flex-1 mt-2">
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="h-9 rounded border border-line bg-white px-4 text-xs font-bold text-[#64736c] hover:border-[#afd9c3] hover:text-green-dark" @click="avatarInput?.click()">{{ avatarPreview ? '更换图片' : '选择图片' }}</button>
                    <button v-if="avatarPreview" type="button" class="h-9 rounded border border-line px-3 text-xs font-bold text-[#64736c] hover:border-[#afd9c3] hover:text-green-dark" @click="submitAvatar">上传 </button>
                    <button v-if="avatarPreview" type="button" class="h-9 rounded border border-line px-3 text-xs font-bold text-muted hover:text-danger" @click="clearAvatar">移除</button>
                  </div>
                  <p class="mt-2 text-xs text-muted">支持 JPG / PNG 图片格式</p>
                  <p v-if="avatarError" class="mt-1 text-xs text-danger" role="alert">{{ avatarError }}</p>
                </div>
              </div>
              <input ref="avatarInput" type="file" accept="image/jpeg,image/png" class="hidden" @change="onAvatarPicked" />
            </div>
          </section>
        </section>


        <div class="flex min-w-0 flex-col gap-4">
          <section class="border border-line bg-white p-6 shadow-[0_18px_40px_rgba(32,59,47,.06)]">
            <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]">PROFILE / 公开资料</p>
            <h3 class="mb-5 mt-1.5 text-base">基本信息</h3>
            <form class="grid gap-4" @submit.prevent="save">
              <div class="grid grid-cols-2 gap-4 max-[540px]:grid-cols-1">
                <label class="flex min-w-0 flex-col gap-2 text-xs font-bold text-[#65746d]">姓名
                  <input v-model="form.displayName" required maxlength="80" autocomplete="name" class="h-10 w-full rounded-[3px] border border-line px-3 text-xs text-ink outline-0 focus:border-[#8bd5b4]" />
                </label>
                <label class="flex min-w-0 flex-col gap-2 text-xs font-bold text-[#65746d]">代号
                  <input v-model="form.alias" required maxlength="80" class="h-10 w-full rounded-[3px] border border-line px-3 text-xs text-ink outline-0 focus:border-[#8bd5b4]" />
                </label>
              </div>
              <label class="flex min-w-0 flex-col gap-2 text-xs font-bold text-[#65746d]">联系方式
                <div class="flex gap-2">
                  <input v-model="form.contact" maxlength="80" autocomplete="tel" placeholder="添加联系方式" class="h-10 min-w-0 flex-1 rounded-[3px] border border-line px-3 text-xs text-ink outline-0 focus:border-[#8bd5b4]" />
                  <button v-if="form.contact" type="button" class="shrink-0 rounded border border-line px-3 text-xs text-muted hover:text-danger" title="清空联系方式" @click="form.contact = ''">清空</button>
                </div>
              </label>
              <p v-if="error" class="text-xs text-danger" role="alert">{{ error }}</p>
              <div class="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
                <button type="button" class="text-xs text-muted hover:text-ink disabled:opacity-50" :disabled="!changed || saving" @click="form = { displayName: profile.displayName, alias: profile.alias, contact: profile.contact }; error = ''">撤销修改</button>
                <button type="submit" class="h-9 rounded bg-ink px-5 text-xs font-bold text-[#dcffed] hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-50" :disabled="!changed || saving || changingPassword">{{ saving ? '保存中...' : '保存修改' }}</button>
              </div>
            </form>
          </section>

          <section class="border border-line bg-white p-6 shadow-[0_18px_40px_rgba(32,59,47,.06)]">
            <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]">SECURITY / 安全设置</p>
            <h3 class="mb-5 mt-1.5 text-base">修改密码</h3>
            <form class="grid gap-4" @submit.prevent="savePassword">
              <label class="flex flex-col gap-2 text-xs font-bold text-[#65746d]">当前密码
                <input v-model="password.current" type="password" autocomplete="current-password" class="h-10 w-full rounded-[3px] border border-line px-3 text-xs text-ink outline-0 focus:border-[#8bd5b4]" />
              </label>
              <div class="grid grid-cols-2 gap-4 max-[540px]:grid-cols-1">
                <label class="flex flex-col gap-2 text-xs font-bold text-[#65746d]">新密码
                  <input v-model="password.next"  type="password" autocomplete="new-password" class="h-10 w-full rounded-[3px] border border-line px-3 text-xs text-ink outline-0 focus:border-[#8bd5b4]" />
                </label>
                <label class="flex flex-col gap-2 text-xs font-bold text-[#65746d]">确认新密码
                  <input v-model="password.confirm" type="password" autocomplete="new-password" class="h-10 w-full rounded-[3px] border border-line px-3 text-xs text-ink outline-0 focus:border-[#8bd5b4]" />
                </label>
              </div>
              <p v-if="passwordError" class="text-xs text-danger" role="alert">{{ passwordError }}</p>
              <div class="flex justify-end border-t border-line pt-4">
                <button type="submit" class="h-9 rounded bg-ink px-5 text-xs font-bold text-[#dcffed] hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-50" :disabled="changingPassword || saving">{{ changingPassword ? '更新中...' : '更新密码' }}</button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
