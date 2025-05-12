
const handleError = async (ws, code, message) => {
    // logger
    await ws.send(JSON.stringify({
        type: 'error',
        payload: { code , message }
    }));
}

module.exports = handleError;