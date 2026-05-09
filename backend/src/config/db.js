import mongoose from 'mongoose';
import { getEnvVar } from '../utils/getEnvVar.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(getEnvVar('MONGODB_URI'));
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
