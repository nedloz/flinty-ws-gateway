const redis = require("../../redis/redisClient");

const validateAccess = async (userId, targetId) => {
  try {
    const rawChannels = await redis.sMembers(`user:${userId}:channels`);
    if (!rawChannels || rawChannels.length === 0) return false;

    const subs = [];

    for (const raw of rawChannels) {
      try {
        const chan = JSON.parse(raw);

        // если в ограничениях нет запрета на отправку сообщений
        if (!chan.limitations || !chan.limitations.includes('send_messages')) {
          subs.push(chan.channel_id);
        }
      } catch (e) {
        console.warn('⚠️ Не удалось распарсить канал:', raw);
      }
    }

    return subs.includes(targetId);
  } catch (err) {
    console.error("Validate access error:", err);
    throw new Error('Validate access error');
  }
};


module.exports = validateAccess;
