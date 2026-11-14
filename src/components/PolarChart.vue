<script setup lang="ts">import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Chart } from '@antv/g2'
const props = defineProps<{ data:any[] }>()
const el = ref<HTMLElement>();
let chart: Chart | undefined
onMounted(() => {
    if (!el.value) return;
    chart = new Chart({
        container: el.value,
        autoFit:true,
        height:250,
        padding: [12, 20, 42, 40] as any
      });

    chart.interval()        
      .data(props.data)
      .encode("key", "label")
      .encode({
        x:'label',
        y:'num',
        color:'label'
      })
      .scale({
        y:{ nice:true },
        color:{
          range:['#d8dedb','#a8d9c2','#68cda4','#d76e68']
        }
      })
      .axis({
        x:{ title:false, tick:false },
        y:{ title:false, grid:true }
      })
      .animate("update",{duration:1000})
      .tooltip({
        items:[
          {
            name:'status',
            channel:'y',
            valueFormatter:(v:number)=>`${v} 项`
          }
        ]
      })
    chart.render()
  })
onBeforeUnmount(() => chart?.destroy())
</script>
<template>
<div ref="el" class="mt-2.5 h-[250px]"></div>
</template>
