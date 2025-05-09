const messageSendHandler = require('./handlers/messageSendHandler');

const handlers = {
    'message.send': messageSendHandler
};

function handleEvent(ws, userId, data) {
    const { type, payload } = data;
    if (handlers[type]) {
        handlers[type](ws, userId, payload);
    } else {
        console.warn(`Unknown event type: ${type}`);
    }
}


module.exports = handleEvent;