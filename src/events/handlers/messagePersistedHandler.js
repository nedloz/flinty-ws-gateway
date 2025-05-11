const messagePersistedHandler = async ({ data, redisClient, userSockets }) => {
    const { sender_id, channel_id } = data;
    const usersKey = `channel:${channel_id}:users`;
    const userIds = await redisClient.smembers(usersKey);

    userIds.forEach(uid => {
      const socket = userSockets.get(uid);
      if (socket && socket.readyState === 1) {
        const eventType = uid === sender_id ? 'message.ack' : 'message.new';
        socket.send(JSON.stringify({ type: eventType, payload: data }));
      }
    });
}

module.exports = messagePersistedHandler;