import axios from 'axios'
import { getReplyFromAssistant } from './openai.js'

const ACCESS_TOKEN = process.env.VK_ACCESS_TOKEN
const GROUP_ID = parseInt(process.env.VK_GROUP_ID)

export async function handleVKCallback(data) {
  const type = data.type

  if (type === 'wall_reply_new') {
    const comment = data.object
    const fromId = comment.from_id
    const postId = comment.post_id
    const ownerId = comment.owner_id
    const replyToComment = comment.reply_to_comment
    const replyToUser = comment.reply_to_user
    const text = comment.text?.trim()

    // Игнорируем: комментарий от самого сообщества или пустой
    if (fromId < 0 || !text) return

    // Получаем информацию о посте, чтобы понять, от кого он
    const postRes = await axios.get('https://api.vk.com/method/wall.getById', {
      params: {
        posts: `${ownerId}_${postId}`,
        access_token: ACCESS_TOKEN,
        v: '5.199'
      }
    })

    const post = postRes.data.response?.[0]
    const isPostFromCommunity = post?.from_id === -GROUP_ID

    // Условия:
    const isReplyToAssistant = replyToUser && replyToUser === -GROUP_ID
    const isCommentOnPostByAssistant = !replyToComment && isPostFromCommunity

    if (isReplyToAssistant || isCommentOnPostByAssistant) {
      const reply = await getReplyFromAssistant([text])

      await axios.get('https://api.vk.com/method/wall.createComment', {
        params: {
          owner_id: ownerId,
          post_id: postId,
          message: reply,
          from_group: 1,
          reply_to_comment: comment.id, // отвечаем на этот комментарий
          access_token: ACCESS_TOKEN,
          v: '5.199'
        }
      })
    }
  }

  // Реакция на новые посты от пользователей (не от сообщества)
  if (type === 'wall_post_new') {
    const post = data.object
    const fromId = post.from_id
    const postId = post.id
    const text = post.text?.trim()

    if (fromId === -GROUP_ID || !text) return // если это пост от сообщества — пропускаем

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
  }
}
