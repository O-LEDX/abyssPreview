<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface P {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  baseAlpha: number
}

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let particles: P[] = []
let rafId = 0
let w = 0
let h = 0
let dpr = 1
const mouse = { x: -9999, y: -9999, active: false }
const click = { x: -9999, y: -9999, t: 0 }
const CLICK_RADIUS = 180
const CLICK_FORCE = 1.2
const CONNECT_DIST = 130

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function createParticle(): P {
  return {
    x: rand(0, w),
    y: rand(0, h),
    vx: rand(-0.35, 0.35),
    vy: rand(-0.35, 0.35),
    r: rand(1, 2.6),
    baseAlpha: rand(0.5, 0.7),
  }
}

function resize() {
  if (!canvas.value) return
  dpr = window.devicePixelRatio || 1
  w = canvas.value.clientWidth
  h = canvas.value.clientHeight
  canvas.value.width = w * dpr
  canvas.value.height = h * dpr
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
  // 适配粒子数量
  const target = Math.min(110, Math.floor((w * h) / 14000))
  while (particles.length < target) particles.push(createParticle())
  while (particles.length > target) particles.pop()
}

function step() {
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)

  const now = performance.now()
  const clickAge = now - click.t
  const clickAlive = clickAge < 600
  const clickFalloff = clickAlive ? 1 - clickAge / 600 : 0

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]

    // 点击冲击波：对半径内粒子施加径向推力
    if (clickAlive && click.x > -9000) {
      const dx = p.x - click.x
      const dy = p.y - click.y
      const d2 = dx * dx + dy * dy
      if (d2 < CLICK_RADIUS * CLICK_RADIUS && d2 > 0.01) {
        const d = Math.sqrt(d2)
        const strength = (1 - d / CLICK_RADIUS) * CLICK_FORCE * clickFalloff
        p.vx += (dx / d) * strength
        p.vy += (dy / d) * strength
      }
    }

    // 鼠标轻微排斥（悬停时）
    if (mouse.active) {
      const dx = p.x - mouse.x
      const dy = p.y - mouse.y
      const d2 = dx * dx + dy * dy
      if (d2 < 6400 && d2 > 0.01) {
        const d = Math.sqrt(d2)
        const f = (1 - d / 80) * 0.08
        p.vx += (dx / d) * f
        p.vy += (dy / d) * f
      }
    }

    // 阻尼，防止冲击后永动
    p.vx *= 0.985
    p.vy *= 0.985

    // 限速
    const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    if (sp > 3.2) {
      p.vx = (p.vx / sp) * 3.2
      p.vy = (p.vy / sp) * 3.2
    }

    p.x += p.vx
    p.y += p.vy

    // 边界环绕
    if (p.x < -10) p.x = w + 10
    if (p.x > w + 10) p.x = -10
    if (p.y < -10) p.y = h + 10
    if (p.y > h + 10) p.y = -10

    // 绘制粒子
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(24, 220, 142, ${p.baseAlpha})`
    ctx.fill()
  }

  // 连线
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i]
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const d2 = dx * dx + dy * dy
      if (d2 < CONNECT_DIST * CONNECT_DIST) {
        const alpha = (1 - Math.sqrt(d2) / CONNECT_DIST) * 0.8
        ctx.strokeStyle = `rgba(48, 127, 149, ${alpha})`
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
  }

  // 点击涟漪
  if (clickAlive) {
    const r = (1 - clickFalloff) * CLICK_RADIUS
    ctx.beginPath()
    ctx.arc(click.x, click.y, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(104, 205, 164, ${clickFalloff * 0.5})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  rafId = requestAnimationFrame(step)
}

function onMouseMove(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
  mouse.active = true
}

function onMouseLeave() {
  mouse.active = false
  mouse.x = -9999
  mouse.y = -9999
}

function onClick(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  click.x = e.clientX - rect.left
  click.y = e.clientY - rect.top
  click.t = performance.now()
}

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  if (!ctx) return
  resize()
  rafId = requestAnimationFrame(step)
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <canvas
    ref="canvas"
    class="absolute inset-0 h-full w-full"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @click="onClick"
  />
</template>
