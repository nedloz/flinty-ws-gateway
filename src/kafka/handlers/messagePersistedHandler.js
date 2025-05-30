const messagePersistedHandler = async ({ data, redis, userSockets }) => {
  const { sender_id, channel_id } = data;

  if (!redis) {
    throw new Error('Redis client is undefined in messagePersistedHandler');
  }
  if (!channel_id || !sender_id) {
    console.warn('[message.persisted] Invalid payload:', data);
    return;
  }

  const usersKey = `channel:${channel_id}:users`;
  const userIds = await redis.sMembers(usersKey);

  if (!userIds.length) {
    logger.log(`[message.persisted] No connected users in channel ${channel_id}`);
    return;
  }

  userIds.forEach(uid => {
    const socket = userSockets.get(uid);
    if (socket && socket.readyState === 1) {
      const eventType = uid === sender_id ? 'message.ack' : 'message.new';
      try {
        socket.send(JSON.stringify({ type: eventType, payload: data }));
      } catch (err) {
        logger.warn(`Ошибка при отправке сообщения пользователю ${uid}:`, err.message);
      }
    }
  });

  console.log(`[message.persisted] Message sent to ${userIds.length} users in channel ${channel_id}`);
};

module.exports = messagePersistedHandler;