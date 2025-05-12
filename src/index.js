require('dotenv').config();
const WebSocket = require('ws');
const handleEvent = require('./events/index');
const { setupKafkaConsumer } = reqire('./kafka/consumer');
const redis = require('./redis/redisClient');
const { produceKafkaMessage } = require('./kafka/producer');

const wss = new WebSocket.Server({ port: 8080 });
const userSockets = new Map();

function heartbeat() {
    this.isAlive = true;
}

wss.on('connection', (ws, req) => {

    const userId = req.headers['x-user-id'];
    if (!userId) {
        ws.close();
        return;
    }

    ws.isAlive = true;
    ws.on('pong', () => {
        heartbeat.call(ws);
        redis.expire(`user:${userId}:ws`, 60);
    });  // heartbeat added 
     
    produceKafkaMessage('user.connected', { user_id: userId });

    userSockets.set(userId, ws);
    redis.set(`user:${userId}:ws`, 'connected', 'EX', 60);

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        handleEvent(ws, userId, data);
        redis.expire(`user:${userId}:ws`, 60);
    });

    ws.on('close', () => {
        userSockets.delete(userId)
        redis.del(`user:${userId}:ws`);
    })
});


// каждые 30 секунд будет оправляться ping для проверки соединения и в случае ответа pong соединение будет продлеваться. 
const interval = setInterval(() => {
    for (const [userId, ws] of userSockets.entries()) {
        if (ws.isAlive === false) {
            console.log(`Соединение пользователя ${userId} мертво. Закрываем.`);
            ws.terminate();
            userSockets.delete(userId);
            redis.del(`user:${userId}:ws`);
            continue;
        }

        ws.isAlive = false;
        ws.ping(); // шлем ping, ждём pong
    }
}, 30000);
// отчистка таймера 
wss.on('close', () => {
    clearInterval(interval);
})

// запуск слушателя кафка событий
setupKafkaConsumer(userSockets);

console.log('WebSocket Gateway запущен на порту 8080');
