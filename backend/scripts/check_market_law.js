import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const elementSchema = new mongoose.Schema({
  lawId: mongoose.Schema.Types.ObjectId,
  type: String,
  code: String,
  number: String,
  title: String,
  text: String,
  parentId: mongoose.Schema.Types.ObjectId,
  depth: Number,
  order: Number,
});

const Element = mongoose.model('Element', elementSchema);

const lawSchema = new mongoose.Schema({
  title: String,
  code: String,
  totalArticles: Number,
  totalSections: Number,
});

const Law = mongoose.model('Law', lawSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const law = await Law.findOne({ code: '2019-19' });
  if (!law) {
    console.log('Law 2019-19 not found in DB');
    process.exit(0);
  }

  console.log(`Found Law: ${law.title} (ID: ${law._id})`);

  const sections = await Element.find({ lawId: law._id, type: 'section' }).sort(
    { order: 1 },
  );
  console.log(`Total sections: ${sections.length}`);
  sections.forEach((sec) => {
    console.log(
      `- Code: ${sec.code}, Num: "${sec.number}", Title: "${sec.title.substring(0, 60)}"`,
    );
  });

  // Find all elements where code contains rz17 or is child of rz17
  const rz17 = sections.find(
    (s) => s.code.includes('rz17') || s.number === '17',
  );
  if (rz17) {
    console.log(`\nFound Section XVII: Code: ${rz17.code}, ID: ${rz17._id}`);
    const children = await Element.find({
      lawId: law._id,
      parentId: rz17._id,
    }).sort({ order: 1 });
    console.log(`Children count in DB: ${children.length}`);
    children.forEach((ch) => {
      console.log(
        `  * Child: Code: ${ch.code}, Type: ${ch.type}, Num: "${ch.number}", Title: "${ch.title ? ch.title.substring(0, 50) : ''}", Text preview: "${ch.text ? ch.text.substring(0, 50) : ''}"`,
      );
    });
  } else {
    console.log('\nSection XVII (17) not found in DB sections!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
