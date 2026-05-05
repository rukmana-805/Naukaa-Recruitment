import { getChannel } from "./rabbitmq.connection.js";
import { QUEUES } from "../constants/queue.constant.js";

export const sendEmailToQueue = async (data) => {
  const channel = getChannel();

  const queue = QUEUES.EMAIL;

  await channel.assertQueue(queue, { durable: true });

  channel.sendToQueue(
    queue,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );

  console.log("Email added to queue");
};