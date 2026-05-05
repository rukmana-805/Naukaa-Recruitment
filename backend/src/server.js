import dotenv from "dotenv";

dotenv.config();

import http from "http";
import { connectRabbitMQ } from "./queues/rabbitmq.connection.js";

await connectRabbitMQ();

import connectDB from "./config/db.js";

import app from "./app.js";

import { initSocket } from "./socket/socket.js";
import { startRedisSubscriber } from "./socket/socket.subscriber.js";
import { connectRedis } from "./config/redis.js";


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    try {
      await connectRabbitMQ();
    } catch (err) {
      console.error("RabbitMQ not available, exiting...");
      process.exit(1);
    }

    const server = http.createServer(app);

    initSocket(server);

    // Redis ko block mat kar
    await connectRedis();          
    startRedisSubscriber();  // no await

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Server startup failed:", err);
  }
};
startServer();
