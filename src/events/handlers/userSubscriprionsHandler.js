const userSubscriptionsHandler = async ({ data, redisClient }) => {
    const { user_id, channels } = data;
    for (const chan of channels) {
      await redisClient.sAdd(`channel:${chan}:users`, user_id);
      await redisClient.sAdd(`user:${user_id}:channels`, chan);
      // для серверов нужна отдельная коллекцияю.  нет
    }
}

module.exports = userSubscriptionsHandler;