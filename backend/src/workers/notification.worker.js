import amqp from "amqplib";
import Notification from "../models/Notification.model.js";
import { QUEUES } from "../constants/queue.constant.js"
import { sendNotification } from "../services/notification.service.js";
import { publisher } from "../config/redis.js";
import { connectRedis } from "../config/redis.js";

import dotenv from "dotenv";

import connectDB from "../config/db.js";

dotenv.config();
await connectDB();

// Ensure Redis is connected before starting the worker because this is run on different process
await connectRedis();

const startWorker = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  const queue = QUEUES.NOTIFICATION;
  // console.log(process.env.RABBITMQ_URL);

  await channel.assertQueue(queue, { durable: true });

  console.log("Notification Worker Started");

  channel.consume(queue, async (msg) => {
    try {
      const data = JSON.parse(msg.content.toString());

      console.log("Received notification data:", data);

      await sendNotification(data);

      const notification = await Notification.create({
        user: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data
      });

      // REDIS PUBLISH (only after DB success)
      await publisher.publish(
        "realtime",
        JSON.stringify({
          userId: data.userId,
          event: "new_notification",
          payload: notification,
        })
      );

      channel.ack(msg);

    } catch (error) {
      console.error("Notification error:", error);
      // Important: requeue false to avoid infinite loop
      channel.nack(msg, false, false);
    }
  });
};

startWorker();