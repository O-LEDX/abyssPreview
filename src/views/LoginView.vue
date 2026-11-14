<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRememberUPRStore } from '@/stores/rememberUPR'
import { useToastStore } from '@/stores/toast'
import Background from '@/components/Background.vue'
import Logo from '@/assets/logo.png'
import { ApiError } from '@/class/ApiError'

const router = useRouter();
const auth = useAuthStore();
const rememberUPRStore = useRememberUPRStore();
const toastStore = useToastStore();
const username = ref('');
const password = ref('');
const remember = ref(false);
const loading = ref(false);
const error = ref('')

onMounted(() => {
  if (rememberUPRStore.remember) {
    remember.value = rememberUPRStore.remember;
    username.value = rememberUPRStore.username;
    password.value = rememberUPRStore.password;
  }
})

onBeforeRouteLeave(async () => {
  if (auth.isLoggedIn && await auth.validToken()) {
    return;
  } else {
    return '/login';
  }
})

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await auth.signIn(username.value, password.value);
    if (remember.value) {
      rememberUPRStore.updateUPRFrom(remember.value, username.value, password.value);
    }
    await auth.validToken();
    router.push('/overview');
    toastStore.show('登录成功',2000);
  } catch (e) {
    if (e instanceof ApiError && e.step === 'signIn') {
      error.value = '登录失败，请检查账号或密码' 
    }
    if (e instanceof ApiError && e.step === 'validToken') {
      error.value = '登录过期/无效，请重新登录' 
    }
  } finally {
    loading.value = false 
  }
}
</script>
<template>
<main class="grid min-h-screen grid-cols-[1.25fr_.75fr] bg-[#f7faf8] max-[780px]:grid-cols-1 overflow-hidden">
  <section class="relative flex flex-col justify-center overflow-hidden bg-ink px-[clamp(40px,9vw,120px)] text-white after:absolute after:-bottom-40 after:-right-40 after:h-[440px] after:w-[440px] after:rounded-full after:border after:border-[rgba(104,205,164,.2)] after:shadow-[0_0_0_70px_rgba(104,205,164,.04),0_0_0_140px_rgba(104,205,164,.03)] max-[780px]:hidden overflow-hidden">
    <Background/>
    <div class="absolute animate-leftcontent-fade">
    <div class="relative z-[1] mb-[60px] grid h-[46px] w-[128px] place-items-center rounded-xl bg-ink text-[26px] font-extrabold text-[#d3ffe9] after:absolute after:-right-[3px] after:-top-[3px] after:h-[6px] after:w-[6px] after:rounded-full after:bg-green">
      <img :src="Logo" alt="LEDX" class="h-full w-full">
    </div>
    <p class="relative z-[1] text-[10px] font-bold tracking-[1.6px] text-[#90aa9e]">
      ABYSS / INTERNAL WORKSPACE
    </p>
    <h1 class="relative z-[1] my-5 text-[clamp(33px,4.1vw,61px)] leading-[1.18] tracking-[-2.6px]">事务委托处理<br><span class="text-[#8ee5bd]">内部工作站</span>
    </h1>
    <p class="relative z-[1] max-w-[410px] text-[13px] leading-[1.9] text-[#9aada5]">
      面向内部协作的事务指挥与人员调度台。
    </p>
    <div class="relative z-[1] mt-[72px] flex gap-[25px] font-mono text-[9px] tracking-[1.2px] text-[#62776d]">
      <span>SECURE WORKSPACE</span><span>2026 / 09 </span>
    </div>
    </div>
  </section>

  <section class="relative overflow-hidden grid place-items-center px-10 py-10 max-[780px]:px-[23px] max-[780px]:py-[30px]">
    <div class="absolute w-full max-w-[390px] animate-rightcontent-fade">
      <div class="mb-2 flex items-center gap-2.5 text-1.9 font-extrabold tracking-[1.8px] max-[780px]:mb-[65px]">
        <div class="relative grid h-10 w-10 place-items-center rounded-xl bg-ink text-[17px] font-extrabold text-[#d3ffe9] after:absolute after:-right-[3px] after:-top-[3px] after:h-[6px] after:w-[6px] after:rounded-full after:bg-green">
          A
        </div>
        <span>ABYSS SYSTEM</span>
      </div>
      <div>
        <p class="text-2 font-bold tracking-[1.6px] text-[#95a19d] italic"> 内部工作台 | Internal 
          WorkSpace</p>
        <h2 class="text-[29px] tracking-[-1px]"> 登录点 </h2>
      </div>
      <form class="mt-8" @submit.prevent="submit">
        <label class="mt-[17px] flex flex-col gap-2 text-[11px] font-bold text-[#718079] first:mt-0">
          账号
          <input
            v-model="username"
            autocomplete="username"
            placeholder="account"
            class="h-[45px] w-full rounded-[3px] border border-line bg-white px-3 text-xs text-ink outline-0 transition focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
        <label class="mt-[17px] flex flex-col gap-2 text-[11px] font-bold text-[#718079]">
          密码
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="password"
            class="h-[45px] w-full rounded-[3px] border border-line bg-white px-3 text-xs text-ink outline-0 transition focus:border-[#8bd5b4] focus:shadow-[0_0_0_3px_#ebf9f2]"
          />
        </label>
        <div v-if="error" class="my-2 text-[14px] text-[#ba5c58]"> {{ error }}</div>

        <!-- remeber区 -->
         <div class="flex items-center">
          <label class="mt-1 flex items-center gap-2 text-[14px] font-bold text-[#718079]"> 
            <input class="w-4 h-4 cursor-pointer accent-[#8ee5bd]" type="checkbox" id="remember" v-model="remember" />
            <span>记住账号密码</span>
          </label>
         </div>
        
        <button
          class="mt-[22px] inline-flex h-12 w-full items-center justify-center gap-[14px] rounded bg-ink px-[17px] text-[11px] font-bold text-[#dcffed] shadow-[0_8px_14px_rgba(31,42,40,.12)] transition-colors hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-55"
        :disabled="loading">
          <span>{{ loading ? '验证中…' : '进入工作站' }}</span><span>&gt;</span>
        </button>
      </form>
    </div>
  </section>

</main>
</template>
