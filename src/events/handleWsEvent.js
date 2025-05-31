const chatHistoryReqHandler = require('./handlers/chatHistoryReqHandler');
const messageSendHandler = require('./handlers/messageSendHandler');
const handleError = require('./utils/handleError');
const logger = require('./utils/logger');

const handlers = {
    'message.send': messageSendHandler,
    // 'message.update': 
    // 'message.delete':
    'chat.history.req': chatHistoryReqHandler
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
        logger.error(`Ошибка в обработке события ${type}: `, err); // logger
        await handleError(ws, 'INTERNAL_ERROR', 'Произошла внутренняя ошибка')
    }
}


module.exports = handleEvent;