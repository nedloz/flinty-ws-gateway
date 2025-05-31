const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER]});
const consumer = kafka.consumer({ groupId: process.env.KAFKA_CLIENT_ID });
const redis = require('../redis/redisClient');
const messagePersistedHandler = require('./handlers/messagePersistedHandler');
const userSubscriptionsHandler = require('./handlers/userSubscriprionsHandler');
const logger = require('../events/utils/logger');
const chatHistoryResHandler = require('./handlers/chatHistoryResHandler');

// message.new
// user.connected
// message.persisted
// user.subscriptions

const handlers = {
  'message.persisted': messagePersistedHandler,
  'user.subscriptions': userSubscriptionsHandler,
  'chat.history.res': chatHistoryResHandler
};

async function setupKafkaConsumer(userSockets) {
  await consumer.connect();
  await consumer.subscribe({ topic: 'message.persisted', fromBeginning: false });
  await consumer.subscribe({ topic: 'user.subscriptions', fromBeginning: false });
  await consumer.subscribe({ topic: 'chat.history.res', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      const handler = handlers[topic];
      if (handler) {
        try {
          await handler({ data, redis, userSockets });
        } catch (err) {
          // тут только остается сохранять все ошибки в логи тк мы не знаем 
          // открыто ли до сих пор соединение с пользователем. 
          logger.error(`Ошибка при обработке события ${topic}`, err);
        }
      } else {
        logger.warn(`Нет обработчика для топика: ${topic}`);
      }
    }
  });
}

module.exports = { setupKafkaConsumer };