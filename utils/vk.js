import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const VK_API_URL = 'https://api.vk.com/method/wall.post'
const VK_API_VERSION = '5.131'

export async function postToVK(message) {
  const token = process.env.VK_ACCESS_TOKEN
  const groupId = process.env.VK_GROUP_ID

  if (!token || !groupId) {
    console.error('❌ VK_ACCESS_TOKEN или VK_GROUP_ID не заданы')
    return
  }

  const payload = {
    owner_id: `-${groupId}`, // именно с минусом!
    from_group: 1,
    message: message,
    v: VK_API_VERSION,
    access_token: token
  }

  console.log('🌐 Sending to VK with payload:', payload)

  try {
    const response = await fetch(VK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload)
    })

    const data = await response.json()
    console.log('📦 VK API Response:', JSON.stringify(data, null, 2))

    if (data.error) {
      console.error('❌ VK API Error:', data.error)
      throw new Error(data.error.error_msg || 'Unknown VK API error')
    }

    return data.response
  } catch (err) {
    console.error('❌ VK POST failed:', err)
    throw err
  }
}
