<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createInitialState, changeDirection, step, Direction } from './game/snake'

const TICK_MS = 120
const CELL_SIZE = 20

const state = ref(createInitialState({ gridSize: 20 }))
let intervalId = null

const gridSize = computed(() => state.value.gridSize)
const score = computed(() => state.value.score)
const status = computed(() => state.value.status)

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
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
  stopLoop()
})
</script>

<template>
  <main class="snake-app">
    <header class="snake-header">
      <div>
        <p class="eyebrow">Classic Snake</p>
        <h1>Stay on the grid.</h1>
      </div>
      <div class="score-panel">
        <div class="score">
          <span>Score</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="status" :data-status="status">
          <span>{{ isDead ? 'Game over' : isPaused ? 'Paused' : 'Playing' }}</span>
        </div>
      </div>
    </header>

    <section class="board-wrapper">
      <div class="board" :style="boardStyle">
        <div
          v-for="(segment, index) in state.snake"
          :key="`snake-${index}`"
          class="cell snake"
          :class="{ head: index === 0 }"
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
          {{ isPaused ? 'Resume' : 'Pause' }}
        </button>
        <button type="button" @click="restartGame">
          Restart
        </button>
      </div>
      <p class="hint">Arrow keys / WASD to move. Space to pause. R or Enter to restart after game over.</p>
    </section>

    <section class="dpad">
      <button class="pad" type="button" @click="setDirection(Direction.up)">Up</button>
      <div class="pad-row">
        <button class="pad" type="button" @click="setDirection(Direction.left)">Left</button>
        <button class="pad" type="button" @click="setDirection(Direction.down)">Down</button>
        <button class="pad" type="button" @click="setDirection(Direction.right)">Right</button>
      </div>
    </section>
  </main>
</template>
