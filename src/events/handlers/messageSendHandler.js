const { produceKafkaMessage } = require('../../kafka/producer');

async function handleMessageSend(ws, userId, payload) {
    const message = {
        chat_type: payload.chat_type,
        target_id: payload.target_id,
        channel_id: payload.channel_id || null,
        sender_id: userId,
        content: payload.content,
        attachments: payload.attachments || [],
        mentions: payload.mentions || [],
        reply_to: payload.reply_to || null,
    };

    await produceKafkaMessage('message.new', message);
}

module.exports = handleMessageSend;