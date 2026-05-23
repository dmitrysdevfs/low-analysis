import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import Law from '../src/models/Law.js';
import Element from '../src/models/Element.js';

dotenv.config();

const check = async () => {
  await connectDB();
  console.log('Connected to DB');

  const laws = await Law.find({});
  console.log(`Found ${laws.length} laws:`);

  for (const law of laws) {
    console.log('\n=========================================');
    console.log(`Title: ${law.title}`);
    console.log(`Code: ${law.code}`);
    console.log(`Preamble: ${law.preamble ? law.preamble : 'NULL'}`);
    console.log(
      `Global Context Preamble: ${law.global_context?.preamble ? law.global_context.preamble : 'NULL'}`,
    );

    // Check if there are elements before Article 1, or how elements look like
    const firstElements = await Element.find({ lawId: law._id })
      .sort({ order: 1 })
      .limit(10);
    console.log('First 5 elements in DB:');
    for (const el of firstElements.slice(0, 5)) {
      console.log(
        `  [${el.code}] (${el.type}): ${el.text ? el.text.substring(0, 80) : ''}`,
      );
    }
  }

  process.exit(0);
};

check();
