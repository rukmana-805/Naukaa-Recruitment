import { subscriber } from "../config/redis.js";
import { getIO } from "./socket.js";

export const startRedisSubscriber = async () => {
  await subscriber.subscribe("realtime", (message) => {
    try {
      const data = JSON.parse(message);

      const io = getIO();

      if (!data.userId || !data.event) return;

      io.to(data.userId.toString()).emit(data.event, data.payload);
    } catch (err) {
      console.error("❌ Redis message error:", err);
    }
  });

  console.log("📡 Redis subscriber listening...");
};