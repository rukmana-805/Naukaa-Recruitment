import { getChannel } from "../queues/rabbitmq.connection.js";
import { QUEUES } from "../constants/queue.constant.js";

export const sendNotificationToQueue = async (data) => {
    const channel = getChannel();

    const queue = QUEUES.NOTIFICATION;

    await channel.assertQueue(queue, { durable: true });
    
    channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(data)),
        { persistent: true}
    );

    console.log("Notification added to queue");
}