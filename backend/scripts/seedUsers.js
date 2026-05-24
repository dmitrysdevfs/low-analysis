import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import connectDB from '../src/config/db.js';

dotenv.config();

const users = [
  {
    fullName: 'Admin User',
    email: 'admin@lowanalysis.com',
    password: 'password123',
    role: 'admin',
  },
  {
    fullName: 'Standard User',
    email: 'user@lowanalysis.com',
    password: 'password123',
    role: 'user',
  },
  {
    fullName: 'Paid User',
    email: 'paid@lowanalysis.com',
    password: 'password123',
    role: 'paid_user',
  },
];

const seedUsers = async () => {
  try {
    await connectDB();

    await User.deleteMany({ email: { $in: users.map((u) => u.email) } });

    await User.create(users);

    console.log('Users seeded successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
