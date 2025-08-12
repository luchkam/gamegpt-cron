// utils/contextStore.js
import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.PERSIST_DIR || '/var/data'
const FILE = path.join(DATA_DIR, 'context.json')

// гарантируем наличие папки
try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch {}

function readStore() {
  try {
    if (!fs.existsSync(FILE)) return {}
    const raw = fs.readFileSync(FILE, 'utf-8') || '{}'
    return JSON.parse(raw)
  } catch (e) {
    console.error('❌ contextStore read error:', e)
    return {}
  }
}

function writeStore(store) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(store, null, 2))
  } catch (e) {
    console.error('❌ contextStore write error:', e)
  }
}

function key(chatId, userId) {
  return `${chatId}:${userId}`
}

export function getHistory(chatId, userId) {
  const store = readStore()
  return store[key(chatId, userId)] || []
}

export function pushMessage(chatId, userId, role, content, max = 3) {
  const store = readStore()
  const k = key(chatId, userId)
  if (!store[k]) store[k] = []
  store[k].push({ role, content, ts: Date.now() })
  // оставляем только последние max сообщений
  if (store[k].length > max) {
    store[k] = store[k].slice(-max)
  }
  writeStore(store)
}

export function prune(hours = 2) {
  const store = readStore()
  const cutoff = Date.now() - hours * 3600000
  let changed = false
  for (const k of Object.keys(store)) {
    const before = store[k].length
    store[k] = store[k].filter(m => m.ts >= cutoff)
    if (store[k].length === 0) {
      delete store[k]
      changed = true
    } else if (store[k].length !== before) {
      changed = true
    }
  }
  if (changed) writeStore(store)
}
