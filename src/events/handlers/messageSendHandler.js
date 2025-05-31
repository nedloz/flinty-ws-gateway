const { produceKafkaMessage } = require('../../kafka/producer');
const handleError = require('../utils/handleError');
const validateAccess = require('../utils/validateAccess');

async function handleMessageSend(ws, userId, payload) {
    try {
    // тут должна быть валидация доступа к чату
        if (!(await validateAccess(userId, payload.channel_id || payload.target_id))) {
            await handleError(ws, 'error.message.channel.validation', 'User dont have acces to this channel');
            throw new Error('User dont have acces to this channel');
        }
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
    } catch (err) {
        throw new Error('Sending message error')    
    }
}

module.exports = handleMessageSend;