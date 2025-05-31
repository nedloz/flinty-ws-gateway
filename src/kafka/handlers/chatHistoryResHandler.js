
const chatHistoryResHandler = async ({ data, redis, userSockets }) => {
    const {
        request_id,
        channel_id,
        messages,
        has_more,
        sender_id
    } = data;
    
    const socket = userSockets.get(sender_id);

    if (socket && socket.readyState === 1) {
        socket.send(JSON.stringify({
            type: 'chat.history.res',
            payload: {
                request_id,
                channel_id,
                messages,
                has_more
            }
        }));
    } else {
        console.warn(`[chat.history.response] No active socket for a user: ${sender_id}`);
    }
};


module.exports = chatHistoryResHandler;