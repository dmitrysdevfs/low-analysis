import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Law from '../src/models/Law.js';
import Element from '../src/models/Element.js';
import { classifyElement } from '../src/services/taxonomyService.js';
import connectDB from '../src/config/db.js';

dotenv.config();

const analyzeTaxonomy = async () => {
  try {
    await connectDB();

    const laws = await Law.find();
    console.log(`Found ${laws.length} laws to analyze`);

    for (const law of laws) {
      const elements = await Element.find({ lawId: law._id });
      console.log(`Analyzing Law: ${law.title} (${elements.length} elements)`);

      const bulkOps = elements.map((el) => {
        const taxonomy = classifyElement(el);
        return {
          updateOne: {
            filter: { _id: el._id },
            update: { $set: { taxonomy } },
          },
        };
      });

      if (bulkOps.length > 0) {
        await Element.bulkWrite(bulkOps);
        console.log(`  - Updated ${bulkOps.length} elements`);
      }
    }

    console.log('All laws analyzed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error analyzing taxonomy:', error);
    process.exit(1);
  }
};

analyzeTaxonomy();
