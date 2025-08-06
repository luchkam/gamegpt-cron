import fs from 'fs'
import path from 'path'

const FILE_PATH = '/tmp/posts.json'

// Получаем текущие посты из файла
function getPosts() {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      console.log('📚 Загружены посты из posts.json:', parsed)
      return parsed
    }
  } catch (e) {
    console.error('❌ Ошибка чтения posts.json:', e)
  }
  return {}
}

// Сохраняем новый пост
export function savePost(postId, text) {
  const posts = getPosts()
  posts[postId] = text

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8')
    console.log(`✅ Пост ${postId} сохранён в /tmp/posts.json`)
  } catch (err) {
    console.error('❌ Ошибка записи posts.json:', err)
  }
}

// Получаем текст по postId
export function getPostText(postId) {
  const posts = getPosts()
  const text = posts[postId]
  console.log('📥 Получен текст поста для id', postId, ':', text) // ← эту строку ВСТАВЛЯЕШЬ СЮДА
  return text || ''
}
