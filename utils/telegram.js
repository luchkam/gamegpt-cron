import axios from 'axios'

export async function sendMessageToTelegram(input) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`

  // Универсальная обработка: если input — строка, это просто text
  const payload = typeof input === 'string'
    ? { chat_id: process.env.CHAT_ID, text: input }
    : {
        chat_id: input.chat_id || process.env.CHAT_ID,
        text: input.text,
        reply_to_message_id: input.reply_to_message_id,
        parse_mode: 'HTML'
      }

  if (!payload.text) throw new Error('❌ sendMessageToTelegram: text is missing!')

  try {
    const res = await axios.post(url, payload)
    return res.data
  } catch (error) {
    console.error('❌ Ошибка при отправке в Telegram:', error.response?.data || error.message)
    return null
  }
}
