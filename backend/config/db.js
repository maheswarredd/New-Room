import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/room_manager';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging 10s+
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`\n❌ [MongoDB Connection Error]: Could not connect to MongoDB.`);
    console.error(`   URI: ${uri}`);
    console.error(`   Reason: ${error.message}`);
    console.error(`\n👉 SOLUTION FOR LOCAL RUN:`);
    console.error(`   If you don't have local MongoDB running at port 27017,`);
    console.error(`   provide a free MongoDB Atlas URI in backend/.env:`);
    console.error(`   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/room_manager?retryWrites=true&w=majority\n`);
    throw error;
  }
};

export const checkDbConnection = () => isConnected;
export default connectDB;
