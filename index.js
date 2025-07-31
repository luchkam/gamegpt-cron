import dotenv from 'dotenv'
import { getPostFromAssistant } from './utils/openai.js'
import { sendMessageToTelegram } from './utils/telegram.js'

dotenv.config()

const time = process.argv[2] || new URLSearchParams(process.env.URL_QUERY || '').get('time') || '12'

const run = async () => {
  try {
    const post = await getPostFromAssistant(time)
    console.log('🧠 Generated post:', post)
    const result = await sendMessageToTelegram(post)
    console.log('✅ Sent to Telegram:', result)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

run()
