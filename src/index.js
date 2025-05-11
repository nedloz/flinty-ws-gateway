require('dotenv').config();
const WebSocket = require('ws');
const handleEvent = require('./events');
const { setupKafkaConsumer } = reqire('./kafka/consumer');
const { redisClient } = require('./redis/redisClient');
const { produceKafkaMessage } = require('./kafka/producer');

const wss = new WebSocket.Server({ port: 8080 });
const userSockets = new Map();

wss.on('connection', (ws, req) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        ws.close();
        return;
    }
    produceKafkaMessage('user.connected', { user_id: userId });

    userSockets.set(userId, ws);
    redisClient.set(`user:${userId}:ws`, 'connected', 'EX', 60);

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        handleEvent(ws, userId, data);
    });

    ws.on('close', () => {
        userSockets.delete(userId)
        redisClient.del(`user:${userId}:ws`);
    })
});


setupKafkaConsumer(userSockets);
console.log('WebSocket Gateway запущен на порту 8080');
