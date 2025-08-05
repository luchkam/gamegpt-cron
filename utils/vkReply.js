import axios from 'axios'
import { getReplyFromAssistant } from './openai.js'

const ACCESS_TOKEN = process.env.VK_ACCESS_TOKEN
const GROUP_ID = parseInt(process.env.VK_GROUP_ID)

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

    // От сообщества или пустой комментарий — игнор
    if (fromId < 0 || !text) return

    // Прямая проверка: пост принадлежит сообществу
    const isPostFromCommunity = ownerId === -GROUP_ID
    const isReplyToAssistant = replyToUser === -GROUP_ID

    console.log('🔍 Проверка условий:')
    console.log('ownerId =', ownerId)
    console.log('isPostFromCommunity =', isPostFromCommunity)
    console.log('replyToUser =', replyToUser)
    console.log('isReplyToAssistant =', isReplyToAssistant)

    if (isPostFromCommunity || isReplyToAssistant) {
      const reply = await getReplyFromAssistant([text])

      await axios.get('https://api.vk.com/method/wall.createComment', {
        params: {
          owner_id: ownerId,
          post_id: postId,
          message: reply,
          from_group: 1,
          reply_to_comment: comment.id,
          access_token: ACCESS_TOKEN,
          v: '5.199'
        }
      })

      console.log('✅ Ответ отправлен ассистентом в комментарии')
    } else {
      console.log('⏭ Комментарий проигнорирован (не к посту бота и не ответ ассистенту)')
    }
  }

  if (type === 'wall_post_new') {
    console.log('📝 Обнаружен новый пост на стене (wall_post_new)')

    const post = data.object
    const fromId = post.from_id
    const postId = post.id
    const text = post.text?.trim()

    if (fromId === -GROUP_ID || !text) return

    const reply = await getReplyFromAssistant([text])

    await axios.get('https://api.vk.com/method/wall.createComment', {
      params: {
        owner_id: -GROUP_ID,
        post_id: postId,
        message: reply,
        from_group: 1,
        access_token: ACCESS_TOKEN,
        v: '5.199'
      }
    })

    console.log('✅ Ассистент ответил на новый пост пользователя')
  }
}
