import express from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { handleTelegramUpdate } from './utils/telegramReply.js'
import { handleVKCallback } from './utils/vkReply.js'

dotenv.config()
const app = express()
app.use(bodyParser.json())

app.post('/webhook', async (req, res) => {
  try {
    await handleTelegramUpdate(req.body)
    res.sendStatus(200)
  } catch (err) {
    console.error('❌ Ошибка обработки Telegram webhook:', err)
    res.sendStatus(500)
  }
})

app.post('/vk-callback', async (req, res) => {
  const { type } = req.body

  if (type === 'confirmation') {
    // 👉 Отвечаем VK кодом подтверждения из .env
    return res.send(process.env.VK_CONFIRMATION_CODE)
  }

  try {
    await handleVKCallback(req.body)
    res.send('ok') // VK требует ровно 'ok'
  } catch (err) {
    console.error('❌ Ошибка обработки VK webhook:', err)
    res.sendStatus(500)
  }
})

const PORT = process.env.PORT || 3000

import { savePost } from './utils/postCache.js'

app.post('/store-post', (req, res) => {
  const { id, text } = req.body

  if (!id || !text) {
    console.error('❌ Не хватает id или text для сохранения поста')
    return res.status(400).send('Missing id or text')
  }

  console.log('📥 Пришёл запрос сохранить пост:', id, text)
  savePost(id, text)
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`🚀 Telegram webhook listening on port ${PORT}`)
})
