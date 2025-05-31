logger = require('./logger');

const handleError = async (ws, code, message) => {
    logger.error(`${code} \t ${message}`);
    await ws.send(JSON.stringify({
        type: 'error',
        payload: { code , message }
    }));
}

module.exports = handleError;