import { sendMessageToTelegram } from './telegram.js'
import { getReplyFromAssistant } from './openai.js'

export async function handleTelegramUpdate(update) {
  console.log('🔍 Полный апдейт:', JSON.stringify(update, null, 2))
  
  if (!update.message || !update.message.text) return

  const msg = update.message
  console.log('📦 Полный объект msg:')
  console.dir(msg, { depth: null })
  const botUsername = process.env.TELEGRAM_BOT_NAME?.toLowerCase() // example: gamegpt_poster_bot

  const isMention = msg.text.toLowerCase().includes(`@${botUsername}`)
  const isReplyToBot = msg.reply_to_message?.from?.username?.toLowerCase() === botUsername

  if (isMention || isReplyToBot) {
    console.log('📩 Бот упомянут или ответ на него — обрабатываем')

    // Убираем @gamegpt_poster_bot из текста
    const cleanedText = msg.text.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim()

    const context = [cleanedText]
    console.log('📥 Контекст сообщения:', context)
    const reply = await getReplyFromAssistant(context)
    console.log('🤖 Ответ от Assistant:', reply)

    // Отправляем ответ в тот же чат и с reply
    console.log('🧾 chat_id:', msg.chat.id)
    console.log('🧾 message_id:', msg.message_id)
    console.log('🧾 message_thread_id:', msg.message_thread_id)
    const payload = {
      chat_id: msg.chat.id,
      text: reply,
      reply_to_message_id: msg.message_id
    }
    console.log('📨 Готовим payload для Telegram:', payload)

    await sendMessageToTelegram(payload)
    console.log('✅ Отправлено в Telegram')
  }
}
