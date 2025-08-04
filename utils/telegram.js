import axios from 'axios'

export async function sendMessageToTelegram({ chat_id, text, reply_to_message_id }) {
  const payload = {
    chat_id,
    text,
    parse_mode: 'HTML'
  }

  // ✅ Только если reply_to_message_id — это валидный integer
  if (Number.isInteger(reply_to_message_id)) {
    payload.reply_to_message_id = reply_to_message_id
  }

  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      payload
    )
    return res.data
  } catch (error) {
    console.error('❌ Ошибка при отправке в Telegram:', error.response?.data || error.message)
    return null
  }
}
