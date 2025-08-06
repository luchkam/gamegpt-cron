import axios from 'axios'

export async function postToVK(message) {
  const token = process.env.VK_ACCESS_TOKEN
  const groupId = process.env.VK_GROUP_ID

  if (!token || !groupId) {
    console.error('❌ VK_ACCESS_TOKEN или VK_GROUP_ID не заданы')
    return
  }

  const params = {
    owner_id: `-${groupId}`,
    from_group: 1,
    message,
    access_token: token,
    v: '5.199'
  }

  console.log('🌐 Отправка в VK с параметрами:', params)

  try {
    const res = await axios.get('https://api.vk.com/method/wall.post', { params })
    console.log('📦 Ответ VK API:', JSON.stringify(res.data, null, 2))

    if (res.data.error) {
      console.error('❌ VK API Error:', res.data.error)
    } else {
      console.log('✅ Пост опубликован в VK:', res.data.response.post_id)
    }

    if (res.data?.response?.post_id && message) {
      const postId = res.data.response.post_id
      console.log('📥 Отправляем пост на сохранение через API:', postId)
      try {
        await axios.post(`${process.env.API_BASE_URL}/store-post`, {
          id: postId,
          text: message
        })
      } catch (err) {
        console.error('❌ Ошибка при отправке POST запроса на сохранение поста:', err.message)
      }
    }

    return res.data
  } catch (err) {
    console.error('❌ Ошибка при отправке в VK:', err.message)
  }
}
