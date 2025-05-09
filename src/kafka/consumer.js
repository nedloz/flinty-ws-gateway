const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: ['localhost:9092'] });
const consumer = kafka.consumer({ groupId: 'ws-gateway-group' });
const { redisClient } = require('../redis/redisClient');
const messagePersistedHandler = require('../events/handlers/messagePersistedHandler');
const userSubscriptionsHandler = require('../events/handlers/userSubscriprionsHandler');


const handlers = {
  'message.persisted': messagePersistedHandler,
  'user.subscriptions': userSubscriptionsHandler
};

async function setupKafkaConsumer(userSockets) {
  await consumer.connect();
  await consumer.subscribe({ topic: 'message.persisted', fromBeginning: false }) 
  await consumer.subscribe({ topic: 'user.subscriptions', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value.toString());
      const handler = handlers[topic];
      if (handler) {
        try {
          await handler({ data, redisClient, userSockets });
        } catch (err) {
          console.error(`Ошибка при обработке события ${topic}`, err);
        }
      } else {
        console.warn(`Нет обработчика для топика: ${topic}`);
      }
    }
  });
}

module.exports = { setupKafkaConsumer };