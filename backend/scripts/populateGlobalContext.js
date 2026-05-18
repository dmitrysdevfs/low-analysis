import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import Law from '../src/models/Law.js';
import Element from '../src/models/Element.js';

dotenv.config();

/**
 * Extracts definitions from Article 1 elements (same logic as parserService).
 */
const extractDefinitions = (elements) => {
  const definitions = [];
  const st1Elements = elements.filter(
    (el) => el.code && el.code.includes('.st1.') && el.text,
  );

  for (const el of st1Elements) {
    const text = el.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Try matching with quotes: 1) "term" - def or термін "term" - def
    let match = text.match(
      /^(?:\d+\)\s*)?(?:термін\s+)?["']([^"']+)["']\s*[-–—]\s*(.+)$/i,
    );

    // 2. Try without quotes: 1) term - def
    if (!match) {
      match = text.match(
        /^(?:\d+\)\s*)?(?:терміни?\s+)?([^-–—]+?)\s*[-–—]\s*(.+)$/i,
      );
    }

    if (match) {
      let term = match[1].trim();
      let definition = match[2].trim();
      if (term && definition && term.length < 150) {
        definitions.push({ term, definition });
      }
    }
  }
  return definitions;
};

const run = async () => {
  await connectDB();
  console.log('🔄 Starting global_context population migration...');

  try {
    const laws = await Law.find({});
    console.log(`Found ${laws.length} laws in the database.`);

    let updatedCount = 0;

    for (const law of laws) {
      // Find elements for this law that belong to Article 1
      const elements = await Element.find({
        lawId: law._id,
        code: { $regex: /\.st1\./ },
      });

      if (elements.length === 0) {
        console.log(
          `⚠️  No Article 1 elements found for law: ${law.title} (${law.code})`,
        );
        continue;
      }

      const definitions = extractDefinitions(elements);

      if (definitions.length > 0) {
        // Keep existing preamble if it exists
        const currentContext = law.global_context || {};

        await Law.updateOne(
          { _id: law._id },
          {
            $set: {
              global_context: {
                preamble: currentContext.preamble || null,
                definitions,
              },
            },
          },
        );
        console.log(
          `✅ Extracted ${definitions.length} definitions for law: ${law.title} (${law.code})`,
        );
        updatedCount++;
      } else {
        console.log(
          `ℹ️  No definitions extracted for law: ${law.title} (${law.code})`,
        );
      }
    }

    console.log(`🎉 Migration completed! Updated ${updatedCount} laws.`);
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    process.exit(0);
  }
};

run();
