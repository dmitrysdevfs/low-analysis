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
    isVerified: true,
  },
  {
    fullName: 'Standard User',
    email: 'user@lowanalysis.com',
    password: 'password123',
    role: 'user',
    isVerified: true,
  },
  {
    fullName: 'Paid User',
    email: 'paid@lowanalysis.com',
    password: 'password123',
    role: 'paid_user',
    username: 'paid',
    isVerified: true,
  },
  {
    fullName: 'Dev Client',
    email: 'user@low-analysis.dev',
    password: '777',
    role: 'user',
    username: 'user',
    isVerified: true,
  },
  {
    fullName: 'Dev Admin',
    email: 'admin@low-analysis.dev',
    password: '888',
    role: 'admin',
    username: 'admin',
    isVerified: true,
  },
];

const seedUsers = async () => {
  try {
    await connectDB();

    await User.deleteMany({
      $or: [
        { email: { $in: users.map((u) => u.email) } },
        {
          username: {
            $in: users.filter((u) => u.username).map((u) => u.username),
          },
        },
      ],
    });

    await User.create(users);

    console.log('Users seeded successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
