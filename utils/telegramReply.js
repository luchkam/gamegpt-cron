import { sendMessageToTelegram } from './telegram.js'
import { getReplyFromAssistant } from './openai.js'

export async function handleTelegramUpdate(update) {
  console.log('🔍 Полный апдейт:', JSON.stringify(update, null, 2))

  if (!update.message || !update.message.text) return

  const msg = update.message
  const text = msg.text.trim()
  const chatType = msg.chat.type
  const botUsername = process.env.TELEGRAM_BOT_NAME?.toLowerCase() // example: gamegpt_poster_bot

  // ================================
  // 🧭 1. Поведение в ЛИЧКЕ (бот-чате)
  // ================================
  if (chatType === 'private') {
    if (text === '/start') {
      const welcomeText = `
👋 Привет! Я пока не отвечаю в этом чате.

Но если ты вступишь в наш групповой чат, там я:
• Отвечаю на комментарии
• Выкладываю советы, лайфхаки и фишки по играм 2 раза в день

Выбирай, что дальше 👇
      `.trim()

      await sendMessageToTelegram({
        chat_id: msg.chat.id,
        text: welcomeText,
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎮 Перейти в групповой чат', url: 'https://t.me/gamegpt_ru' }
            ],
            [
              { text: '🤖 Что я умею?', url: 'https://t.me/gamegpt_ru' } // можно заменить на callback_data если нужно обрабатывать
            ]
          ]
        }
      })

      console.log('👋 Приветственное сообщение отправлено')
    } else {
      console.log('🤖 Бот в личке. Ничего не отвечает кроме /start')
    }

    return // 🛑 в личке больше ничего не делаем
  }

  // ================================
  // 🧭 2. Поведение в ГРУППЕ
  // ================================
  const isMention = text.toLowerCase().includes(`@${botUsername}`)
  const isReplyToBot = msg.reply_to_message?.from?.username?.toLowerCase() === botUsername

  if (isMention || isReplyToBot) {
    const allowedChatId = -1002271739944 // Telegram-группа GameGPT

    if (msg.chat.id !== allowedChatId) {
      console.log('⛔ Бот вызван вне разрешённой группы, игнорируем.')
      return
    }

    console.log('📩 Бот упомянут или ответ на него — обрабатываем')

    // Убираем @gamegpt_poster_bot из текста
    const cleanedText = text.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim()

    let context = []

    if (msg.reply_to_message?.text) {
      context.push(msg.reply_to_message.text) // оригинальный пост — всегда, если есть
    }

    context.push(cleanedText) // сообщение пользователя
    console.log('📥 Контекст сообщения:', context)

    const reply = await getReplyFromAssistant(context)
    console.log('🤖 Ответ от Assistant:', reply)

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
