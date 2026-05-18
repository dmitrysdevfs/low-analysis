import 'dotenv/config';
import db from '../src/config/db.js';
import Subject from '../src/models/Subject.js';
import Element from '../src/models/Element.js';

const run = async () => {
  try {
    await db();
    console.log('MongoDB Connected.');

    const subjects = await Subject.find({}).sort({ createdAt: -1 }).limit(20);

    console.log('--- Last 20 Subjects Added ---');
    for (const s of subjects) {
      const count = await Element.countDocuments({
        'subjects.subject_id': s._id,
      });
      console.log(`[${s._id}] ${s.canonical_name} (${count} elements)`);
      if (s.aliases.length > 0) {
        console.log(`   Aliases: ${s.aliases.join(', ')}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

run();
