const { produceKafkaMessage } = require('../../kafka/producer');

async function handleMessageSend(ws, userId, payload) {
    const message = {
        chat_type: payload.chat_type,
        _id: payload._id,
        channel_id: payload.channel_id,
        sender_id: userId,
        content: payload.content,
        attachments: payload.attachments || [],
        mentions: payload.mentions || [],
        reply_to: payload.reply_to || null,
    };

    await produceKafkaMessage('message.new', message);
}

module.exports = handleMessageSend;