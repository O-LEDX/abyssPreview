<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>
<template>
  <Transition name="toast">
    <div
      v-if="toast.visible"
      class="toast-root flex items-center gap-[9px] rounded-lg border border-line bg-white px-12 py-3 text-[12px] text-ink shadow-[0_18px_40px_rgba(32,59,47,.14)]"
      role="status"
      aria-live="polite"
    >
      <span class="h-[6px] w-[6px] shrink-0 rounded-full bg-green "></span>
      <span class=" text-md">{{ toast.message }}</span>
    </div>
  </Transition>
</template>
<style scoped>
.toast-root {
  position: fixed;
  top: 22px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 999;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
