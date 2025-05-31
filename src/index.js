require('dotenv').config();
const WebSocket = require('ws');
const fetch = require('node-fetch');
const handleEvent = require('./events/handleWsEvent');
const { setupKafkaConsumer } = require('./kafka/consumer');
const redis = require('./redis/redisClient');
const { produceKafkaMessage } = require('./kafka/producer');


const wss = new WebSocket.Server({ port: process.env.WS_PORT || 5000 });
const userSockets = new Map();


wss.on('connection', async (ws, req) => {
    try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

        if (!token) {
            ws.close(4001, "Missing token");
            return;
        }

        const res = await fetch('http://user-auth-svc:3000/auth/validate', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            ws.close(4003, "Unauthorized");
            return;
        }

        const userId = res.headers.get('X-User-Id');

        if (!userId) {
            ws.close(1011, "Missing user ID from auth service");
            return;
        }
        logger.info(`✅ Authenticated user: ${userId}`);
        userSockets.set(userId, ws);
        await redis.set(`user:${userId}:ws`, 'connected', 'EX', 60);
        await produceKafkaMessage('user.connected', { user_id: userId });

        ws.isAlive = true;

        // Heartbeat
        ws.on('pong', async () => {
            ws.isAlive = true;
            await redis.expire(`user:${userId}:ws`, 60);
        });

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                await handleEvent(ws, userId, data);
                await redis.expire(`user:${userId}:ws`, 60);
            } catch (err) {
                console.error("Message error:", err);
                ws.send(JSON.stringify({ error: 'Invalid message format' }));
            }
        });

        ws.on('close', async () => {
            userSockets.delete(userId);
            await redis.del(`user:${userId}:ws`);
        });

    } catch (err) {
        console.error("WS connection error:", err);
        ws.close(1011, "Internal error");
    }
});



// каждые 30 секунд будет оправляться ping для проверки соединения и в случае ответа pong соединение будет продлеваться. 
const interval = setInterval(() => {
    for (const [userId, ws] of userSockets.entries()) {
        if (ws.isAlive === false) {
            logger.warn(`Соединение пользователя ${userId} мертво. Закрываем.`);
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

logger.info(`WebSocket Gateway запущен на порту ${process.env.WS_PORT}`);
