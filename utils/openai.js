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
