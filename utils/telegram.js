import axios from 'axios'

export async function sendMessageToTelegram({ chat_id, text, reply_to_message_id }) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`

  const payload = {
    chat_id,
    text,
    parse_mode: 'HTML'
  }

  if (reply_to_message_id) {
    payload.reply_to_message_id = reply_to_message_id
  }

  try {
    const res = await axios.post(url, payload)
    return res.data
  } catch (error) {
    console.error('❌ Ошибка при отправке в Telegram:', error.response?.data || error.message)
    return null
  }
}
