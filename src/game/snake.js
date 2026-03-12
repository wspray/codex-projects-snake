const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
}

const OPPOSITES = new Map([
  [DIRECTIONS.up, DIRECTIONS.down],
  [DIRECTIONS.down, DIRECTIONS.up],
  [DIRECTIONS.left, DIRECTIONS.right],
  [DIRECTIONS.right, DIRECTIONS.left]
])

function samePosition(a, b) {
  return a.x === b.x && a.y === b.y
}

function toKey(pos) {
  return `${pos.x},${pos.y}`
}

function randomInt(max, rng) {
  return Math.floor(rng() * max)
}

export function createInitialState({ gridSize = 20, rng = Math.random } = {}) {
  const start = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }
  const snake = [start, { x: start.x - 1, y: start.y }, { x: start.x - 2, y: start.y }]
  const dir = DIRECTIONS.right
  const food = spawnFood({ gridSize, snake }, rng)

  return {
    gridSize,
    snake,
    dir,
    pendingDir: dir,
    food,
    score: 0,
    status: 'playing'
  }
}

export function changeDirection(state, nextDir) {
  if (!nextDir) return state
  if (OPPOSITES.get(nextDir) === state.dir) return state
  return {
    ...state,
    pendingDir: nextDir
  }
}

export function step(state, rng = Math.random) {
  if (state.status !== 'playing') return state

  const dir = state.pendingDir || state.dir
  const head = state.snake[0]
  const nextHead = { x: head.x + dir.x, y: head.y + dir.y }

  const outOfBounds =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize

  const willGrow = samePosition(nextHead, state.food)

  let hitSelf = false
  for (let i = 0; i < state.snake.length; i += 1) {
    if (!willGrow && i === state.snake.length - 1) continue
    if (samePosition(state.snake[i], nextHead)) {
      hitSelf = true
      break
    }
  }

  if (outOfBounds || hitSelf) {
    return {
      ...state,
      status: 'dead',
      dir,
      pendingDir: dir
    }
  }

  const nextSnake = willGrow
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)]

  const nextFood = willGrow
    ? spawnFood({ gridSize: state.gridSize, snake: nextSnake }, rng)
    : state.food

  return {
    ...state,
    snake: nextSnake,
    food: nextFood,
    dir,
    pendingDir: dir,
    score: willGrow ? state.score + 1 : state.score
  }
}

export function spawnFood({ gridSize, snake }, rng = Math.random) {
  const occupied = new Set(snake.map(toKey))
  const maxCells = gridSize * gridSize
  if (occupied.size >= maxCells) {
    return { x: -1, y: -1 }
  }

  let food = { x: randomInt(gridSize, rng), y: randomInt(gridSize, rng) }
  let attempts = 0
  while (occupied.has(toKey(food)) && attempts < maxCells) {
    food = { x: randomInt(gridSize, rng), y: randomInt(gridSize, rng) }
    attempts += 1
  }
  return food
}

export const Direction = DIRECTIONS
