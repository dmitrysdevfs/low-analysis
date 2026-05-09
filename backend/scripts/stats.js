import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Element from '../src/models/Element.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const lawCode = '1953-20'; // Financial Services Law
  
  const allElements = await Element.find({ code: { $regex: `^${lawCode}` } });
  
  let depthCounts = {};
  let typeCounts = {
    pu: 0,
    pp: 0,
    ppa: 0,
    ch: 0
  };
  
  allElements.forEach(el => {
    depthCounts[el.depth] = (depthCounts[el.depth] || 0) + 1;
    
    // leaf node id
    if (el.code) {
      const parts = el.code.split('.');
      const leaf = parts[parts.length - 1];
      if (leaf.startsWith('pu')) typeCounts.pu++;
      if (leaf.startsWith('pp') && !leaf.startsWith('ppa') && !leaf.startsWith('ppb')) typeCounts.pp++;
      if (leaf.startsWith('ppa') || leaf.startsWith('ppb') || leaf.startsWith('ppc')) typeCounts.ppa++;
      if (leaf.startsWith('ch')) typeCounts.ch++;
    }
  });

  console.log(`Total elements for ${lawCode}:`, allElements.length);
  console.log('Counts by Depth:', depthCounts);
  console.log('Breakdown by prefixes:', typeCounts);
  
  process.exit(0);
}

run();
