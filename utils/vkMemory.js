import fs from 'fs'
import path from 'path'

// На Render можно писать только в /tmp — иначе writeFileSync может не работать
const FILE_PATH = path.resolve('/tmp/posts.json')

// Глобальная переменная, чтобы не терять загруженные посты
let posts = {}

try {
  if (fs.existsSync(FILE_PATH)) {
    const raw = fs.readFileSync(FILE_PATH, 'utf-8')
    posts = JSON.parse(raw)
    console.log('📚 Загружены посты из posts.json')
  } else {
    console.log('📁 posts.json ещё не существует — будет создан при первом посте')
  }
} catch (e) {
  console.error('❌ Ошибка чтения posts.json:', e)
}

export function savePost(postId, text) {
  posts[postId] = text

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8')
    console.log(`💾 Пост ${postId} сохранён в posts.json`)
  } catch (err) {
    console.error('❌ Ошибка записи posts.json:', err)
  }
}

export function getPostText(postId) {
  return posts[postId] || ''
}
