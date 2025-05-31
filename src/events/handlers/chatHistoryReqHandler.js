const { v4: uuidv4 } = require('uuid');
const {produceKafkaMessage} = require('../../kafka/producer');

const chatHistoryReqHandler = async (ws, userId, payload) => {
  try {
    const {
      chat_type,
      target_id,
      channel_id = null,
      before = null,
      limit = 20 // по умолчанию 20
    } = payload;

    const request_id = uuidv4();

    const message = {
      request_id,
      chat_type,
      sender_id: userId,
      target_id,
      channel_id,
      before,
      limit
    };

    await produceKafkaMessage('chat.history.req', message);
  } catch (err) {
    console.error('[chatHistoryReqHandler] Error sending history request:', err.message);
    ws.send(JSON.stringify({
      type: 'error',
      payload: {
        message: 'Failed to request chat history',
        details: err.message
      }
    }));
  }
};

module.exports = chatHistoryReqHandler;