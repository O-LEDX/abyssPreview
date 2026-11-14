<script setup lang="ts">import { computed, onMounted, ref } from 'vue'
import { getApiInfo } from '@/api/apis'
import { baseUrl } from '@/api/request'
const info=ref<any>({
    title:'AbyssSystem API',
    version:'1.0.0',
    baseUrl:'/api',
    groups:[],
    endpoints:[]
  });
const swaggerView=ref(false)
const selectedTag=ref('全部')
onMounted(async()=>info.value=await getApiInfo())
const tags=computed(()=>['全部',...info.value.groups.map((g:any)=>g.name)])
const endpoints=computed(()=>selectedTag.value==='全部'?info.value.endpoints : info.value.endpoints.filter((e:any)=>e.tag===selectedTag.value))
const methodClass=(m:string)=>m.toLowerCase()
</script>
<template>
<div class="flex flex-col gap-[25px]">
  <div class="flex items-end justify-between gap-5 max-[780px]:flex-col max-[780px]:items-start">
    <div>
      <p class="text-[10px] font-bold tracking-[1.6px] text-[#95a19d]"> API CATALOG / OPENAPI</p>
      <h2 class="my-2 mb-[5px] text-[29px] tracking-[-1px] max-[780px]:text-[25px]"> 接口管理</h2>
      <p class="text-xs leading-[1.65] text-muted"> Swagger/OpenAPI 接口目录，面向内部联调与权限核验。</p>
    </div>
    <button @click="swaggerView=!swaggerView" class="inline-flex h-9 items-center justify-center gap-[14px] rounded border border-line bg-white px-[17px] text-[11px] font-bold text-[#64736c] transition-colors hover:border-[#afd9c3] hover:text-green-dark">切换 Swagger UI ↗</button>
  </div>
  <div class="grid grid-cols-[1.7fr_1fr_1.3fr_1fr] items-center gap-5 bg-ink px-6 py-[21px] text-white max-[780px]:grid-cols-2">
    <div class="border-r border-[#455450] pr-[15px] max-[780px]:border-r-0">
      <span class="mb-2 block text-[10px] font-bold tracking-[1.6px] text-[#9bb0a7]">SERVICE</span><strong class="text-sm">{{info.title}}</strong>
    </div>
    <div class="border-r border-[#455450] pr-[15px] max-[780px]:border-r-0">
      <span class="mb-2 block text-[10px] font-bold tracking-[1.6px] text-[#9bb0a7]">VERSION</span><strong class="text-sm">{{info.version}}</strong>
    </div>
    <div class="border-r border-[#455450] pr-[15px] max-[780px]:hidden">
      <span class="mb-2 block text-[10px] font-bold tracking-[1.6px] text-[#9bb0a7]">BASE URL</span><code class="font-mono text-[10px] text-[#cbf4de]">{{info.baseUrl}}</code>
    </div>
    <div class="flex items-center gap-2.5 text-[11px] text-[#bdebd3] max-[780px]:hidden">
      <i class="h-[7px] w-[7px] rounded-full bg-green shadow-[0_0_0_4px_rgba(104,205,164,.18)]"></i>服务已连接
    </div>
  </div>
  <section v-show="!swaggerView" class="w-full h-full overflow-auto"> 
    <iframe :src="baseUrl+'/swagger-ui.html'" frameborder="0" allowfullscreen class="w-full h-200">

    </iframe>
  </section>
  <section v-show="swaggerView" class="border border-line bg-white shadow-[0_18px_40px_rgba(32,59,47,.06)]">
    <div class="flex items-center gap-1 overflow-auto border-b border-line px-5 py-[15px]">
      <button
        v-for="tag in tags"
        :key="tag"
        class="whitespace-nowrap border-0 bg-transparent px-3 py-[9px] text-[11px] text-[#8b9792] hover:text-green-dark"
        :class="{'bg-green-soft font-bold text-green-dark':selectedTag===tag}"
      @click="selectedTag=tag">
        {{tag}}<span v-if="tag!=='全部'" class="ml-[7px] text-[#b0bbb6]">{{info.groups.find((g:any)=>g.name===tag)?.count}}</span>
      </button>
      <div class="flex-1 text-right text-[11px] text-[#8b9792] max-[780px]:hidden">共{{endpoints.length}}个接口，共{{info.groups.length}}个分组</div>
    </div>
    <div>
      <div
        v-for="endpoint in endpoints"
        :key="endpoint.method+endpoint.path"
      class="grid grid-cols-[68px_minmax(220px,1fr)_1.6fr_100px_55px] items-center gap-4 border-b border-[#edf2ef] px-5 py-[17px] text-[11px] last:border-0 max-[780px]:grid-cols-[55px_1fr_48px]">
        <span class="font-mono text-[10px] font-bold" :class="{'text-[#358c68]':methodClass(endpoint.method)==='get','text-[#b17c2d]':methodClass(endpoint.method)==='post','text-[#6c79b0]':methodClass(endpoint.method)==='put'}">{{endpoint.method}}</span>
        <code class="font-mono text-[10px] text-[#708078]">{{endpoint.path}}</code>
        <strong class="text-[11px] max-[780px]:hidden">{{endpoint.summary}}</strong>
        <span class="text-[10px] text-[#9ca8a3] max-[780px]:hidden">{{endpoint.tag}}</span>
        <button class="text-[11px] font-bold text-green-dark"> 详情 ↗</button>
      </div>
    </div>
  </section>
</div>
</template>
