const userSubscriptionsHandler = async ({ data, redis }) => {
    const { user_id, channels } = data;
    for (const chan of channels) {
      await redis.sAdd(`channel:${chan}:users`, user_id);
      await redis.sAdd(`user:${user_id}:channels`, chan);
      // для серверов нужна отдельная коллекцияю.  нет
    }
}

module.exports = userSubscriptionsHandler;