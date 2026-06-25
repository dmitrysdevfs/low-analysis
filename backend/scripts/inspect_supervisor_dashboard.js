import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Group from '../src/models/Group.js';
import Proposal from '../src/models/Proposal.js';
import User from '../src/models/User.js';
import LawFork from '../src/models/LawFork.js';

dotenv.config();

const inspect = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- DATABASE INSPECTION ---');

  // 1. Users list
  const users = await User.find({}, 'fullName email role');
  console.log(`\nTotal Users: ${users.length}`);
  users.forEach((u) => {
    console.log(
      `User: ${u.fullName} (${u.email}) | Role: ${u.role} | ID: ${u._id}`,
    );
  });

  // 2. Groups list
  const groups = await Group.find();
  console.log(`\nTotal Groups: ${groups.length}`);
  for (const g of groups) {
    const supervisor = users.find(
      (u) => String(u._id) === String(g.supervisorId),
    );
    console.log(
      `Group: "${g.name}" | Supervisor: ${supervisor ? supervisor.fullName : 'None'} (${g.supervisorId}) | Status: ${g.status}`,
    );
    console.log(`  Tracked Laws: ${g.trackedLaws.join(', ')}`);
    console.log(`  Members:`);
    g.members.forEach((m) => {
      const user = users.find((u) => String(u._id) === String(m.userId));
      console.log(
        `    - User ID: ${m.userId} | Name: ${user ? user.fullName : 'Unknown'} | Status: ${m.status}`,
      );
    });
  }

  // 3. Proposals list
  const proposals = await Proposal.find();
  console.log(`\nTotal Proposals: ${proposals.length}`);
  for (const p of proposals) {
    const author = users.find((u) => String(u._id) === String(p.created_by));
    console.log(
      `Proposal: "${p.title}" | Law: ${p.law_id} | Author: ${author ? author.fullName : 'Unknown'} (${p.created_by}) | Status: ${p.status}`,
    );
  }

  // 4. Forks list
  const forks = await LawFork.find();
  console.log(`\nTotal Forks: ${forks.length}`);
  for (const f of forks) {
    const author = users.find((u) => String(u._id) === String(f.authorId));
    console.log(
      `Fork: "${f.title}" | Law: ${f.lawId} | Author: ${author ? author.fullName : 'Unknown'} (${f.authorId}) | Status: ${f.status}`,
    );
  }

  await mongoose.disconnect();
};

inspect().catch(console.error);
