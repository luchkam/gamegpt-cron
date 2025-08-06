import fs from 'fs'
import path from 'path'

const path = require('path')
const FILE_PATH = path.resolve('./utils/posts.json')

// Загружаем посты из файла (если есть)
let posts = {}
try {
  if (fs.existsSync(FILE_PATH)) {
    const raw = fs.readFileSync(FILE_PATH, 'utf-8')
    posts = JSON.parse(raw)
    console.log('📚 Загружены посты из posts.json')
  }
} catch (e) {
  console.error('❌ Ошибка чтения posts.json:', e)
}

export function savePost(postId, text) {
  const posts = getPosts()
  posts[postId] = text

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8')
    console.log('✅ posts.json обновлён успешно')
  } catch (err) {
    console.error('❌ Ошибка записи posts.json:', err)
  }
}

export function getPostText(postId) {
  return posts[postId] || ''
}
