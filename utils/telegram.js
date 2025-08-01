import axios from 'axios'

export async function sendMessageToTelegram(text) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`
  const res = await axios.post(url, {
    chat_id: process.env.CHAT_ID,
    text: text
  })
  return res.data
}
