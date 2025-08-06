import fs from 'fs'
import path from 'path'

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
  posts[postId] = text
  fs.writeFileSync(FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8')
  console.log('💾 Пост сохранён:', postId)
}

export function getPostText(postId) {
  return posts[postId] || ''
}
