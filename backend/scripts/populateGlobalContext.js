import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import Law from '../src/models/Law.js';
import Element from '../src/models/Element.js';
import { extractDefinitions } from '../src/utils/definitionExtractor.js';
import { fetchLawData } from '../src/services/fetchService.js';
import { parseLawHtml } from '../src/services/parserService.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const run = async () => {
  await connectDB();
  console.log('🔄 Starting global_context population migration...');

  try {
    const laws = await Law.find({});
    console.log(`Found ${laws.length} laws in the database.`);

    let updatedCount = 0;

    for (const law of laws) {
      console.log(`\nProcessing: ${law.title} (${law.code})...`);

      let html = null;
      let mainHtml = null;

      // 1. Try to load HTML locally
      const cleanCode = law.code.replace('/', '_');
      const localFramePath = path.resolve(
        __dirname,
        `../data/raw/${cleanCode}_frame.html`,
      );
      const localFramePathAlt = path.resolve(
        __dirname,
        `../data/raw/${cleanCode}.frame.html`,
      );
      const localMainPath = path.resolve(
        __dirname,
        `../data/raw/${cleanCode}.html`,
      );

      try {
        html = await fs.readFile(localFramePath, 'utf-8');
        console.log(`  Found local frame HTML at ${localFramePath}`);
      } catch (e) {
        try {
          html = await fs.readFile(localFramePathAlt, 'utf-8');
          console.log(`  Found local frame HTML at ${localFramePathAlt}`);
        } catch (e2) {
          // not found locally
        }
      }

      try {
        mainHtml = await fs.readFile(localMainPath, 'utf-8');
        console.log(`  Found local main HTML at ${localMainPath}`);
      } catch (e) {
        // not found locally
      }

      // 2. Fetch from remote if not found locally
      if (!html) {
        try {
          console.log(
            `  Local files not found. Fetching online for code: ${law.code}...`,
          );
          const remoteData = await fetchLawData(law.code);
          html = remoteData.frameHtml;
          mainHtml = remoteData.mainHtml;
          console.log(`  Successfully fetched online.`);
        } catch (fetchErr) {
          console.error(`  ❌ Failed to fetch law online: ${fetchErr.message}`);
          continue;
        }
      }

      // 3. Parse HTML
      const parsedData = parseLawHtml(html, mainHtml);
      if (!parsedData.title || !parsedData.code) {
        console.error(`  ❌ Failed to parse HTML for ${law.code}`);
        continue;
      }

      // 4. Extract definitions from existing elements in DB
      const elements = await Element.find({
        lawId: law._id,
        code: { $regex: /\.(st1|st2)\./ },
      });

      let definitions = [];
      if (elements.length > 0) {
        definitions = extractDefinitions(elements);
      } else {
        // Fallback: extract definitions from parsed elements
        const parsedDefElements = parsedData.elements.filter(
          (el) => el.code.includes('.st1.') || el.code.includes('.st2.'),
        );
        definitions = extractDefinitions(parsedDefElements);
      }

      // 5. Update Law
      await Law.updateOne(
        { _id: law._id },
        {
          $set: {
            preamble: parsedData.preamble,
            signatory: parsedData.signatory,
            status: parsedData.status || law.status,
            global_context: {
              preamble: parsedData.preamble,
              definitions,
            },
          },
        },
      );

      console.log(
        `  ✅ Extracted preamble: ${parsedData.preamble ? parsedData.preamble.substring(0, 60) + '...' : 'NULL'}`,
      );
      console.log(`  ✅ Extracted ${definitions.length} definitions`);
      updatedCount++;
    }

    console.log(`\n🎉 Migration completed! Updated ${updatedCount} laws.`);
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    process.exit(0);
  }
};

run();
