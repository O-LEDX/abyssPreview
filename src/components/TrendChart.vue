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

    chart.line()
      .data(props.data)
      .encode("key", "label")
      .encode({
        x:'label',
        y:'created',
        color:'#68cda4'
      })
      .scale({
        y:{ nice:true }
      })
      .axis({
        x:{ title:false, tick:false },
        y:{ title:false, grid:true }
      })
      .animate("update",{duration:300})
      .tooltip({
        items:[
          {
            name:'created',
            channel:'y',
            valueFormatter:(v:number)=>`${v} 项`
          }
        ]
      })

      chart.line()
      .data(props.data)
      .encode("key", "label")
      .encode({
        x:'label',
        y:'completed',
        color:'#f59e0b'
      })
      .scale({
        y:{ nice:true }
      })
      .axis({
        x:{ title:false, tick:false },
        y:{ title:false, grid:true }
      })
      .animate("update",{duration:300})
      .tooltip({
        items:[
          {
            name:'completed',
            channel:'y',
            valueFormatter:(v:number)=>`${v} 项`
          }
        ]
      })

      if(props.data.length>15) {
        chart.axis('x', { labelFilter: (_d:any, i:number) => i % 2 === 0 })
      }
      

    chart.render()
  })
onBeforeUnmount(() => chart?.destroy())
</script>
<template>
<div ref="el" class="mt-2.5 h-[250px]"></div>
</template>
