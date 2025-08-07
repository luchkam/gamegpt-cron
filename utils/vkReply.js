import axios from 'axios'
import { getReplyFromAssistant } from './openai.js'
import { savePost, getPostText } from './vkMemory.js'

const ACCESS_TOKEN = process.env.VK_ACCESS_TOKEN
const GROUP_ID = parseInt(process.env.VK_GROUP_ID)

const handledComments = new Set()

export async function handleVKCallback(data) {
  console.log('📩 VK Callback получен:', JSON.stringify(data, null, 2))

  const type = data.type

  if (type === 'wall_reply_new') {
    console.log('💬 Обнаружен комментарий на стене (wall_reply_new)')

    const comment = data.object
    const fromId = comment.from_id
    const postId = comment.post_id
    const ownerId = comment.owner_id
    const replyToUser = comment.reply_to_user
    const text = comment.text?.trim()

    if (fromId === -GROUP_ID || !text) return

    const isPostFromCommunity = ownerId === -GROUP_ID
    const isReplyToAssistant = replyToUser === -GROUP_ID

    const commentsCheck = await axios.get('https://api.vk.com/method/wall.getComments', {
      params: {
        owner_id: ownerId,
        post_id: postId,
        comment_id: comment.id,
        access_token: ACCESS_TOKEN,
        v: '5.199',
        thread_items_count: 10,
      },
    })

    const replies = commentsCheck.data?.response?.items || []
    const alreadyReplied = replies.some((c) => c.from_id === -GROUP_ID)

    console.log('🔁 Проверка на дублирование:', alreadyReplied)
    if (alreadyReplied) {
      console.log('⏭ Ответ уже был — не дублируем')
      return
    }

    console.log('🔍 Проверка условий:')
    console.log('ownerId =', ownerId)
    console.log('isPostFromCommunity =', isPostFromCommunity)
    console.log('replyToUser =', replyToUser)
    console.log('isReplyToAssistant =', isReplyToAssistant)

    if (isPostFromCommunity || isReplyToAssistant) {
      const originalPostText = getPostText(postId)
      const context = originalPostText ? [originalPostText, text] : [text]
      console.log('🧠 Контекст для Assistant:', context)

      if (handledComments.has(comment.id)) {
        console.log('⛔ Этот комментарий уже обрабатывался в этой сессии — пропускаем')
        return
      }
      handledComments.add(comment.id)

      const reply = await getReplyFromAssistant(context)

      await axios.get('https://api.vk.com/method/wall.createComment', {
        params: {
          owner_id: ownerId,
          post_id: postId,
          message: reply,
          from_group: 1,
          reply_to_comment: comment.id,
          access_token: ACCESS_TOKEN,
          v: '5.199',
        },
      })

      console.log('✅ Ответ ассистента отправлен в комментарии')
    } else {
      console.log('⏭ Комментарий проигнорирован (не к посту бота и не ответ ассистенту)')
    }
  }

  // 🆕 Логика: бот комментирует посты от других участников
  if (
    type === 'wall_post_new' &&
    data.object.owner_id === -GROUP_ID && // Пост размещён на стене сообщества
    data.object.from_id !== -GROUP_ID // Автор — не само сообщество
  ) {
    const post = data.object
    const postId = post.id
    const ownerId = post.owner_id
    const text = post.text?.trim()

    if (!text) {
      console.log('⚠️ Пост без текста — пропускаем')
      return
    }

    console.log('💬 Новый пост от участника на стене сообщества:', postId)

    const context = [text]
    const reply = await getReplyFromAssistant(context)

    try {
      await axios.get('https://api.vk.com/method/wall.createComment', {
        params: {
          owner_id: ownerId,
          post_id: postId,
          message: reply,
          from_group: 1,
          access_token: ACCESS_TOKEN,
          v: '5.199',
        },
      })

      console.log('🤖 Бот оставил комментарий под чужим постом:', postId)
    } catch (error) {
      console.error('❌ Ошибка при попытке комментирования чужого поста:', error.response?.data || error.message)
    }
  }

  if (type === 'wall_post_new') {
    console.log('📝 Обнаружен новый пост на стене (wall_post_new)')

    const post = data.object
    const fromId = post.from_id
    const postId = post.id
    const ownerId = post.owner_id
    const text = post.text?.trim()

    if (!text) return

    console.log('🖊 Сохраняем пост:', postId, '→', text)
    savePost(postId, text)
    console.log('💾 Пост сохранён локально:', postId)
  }
}
