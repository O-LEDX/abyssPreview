import { defineStore } from 'pinia'
import { ref } from 'vue'

let timer: ReturnType<typeof setTimeout> | undefined

export const useToastStore = defineStore('toast', () => {
  const message = ref('')
  const visible = ref(false)

  function show(text: string, duration = 2500) {
    if (timer) clearTimeout(timer)
    message.value = text
    visible.value = true
    timer = setTimeout(() => {
      visible.value = false
      timer = undefined
    }, duration)
  }

  function hide() {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    visible.value = false
  }

  return { message, visible, show, hide }
})
