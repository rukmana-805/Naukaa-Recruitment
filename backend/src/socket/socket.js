import { Server } from "socket.io";

let io;
const onlineUsers = new Map(); // Map<userId, socketId>

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    socket.on("join", (userId) => {
      if (!userId) return;
      socket.join(userId.toString());
      
      // Add to online users
      onlineUsers.set(userId.toString(), socket.id);
      
      // Broadcast to everyone that this user is online
      io.emit("user_status_change", { userId: userId.toString(), status: "online" });
    });

    socket.on("get_user_status", (userId, callback) => {
      if (typeof callback === "function") {
        callback({ status: onlineUsers.has(userId.toString()) ? "online" : "offline" });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);
      
      // Remove from online users
      let disconnectedUserId = null;
      for (const [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        io.emit("user_status_change", { userId: disconnectedUserId, status: "offline" });
      }
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};