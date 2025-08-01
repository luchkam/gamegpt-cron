const axios = require('axios');

async function postToVK(message) {
  const token = process.env.VK_ACCESS_TOKEN;
  const groupId = process.env.VK_GROUP_ID;

  if (!token || !groupId) {
    console.error('❌ VK_ACCESS_TOKEN или VK_GROUP_ID не установлены');
    return;
  }

  try {
    const response = await axios.get('https://api.vk.com/method/wall.post', {
      params: {
        owner_id: `-${groupId}`,     // обязательно с минусом для групп
        from_group: 1,
        message,
        access_token: token,
        v: '5.199',
      },
    });

    if (response.data.error) {
      console.error('❌ Ошибка VK API:', response.data.error);
    } else {
      console.log('✅ Пост опубликован в VK:', response.data.response.post_id);
    }
  } catch (error) {
    console.error('❌ Сетевая ошибка VK:', error.message);
  }
}

module.exports = { postToVK };
