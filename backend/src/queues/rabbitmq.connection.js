import amqp from "amqplib";

let channel;

// console.log(process.env.RABBITMQ_URL);

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log("✅ RabbitMQ Connected");
  } catch (error) {
    console.error("❌ RabbitMQ Error:", error);
  }
};

export const getChannel = () => channel;