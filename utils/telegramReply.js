import { sendMessageToTelegram } from './telegram.js'
import { getReplyFromAssistant } from './openai.js'

export async function handleTelegramUpdate(update) {
  if (!update.message || !update.message.text) return

  const msg = update.message
  const botUsername = process.env.TELEGRAM_BOT_NAME?.toLowerCase() // example: gamegpt_poster_bot

  const isMention = msg.text.toLowerCase().includes(`@${botUsername}`)
  const isReplyToBot = msg.reply_to_message?.from?.username?.toLowerCase() === botUsername

  if (isMention || isReplyToBot) {
    console.log('📩 Бот упомянут или ответ на него — обрабатываем')

    // Убираем @gamegpt_poster_bot из текста
    const cleanedText = msg.text.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim()

    const context = [cleanedText] // можно позже добавить историю
    const reply = await getReplyFromAssistant(context)

    // Отправляем ответ в тот же чат и с reply
    await sendMessageToTelegram(reply, msg.chat.id, msg.message_id)
  }
}
