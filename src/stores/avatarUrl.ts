import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAvatarUrlStore = defineStore('avatarUrl', ()=> {
  const avatarUrl = ref()

  function setAvatarUrl(url: string) {
    avatarUrl.value = url
  }

  return { avatarUrl, setAvatarUrl }
})
