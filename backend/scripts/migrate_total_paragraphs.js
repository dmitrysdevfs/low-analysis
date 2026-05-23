import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Law from '../src/models/Law.js';
import Element from '../src/models/Element.js';

dotenv.config();

async function run() {
  console.log('Connecting to DB...');
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const laws = await Law.find({});
  console.log(`Found ${laws.length} laws to process.`);

  for (const law of laws) {
    const paragraphCount = await Element.countDocuments({
      lawId: law._id,
      type: 'paragraph',
    });

    console.log(`Law: "${law.title}" (${law.code})`);
    console.log(`  Current totalParagraphs in metadata: ${law.totalParagraphs ?? 'undefined'}`);
    console.log(`  Actual elements of type "paragraph" in DB: ${paragraphCount}`);

    law.totalParagraphs = paragraphCount;
    await law.save();
    console.log(`  -> Updated totalParagraphs to ${paragraphCount}`);
  }

  console.log('Migration completed successfully.');
  await mongoose.disconnect();
  console.log('Disconnected from DB');
}

run().catch(async (error) => {
  console.error('Migration failed:', error);
  try {
    await mongoose.disconnect();
  } catch (disError) {
    // ignore
  }
  process.exit(1);
});
