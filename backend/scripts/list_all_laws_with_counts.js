import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import Law from '../src/models/Law.js';
import Element from '../src/models/Element.js';

dotenv.config();

const run = async () => {
  await connectDB();
  console.log('Connected to DB');

  const laws = await Law.find({}).sort({ createdAt: -1 });
  console.log(`Found ${laws.length} laws in total:`);

  for (const law of laws) {
    const elementCount = await Element.countDocuments({ lawId: law._id });
    console.log(
      `- Code: ${law.code} | Title: "${law.title}" | Elements: ${elementCount} | Created: ${law.createdAt || 'N/A'}`,
    );
  }

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
