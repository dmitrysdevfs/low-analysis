import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const lawSchema = new mongoose.Schema({
  title: String,
  code: String,
  totalArticles: Number,
  totalSections: Number,
});

const elementSchema = new mongoose.Schema({
  lawId: mongoose.Schema.Types.ObjectId,
  type: String,
  code: String,
  number: String,
  text: String,
  order: Number,
});

const Law = mongoose.model('Law', lawSchema);
const Element = mongoose.model('Element', elementSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB\n');

  const laws = await Law.find({}).sort({ code: 1 });

  for (const law of laws) {
    // Count articles in DB (same logic as updateLawStatsFromDb)
    const dbArticleCount = await Element.countDocuments({
      lawId: law._id,
      type: 'article',
      $nor: [{ text: /^\{[^}]*виключено/i }, { text: /^\{[^}]*вилучено/i }],
    });
    const dbAllArticleCount = await Element.countDocuments({
      lawId: law._id,
      type: 'article',
    });
    const excluded = dbAllArticleCount - dbArticleCount;

    const match = law.totalArticles === dbArticleCount ? '✅' : '❌';
    console.log(`${match} "${law.title}" (${law.code})`);
    console.log(
      `   Law.totalArticles: ${law.totalArticles} | DB active: ${dbArticleCount} | DB total (incl. excl.): ${dbAllArticleCount} | Excluded: ${excluded}`,
    );
  }

  await mongoose.disconnect();
}

run().catch(console.error);
