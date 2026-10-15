import mongoose from 'mongoose';

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pawnbook_master';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    // Do not terminate process in electron mode; allow reconnect
    return null;
  }
}

export default connectDB;
