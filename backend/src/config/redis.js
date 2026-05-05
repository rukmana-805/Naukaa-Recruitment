import { createClient } from "redis";

const publisher = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

const subscriber = publisher.duplicate();

export const connectRedis = async () => {
  try {

    await publisher.connect();
    await subscriber.connect();

    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection failed:", err);
  }
};

export { publisher, subscriber };