import { sendMessageToTelegram } from './telegram.js'
import { getReplyFromAssistant } from './openai.js'

export async function handleTelegramUpdate(update) {
  if (!update.message || !update.message.text) return

  const msg = update.message
  const botUsername = process.env.TELEGRAM_BOT_NAME?.toLowerCase() // например gamegpt_poster_bot

  const isMention = msg.text.toLowerCase().includes(`@${botUsername}`)
  const isReplyToBot = msg.reply_to_message?.from?.username?.toLowerCase() === botUsername

  if (isMention || isReplyToBot) {
    const context = [msg.text] // пока просто текущее сообщение, позже добавим историю
    const reply = await getReplyFromAssistant(context)
    await sendMessageToTelegram(reply)
  }
}
