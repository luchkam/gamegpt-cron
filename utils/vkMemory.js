import fs from 'fs'
import path from 'path'

const FILE_PATH = path.resolve('posts.json') // Теперь сохраняется рядом с кодом

// Проверяем: если файла нет — создаём пустой JSON
if (!fs.existsSync(FILE_PATH)) {
  try {
    fs.writeFileSync(FILE_PATH, '{}', 'utf-8')
    console.log('🆕 posts.json создан в проекте')
  } catch (err) {
    console.error('❌ Не удалось создать posts.json:', err)
  }
}

// Проверка прав на чтение/запись
fs.access(FILE_PATH, fs.constants.R_OK | fs.constants.W_OK, (err) => {
  if (err) {
    console.error('🚫 Нет доступа к posts.json:', err)
  } else {
    console.log('✅ Есть доступ к posts.json')
  }
})

// Получаем текущие посты из файла
function getPosts() {
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    console.log('📚 Загружены посты из posts.json:', parsed)
    return parsed
  } catch (e) {
    console.error('❌ Ошибка чтения posts.json:', e)
    return {}
  }
}

// Сохраняем новый пост
export function savePost(postId, text) {
  const posts = getPosts()
  posts[postId] = text

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(posts, null, 2), 'utf-8')
    console.log(`✅ Пост ${postId} сохранён в posts.json`)
  } catch (err) {
    console.error('❌ Ошибка записи posts.json:', err)
  }
}

// Получаем текст по postId
export function getPostText(postId) {
  const posts = getPosts()
  const text = posts[postId]
  console.log('📥 Получен текст поста для id', postId, ':', text)
  return text || ''
}
