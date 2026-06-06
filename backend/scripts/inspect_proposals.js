import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Proposal from '../src/models/Proposal.js';
import Amendment from '../src/models/Amendment.js';

dotenv.config();

const inspect = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const proposals = await Proposal.find();
  for (const p of proposals) {
    const actualCount = await Amendment.countDocuments({ proposal_id: p._id });
    console.log(`Proposal: ${p.title} | ID: ${p._id}`);
    console.log(`  amendments_count in DB: ${p.amendments_count}`);
    console.log(`  Actual count of amendments: ${actualCount}`);
  }

  await mongoose.disconnect();
};

inspect().catch(console.error);
