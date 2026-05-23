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

  const allLaws = await Law.find({});
  console.log(`Total laws in DB: ${allLaws.length}`);

  for (const law of allLaws) {
    const articles = await Element.find({ lawId: law._id, type: 'article' });
    const emptyNumArticles = articles.filter((art) => !art.number);
    const excludedArticles = articles.filter(
      (art) =>
        art.text &&
        (art.text.toLowerCase().includes('виключено') ||
          (art.title && art.title.toLowerCase().includes('виключено'))),
    );

    console.log(`Law: "${law.title}" (${law.code})`);
    console.log(`  - Total Articles in DB: ${articles.length}`);
    console.log(
      `  - Articles with empty/null number: ${emptyNumArticles.length}`,
    );
    console.log(
      `  - Articles containing "виключено": ${excludedArticles.length}`,
    );
    if (emptyNumArticles.length > 0) {
      emptyNumArticles.forEach((art) => {
        console.log(
          `    * Empty Num Art: Code: ${art.code}, Title: "${art.title}", Text preview: "${art.text ? art.text.substring(0, 50) : 'NULL'}"`,
        );
      });
    }
    if (excludedArticles.length > 0) {
      excludedArticles.forEach((art) => {
        console.log(
          `    * Excluded Art: Code: ${art.code}, Num: "${art.number}", Title: "${art.title}", Text preview: "${art.text ? art.text.substring(0, 50) : 'NULL'}"`,
        );
      });
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
