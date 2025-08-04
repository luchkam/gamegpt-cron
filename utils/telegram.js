import axios from 'axios'

export async function sendMessageToTelegram(text, chatId, replyToMessageId = null) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`

  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  }

  if (replyToMessageId) {
    payload.reply_to_message_id = replyToMessageId
  }

  const res = await axios.post(url, payload)
  return res.data
}
