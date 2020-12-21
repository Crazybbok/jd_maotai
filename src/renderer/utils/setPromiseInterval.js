const runningTasks = new Set()
const runningHandlers = new Map()

let id = 0

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run(id, handler, interval = 0) {
  while (runningTasks.has(id)) {
    const startTime = new Date().getTime()
    runningHandlers.set(id, handler())
    try {
      await runningHandlers.get(id)
    } catch (e) {
      throw new Error(e)
    } finally {
      runningHandlers.delete(id)
    }
    await delay(interval - new Date().getTime() + startTime)
  }
}

export async function clearPromiseInterval(intervalId) {
  if (typeof intervalId === 'number' && runningTasks.has(intervalId)) {
    if (runningHandlers.has(intervalId)) {
      await runningHandlers.get(intervalId)
    }
    runningTasks.delete(intervalId)
  }
}

export default function setPromiseInterval(handler, interval) {
  id += 1
  runningTasks.add(id)
  run(id, handler, interval)
  return id
}
