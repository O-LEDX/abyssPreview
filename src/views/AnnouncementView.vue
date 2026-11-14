<script setup lang="ts">import { computed } from 'vue'
import { announcements, type Announcement, type AnnouncementCategory } from '@/static/announcements'

const monthGroups = computed(() => {
    const groups = new Map<string, Announcement[]>()
    for (const item of announcements) {
      const key = item.date.slice(0, 7)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(item)
    }
    return [...groups.entries()]
  })

const monthLabel = (key: string) => {
    const [year, month] = key.split('-')
    return `${year}年${Number(month)}月`
  }

const categoryMeta: Record<AnnouncementCategory, { label: string; className: string }> = {
    announcement: { label: '公告', className: 'bg-green-soft text-green-dark' },
    versionUpdate: { label: '版本更新', className: 'bg-[#eef1fa] text-[#6c79b0]' },
    important: { label: '重要事项', className: 'bg-[#fff0ef] text-[#ba5c58]' },
  }
</script>
<template>
<div class="flex flex-col gap-[25px]">
  <div class="flex items-end justify-between gap-5 max-[780px]:flex-col max-[780px]:items-start">
    <div>
      <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> NOTICE CENTER / ANNOUNCEMENTS</p>
      <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] max-[780px]:text-[25px]"> 公告通知</h2>
      <p class="text-xs leading-[1.65] text-muted"> 记录版本更新与重要事项，随版本发布同步更新。</p>
    </div>
    <div class="text-right max-[780px]:text-left">
      <strong class="block text-[34px] leading-[1.25] tracking-[-1.5px]">{{ announcements.length }}</strong>
      <span class="text-[10px] text-[#9ca8a3]">累计公告</span>
    </div>
  </div>
  <div class="flex flex-col gap-[34px]">
    <section v-for="[month, items] in monthGroups" :key="month">
      <div class="mb-[14px] flex items-center gap-3">
        <h3 class="text-[13px] font-bold tracking-[1px]">{{ monthLabel(month) }}</h3>
        <span class="text-[10px] text-[#9ca8a3]">{{ items.length }} 条</span>
        <i class="h-px flex-1 bg-line"></i>
      </div>
      <div class="relative ml-[9px] flex flex-col gap-[18px] border-l border-line pl-[26px]">
        <article v-for="item in items" :key="item.id" class="relative border border-line bg-white p-[19px] shadow-[0_18px_40px_rgba(32,59,47,.06)]">
          <i class="absolute -left-[33px] top-[24px] h-[9px] w-[9px] rounded-full border-2 border-white bg-green shadow-[0_0_0_3px_#d3efe1]"></i>
          <div class="flex items-center gap-2.5">
            <span class="rounded-[3px] px-2 py-[5px] text-[10px] font-bold" :class="categoryMeta[item.category].className">{{ categoryMeta[item.category].label }}</span>
            <span v-if="item.version" class="font-mono text-[10px] font-bold text-[#9aa7a1]">{{ item.version }}</span>
            <span class="ml-auto text-[10px] text-[#9ca8a3]">{{ item.date }}</span>
          </div>
          <h4 class="mb-2 mt-3 text-[15px] tracking-[-0.2px]">{{ item.title }}</h4>
          <p v-for="(line, index) in item.content" :key="index" class="m-0 mb-1.5 text-xs leading-[1.7] text-muted">{{ line }}</p>
        </article>
      </div>
    </section>
  </div>
</div>
</template>