import axios from 'axios'
import { sendMessageToTelegram } from './telegram.js'
import { getReplyFromAssistant } from './openai.js'
import { getHistory, pushMessage, prune } from './contextStore.js'

export async function handleTelegramUpdate(update) {
  console.log('🔍 Полный апдейт:', JSON.stringify(update, null, 2))

  // ================================
  // 🧲 Обработка нажатий на inline-кнопки (callback_query)
  // ================================
  if (update.callback_query) {
    const callback = update.callback_query
    const chatId = callback.message.chat.id
    const messageId = callback.message.message_id
    const data = callback.data

    console.log('🎯 Нажата кнопка:', data)

    if (data === 'show_help') {
      const helpText = `
🎮 Я — геймер с искусственным интеллектом!

💬 Пока помогаю только в групповом чате @gamegpt_ru:
• Отвечаю на вопросы
• Раскрываю лайфхаки, советы и фишки
• Делюсь новостями из мира Minecraft, GTA, Roblox и других игр
• Присылаю 2 раза в день самые свежие советы

📲 В будущем сделаю:
• Личный чат для каждого игрока — фишки больше не утекут другим!
• Возможность отправить скрин, чтобы я подсказывал точнее, что делать

🔧 Короче, работы ещё много — будем совершенствоваться!

👾 А пока — вступай в групповой чат @gamegpt_ru. Будем побеждать!
      `.trim()

      await sendMessageToTelegram({
        chat_id: chatId,
        text: helpText
      })

      // Telegram требует ответить на callback_query
      await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/answerCallbackQuery`, {
        callback_query_id: callback.id
      })
    }

    return
  }

  // ================================
  // 🧭 Обработка обычных сообщений
  // ================================
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
👋 Привет! 🎮 Я — геймер с искусственным интеллектом!

Я пока не отвечаю в этом чате.

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
              { text: '🤖 Что я умею?', callback_data: 'show_help' } // ✅ заменено на callback
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

    // подчищаем историю (удаляем записи старше 2 часов)
    try { prune(2) } catch (e) { console.error('⚠️ prune error:', e) }

    const chatId = msg.chat.id
    const userId = msg.from.id

    // берём последние до 3 реплик диалога (пользователь/бот)
    const history = getHistory(chatId, userId)
    const historyLines = history.map(m => `${m.role === 'assistant' ? 'Бот' : 'Пользователь'}: ${m.content}`)

    // формируем один компактный промпт
    const prompt = [
      'Контекст последних сообщений (до 3):',
      ...historyLines,
      msg.reply_to_message?.text ? `Пост/сообщение, на которое отвечают: ${msg.reply_to_message.text}` : null,
      `Пользователь: ${cleanedText}`,
      'Ответь кратко и по делу.'
    ].filter(Boolean).join('\n')

    console.log('📥 Сформирован prompt для Assistant:', prompt)

    // в OpenAI отправляем одну строку, чтобы не ломать VK-логику
    const reply = await getReplyFromAssistant([prompt])
    console.log('🤖 Ответ от Assistant:', reply)
    try {
      pushMessage(chatId, userId, 'user', cleanedText, 3)       // сохраняем запрос
      pushMessage(chatId, userId, 'assistant', reply, 3)        // сохраняем ответ
    } catch (e) {
      console.error('⚠️ pushMessage error:', e)
    }

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
