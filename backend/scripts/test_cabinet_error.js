import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LawChangeProposal from '../src/models/LawChangeProposal.js';
import Proposal from '../src/models/Proposal.js';
import Amendment from '../src/models/Amendment.js';
import User from '../src/models/User.js';
import Law from '../src/models/Law.js';
import Element from '../src/models/Element.js';
import { getMyProposals } from '../src/services/lawChange/proposal.service.js';
import { getProposalsByUser } from '../src/services/proposalService.js';
import { getAmendmentsByUser } from '../src/services/amendmentService.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Fetch all users
  const allUsers = await User.find();
  console.log('Total users in DB:', allUsers.length);

  for (const u of allUsers) {
    console.log(
      `\n=== Testing queries for user: ${u.username || u.email} (${u._id}) [role: ${u.role}] ===`,
    );
    try {
      const myProposals = await getMyProposals(u._id);
      console.log(
        '  getMyProposals (lawChange) Success! Count:',
        myProposals.length,
      );
    } catch (err) {
      console.error('  Error in getMyProposals (lawChange):', err.message);
    }

    try {
      const userProposals = await getProposalsByUser(u._id);
      console.log(
        '  getProposalsByUser (proposalService) Success! Count:',
        userProposals.length,
      );
    } catch (err) {
      console.error(
        '  Error in getProposalsByUser (proposalService):',
        err.message,
      );
    }

    try {
      const userAmendments = await getAmendmentsByUser(u._id);
      console.log(
        '  getAmendmentsByUser (amendmentService) Success! Count:',
        userAmendments.length,
      );
    } catch (err) {
      console.error(
        '  Error in getAmendmentsByUser (amendmentService):',
        err.message,
      );
    }
  }

  await mongoose.disconnect();
};

run().catch(console.error);
