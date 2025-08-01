import dotenv from 'dotenv'
import { getPostFromAssistant } from './utils/openai.js'
import { sendMessageToTelegram } from './utils/telegram.js'
import { postToVK } from './utils/vk.js' // 👉 добавляем импорт VK

dotenv.config()

const time = process.argv[2] || new URLSearchParams(process.env.URL_QUERY || '').get('time') || '12'

const run = async () => {
  try {
    const post = await getPostFromAssistant(time)
    console.log('🧠 Generated post:', post)

    const resultTelegram = await sendMessageToTelegram(post)
    console.log('✅ Sent to Telegram:', resultTelegram)

    const resultVK = await postToVK(post) // 👉 добавляем отправку в VK
    console.log('✅ Sent to VK:', resultVK)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

run()
