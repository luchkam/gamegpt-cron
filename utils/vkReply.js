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

    // 🛡️ Исключаем реакцию на комментарий, сделанный сообществом на пост (т.е. не ответ на чужой комментарий)
    if (fromId === -GROUP_ID && !replyToUser) {
      console.log('⏭ Это комментарий от сообщества, не ответ — не обрабатываем повторно')
      return
    }

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
      let postText = getPostText(postId)

      if (!postText) {
        try {
          console.log('🧩 Fallback: получаем текст поста через wall.getById')
          const wallRes = await axios.get('https://api.vk.com/method/wall.getById', {
            params: {
              posts: `${ownerId}_${postId}`, // owner_id (для сообщества — отрицательный) + '_' + post_id
              access_token: ACCESS_TOKEN,
              v: '5.199',
            },
          })
          const items = wallRes.data?.response?.items || []
          if (items[0]?.text) {
            postText = items[0].text
            console.log('✅ Текст поста получен с VK API:', postText)
          } else {
            console.log('⚠️ Не удалось получить текст поста через VK API:', JSON.stringify(wallRes.data))
          }
        } catch (e) {
          console.error('❌ Ошибка VK wall.getById:', e?.response?.data || e.message)
        }
      }

      const context = postText ? [postText, text] : [text]
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
        // 🔄 Отвечаем только на посты пользователей (не сообщества)
    if (fromId !== -GROUP_ID) {
      console.log('🤖 Отправляем текст поста ассистенту...')
      const reply = await getReplyFromAssistant([text])

      console.log('💬 Ответ от ассистента на пост:', reply)

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

      console.log('✅ Ответ на пост опубликован от имени сообщества')
    }
    console.log('💾 Пост сохранён локально:', postId)
  }
}
