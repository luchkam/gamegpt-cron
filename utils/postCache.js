import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FILE = path.resolve(__dirname, 'postStore.json')

export function savePost(id, text) {
  const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf-8')) : {}
  data[id] = text
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

export function getPost(id) {
  const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf-8')) : {}
  return data[id] || ''
}
