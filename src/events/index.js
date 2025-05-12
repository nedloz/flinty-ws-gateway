const messageSendHandler = require('./handlers/messageSendHandler');
const handleError = require('./utils/handleError');

const handlers = {
    'message.send': messageSendHandler
    // 'message.update': 
    // 'message.delete':
};
// обработчик ws событий
const handleEvent = async (ws, userId, data) => {
    const { type, payload } = data;
    const handler = handlers[type];
    
    if (!handler) {
        await handleError(ws, 'UNKNOWN_EVENT', `Unknown event type: ${type}`);
    }
    try {
        await handler(ws, userId, payload);
    } catch (err) {
        console.error(`Ошибка в обработке события ${type}: `, err); // logger
        await handleError(ws, 'INTERNAL_ERROR', 'Произошла внутренняя ошибка')
    }
}


module.exports = handleEvent;