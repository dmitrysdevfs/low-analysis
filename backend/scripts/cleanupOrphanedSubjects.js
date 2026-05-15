import 'dotenv/config';
import db from '../src/config/db.js';
import Subject from '../src/models/Subject.js';
import Element from '../src/models/Element.js';

const run = async () => {
  try {
    await db();
    console.log('MongoDB Connected.');

    const subjects = await Subject.find({}, '_id canonical_name');
    console.log(`Checking ${subjects.length} total subjects...`);

    let orphanedCount = 0;

    for (const subject of subjects) {
      const hasElements = await Element.exists({
        'subjects.subject_id': subject._id,
      });
      if (!hasElements) {
        console.log(
          `Deleting orphan: ${subject.canonical_name} (${subject._id})`,
        );
        await Subject.deleteOne({ _id: subject._id });
        orphanedCount++;
      }
    }

    console.log(
      `\nCleanup complete! Deleted ${orphanedCount} orphaned subjects.`,
    );
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

run();
