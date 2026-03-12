<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createInitialState, changeDirection, step, Direction } from './game/snake'

const TICK_MS = 120
const CELL_SIZE = 20

const state = ref(createInitialState({ gridSize: 20 }))
let intervalId = null
let biteTimeoutId = null

const gridSize = computed(() => state.value.gridSize)
const score = computed(() => state.value.score)
const status = computed(() => state.value.status)
const bite = ref(false)
const themes = [
  { id: 'neon', label: '霓虹街机' },
  { id: 'mist', label: '晨雾森林' },
  { id: 'citrus', label: '柑橘日光' }
]
const theme = ref('neon')

const boardStyle = computed(() => ({
  '--grid-size': gridSize.value,
  '--cell-size': `${CELL_SIZE}px`
}))

const cellStyle = (pos) => ({
  gridColumn: pos.x + 1,
  gridRow: pos.y + 1
})

const isPlaying = computed(() => status.value === 'playing')
const isPaused = computed(() => status.value === 'paused')
const isDead = computed(() => status.value === 'dead')

const foodVisible = computed(() => state.value.food.x >= 0 && state.value.food.y >= 0)
const headDirection = computed(() => {
  const dir = state.value.dir
  if (dir === Direction.up) return 'up'
  if (dir === Direction.down) return 'down'
  if (dir === Direction.left) return 'left'
  return 'right'
})

function setDirection(nextDir) {
  state.value = changeDirection(state.value, nextDir)
}

function togglePause() {
  if (isDead.value) return
  state.value = {
    ...state.value,
    status: isPaused.value ? 'playing' : 'paused'
  }
}

function restartGame() {
  state.value = createInitialState({ gridSize: state.value.gridSize })
}

function handleKey(event) {
  const key = event.key.toLowerCase()
  const mapping = {
    arrowup: Direction.up,
    w: Direction.up,
    arrowdown: Direction.down,
    s: Direction.down,
    arrowleft: Direction.left,
    a: Direction.left,
    arrowright: Direction.right,
    d: Direction.right
  }

  if (mapping[key]) {
    event.preventDefault()
    setDirection(mapping[key])
    return
  }

  if (key === ' ') {
    event.preventDefault()
    togglePause()
  }

  if (key === 'r' || key === 'enter') {
    if (isDead.value) {
      event.preventDefault()
      restartGame()
    }
  }
}

function tick() {
  state.value = step(state.value)
}

function startLoop() {
  if (intervalId) return
  intervalId = setInterval(tick, TICK_MS)
}

function stopLoop() {
  if (!intervalId) return
  clearInterval(intervalId)
  intervalId = null
}

onMounted(() => {
  window.addEventListener('keydown', handleKey, { passive: false })
  startLoop()
  const stored = window.localStorage.getItem('snake-theme')
  if (stored && themes.some((item) => item.id === stored)) {
    theme.value = stored
  }
  document.body.dataset.theme = theme.value
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
  stopLoop()
  if (biteTimeoutId) {
    clearTimeout(biteTimeoutId)
  }
})

watch(score, (next, prev) => {
  if (next <= prev) return
  bite.value = true
  if (biteTimeoutId) clearTimeout(biteTimeoutId)
  biteTimeoutId = setTimeout(() => {
    bite.value = false
  }, 200)
})

watch(theme, (next) => {
  window.localStorage.setItem('snake-theme', next)
  document.body.dataset.theme = next
})
</script>

<template>
  <main class="snake-app">
    <header class="snake-header">
      <div>
        <p class="eyebrow">经典贪吃蛇</p>
        <h1>稳住节奏，别撞墙。</h1>
      </div>
      <div class="score-panel">
        <div class="score">
          <span>得分</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="status" :data-status="status">
          <span>{{ isDead ? '游戏结束' : isPaused ? '暂停中' : '进行中' }}</span>
        </div>
      </div>
    </header>

    <section class="board-wrapper">
      <div class="board" :class="{ bite }" :style="boardStyle">
        <div
          v-for="(segment, index) in state.snake"
          :key="`snake-${index}`"
          class="cell snake"
          :class="[
            { head: index === 0 },
            index === 0 ? `dir-${headDirection}` : `segment-${index % 3}`
          ]"
          :style="cellStyle(segment)"
        ></div>
        <div
          v-if="foodVisible"
          class="cell food"
          :style="cellStyle(state.food)"
        ></div>
      </div>
    </section>

    <section class="controls">
      <div class="control-buttons">
        <button type="button" @click="togglePause">
          {{ isPaused ? '继续' : '暂停' }}
        </button>
        <button type="button" @click="restartGame">
          重新开始
        </button>
      </div>
      <div class="theme-row">
        <span class="theme-label">主题</span>
        <div class="theme-buttons">
          <button
            v-for="item in themes"
            :key="item.id"
            type="button"
            class="theme-button"
            :class="{ active: theme === item.id }"
            @click="theme = item.id"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
      <p class="hint">方向键 / WASD 移动，空格暂停，游戏结束后按 R 或 Enter 重新开始。</p>
    </section>

    <section class="dpad">
      <button class="pad" type="button" @click="setDirection(Direction.up)">上</button>
      <div class="pad-row">
        <button class="pad" type="button" @click="setDirection(Direction.left)">左</button>
        <button class="pad" type="button" @click="setDirection(Direction.down)">下</button>
        <button class="pad" type="button" @click="setDirection(Direction.right)">右</button>
      </div>
    </section>
  </main>
</template>
