import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface RememberUPRState {
  remember: boolean;
  username: string;
  password: string;
}

export const useRememberUPRStore = defineStore('rememberUPR', () => {
  const remember = ref(false)
  const username = ref('')
  const password = ref('')

  function formUPRToLocal() {
    const form = {
      remember: remember.value,
      username: username.value,
      password: password.value
    }
    localStorage.setItem('formUPR', JSON.stringify(form))
  }

  function updateUPRFrom(re: boolean, un: string, pwd: string) {
    remember.value = re
    username.value = un
    password.value = pwd
    formUPRToLocal()
  }

  return { remember, username, password, formUPRToLocal, updateUPRFrom }
})