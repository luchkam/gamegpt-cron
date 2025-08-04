import axios from 'axios'

export async function getPostFromAssistant(time) {
  const run = await axios.post('https://api.openai.com/v1/threads', {}, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
      'Content-Type': 'application/json',
    }
  })

  const thread_id = run.data.id

  await axios.post(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
    role: 'user',
    content: `Сгенерируй пост на тему видеоигр. Сейчас ${time}:00.`
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
      'Content-Type': 'application/json',
    }
  })

  const response = await axios.post(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
    assistant_id: process.env.ASSISTANT_ID
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
      'Content-Type': 'application/json',
    }
  })

  const run_id = response.data.id
  let status = 'queued'
  let output = null

  while (status !== 'completed') {
    await new Promise(res => setTimeout(res, 1500))
    const res = await axios.get(`https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json',
      }
    })
    status = res.data.status
  }

  const messages = await axios.get(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
      'Content-Type': 'application/json',
    }
  })

  const last = messages.data.data.find(m => m.role === 'assistant')
  return last?.content?.[0]?.text?.value || 'Ошибка генерации'
}

export async function getReplyFromAssistant(messagesArray) {
  const assistantId = process.env.REPLY_ASSISTANT_ID
  const apiKey = process.env.OPENAI_API_KEY

  try {
    console.log('🧠 Создаём новый thread...')
    const res1 = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    })
    const res1Json = await res1.json()
    console.log('📄 Ответ от /threads:', res1Json)

    const threadId = res1Json.id
    console.log('📌 Thread ID:', threadId)

    console.log('📤 Отправляем сообщение в thread...')
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'user',
        content: messagesArray.join('\n')
      })
    })

    console.log('⚙️ Запускаем ассистента...')
    const run = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ assistant_id: assistantId })
    }).then(r => r.json())
    console.log('📄 Ответ от /runs:', run)
    console.log('▶️ Run ID:', run.id)

    // Ожидаем завершения run
    let status = 'queued'
    while (status !== 'completed' && status !== 'failed') {
      await new Promise(r => setTimeout(r, 1500))
      const runStatus = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      }).then(r => r.json())
      status = runStatus.status
      console.log('⏳ Статус выполнения:', status)
    }

    console.log('📩 Получаем ответы...')
    const messages = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    }).then(r => r.json())

    const assistantMessage = messages.data.find(m => m.role === 'assistant')
    if (!assistantMessage || !assistantMessage.content?.[0]?.text?.value) {
      console.log('⚠️ Не удалось найти сообщение от ассистента. Все сообщения:', messages)
      return 'Извини, я пока не могу ответить на это сообщение.'
    }

    console.log('✅ Получен ответ от ассистента:', assistantMessage.content[0].text.value)
    return assistantMessage.content[0].text.value
  } catch (error) {
    console.error('❌ Ошибка в getReplyFromAssistant:', error)
    return 'Произошла ошибка при получении ответа от ассистента.'
  }
}
