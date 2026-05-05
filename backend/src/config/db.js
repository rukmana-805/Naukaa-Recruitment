// import mongoose from "mongoose";

// import dotenv from "dotenv";    
// dotenv.config(); // .env file se environment variables load karne ke liye

// const connectDB = async () => {
//     try {
//         const conn = await mongoose.connect(process.env.MONGODB_URI);

//         // const conn = await mongoose.connect("mongodb+srv://akash:akash123@cluster0.2m0t0.mongodb.net/naukaa");

//         console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
//     } catch (error) {
//         console.error(`❌ DB Error: ${error.message}`);
//         process.exit(1); // app band kar dega agar DB fail hua
//     }
// };

// export default connectDB;


import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error("❌ MONGODB_URI is not defined");
            process.exit(1);
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

        mongoose.connection.on("disconnected", () => {
            console.log("⚠️ MongoDB disconnected!");
        });

    } catch (error) {
        console.error(`❌ DB Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;