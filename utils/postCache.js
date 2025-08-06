import fs from 'fs'
const FILE = './utils/postStore.json'

export function savePost(id, text) {
  const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf-8')) : {}
  data[id] = text
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

export function getPost(id) {
  const data = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf-8')) : {}
  return data[id] || ''
}
