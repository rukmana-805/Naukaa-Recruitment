import amqp from "amqplib";
import { sendEmail } from "../services/email.service.js";
import { QUEUES } from "../constants/queue.constant.js";

import dotenv from "dotenv";

dotenv.config();

const startWorker = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  // console.log(process.env.RABBITMQ_URL);

  const queue = QUEUES.EMAIL;

  await channel.assertQueue(queue, { durable: true });

  console.log("Email Worker Started");

  channel.consume(queue, async (msg) => {
    const data = JSON.parse(msg.content.toString());

    try {
      await sendEmail(data);

      channel.ack(msg);
    } catch (error) {
      console.error("Email failed:", error);
    }
  });
};

startWorker();