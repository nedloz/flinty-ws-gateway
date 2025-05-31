

const userSubscriptionsHandler = async ({ data, redis }) => {
  const { user_id, channels } = data;

  for (const chan of channels) {
    const channelId = chan.channel_id;

    if (!channelId) {
      console.warn(`[subscriptions] Пропущен канал без channel_id:`, chan);
      continue;
    }

    await redis.sAdd(`channel:${channelId}:users`, user_id);

    await redis.sAdd(`user:${user_id}:channels`, JSON.stringify(chan));
  }
};


module.exports = userSubscriptionsHandler;