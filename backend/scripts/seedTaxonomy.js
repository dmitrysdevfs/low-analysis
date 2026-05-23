import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Taxonomy from '../src/models/Taxonomy.js';
import Subject from '../src/models/Subject.js';
import connectDB from '../src/config/db.js';

dotenv.config();

const seedTaxonomy = async () => {
  try {
    await connectDB();

    // 1. Clear existing taxonomies (optional, handle with care)
    // await Taxonomy.deleteMany({});

    const categories = [
      {
        name: 'Надавачі фінансових послуг',
        slug: 'financial-service-providers',
        children: [
          { name: 'Банки', slug: 'banks' },
          { name: 'Страховики', slug: 'insurers' },
          { name: 'Кредитні спілки', slug: 'credit-unions' },
          { name: 'Ломбарди', slug: 'pawn-shops' },
          { name: 'Фінансові компанії', slug: 'finance-companies' },
          { name: 'Оператори поштового зв’язку', slug: 'postal-operators' },
          {
            name: 'Філії іноземних фінансових установ',
            slug: 'foreign-branches',
          },
        ],
      },
      {
        name: 'Регулятори',
        slug: 'regulators',
        children: [
          { name: 'НБУ', slug: 'nbu' },
          { name: 'НКЦПФР', slug: 'nssmc' },
        ],
      },
      {
        name: 'Клієнти та отримувачі послуг',
        slug: 'clients-and-recipients',
        children: [
          { name: 'Споживачі (фізичні особи)', slug: 'consumers-individuals' },
          {
            name: 'Клієнти (юридичні особи, ФОП та фізичні особи)',
            slug: 'clients-all',
          },
        ],
      },
      {
        name: "Посередники та суміжні суб'єкти",
        slug: 'intermediaries-and-related',
        children: [
          { name: 'Кредитні посередники', slug: 'credit-intermediaries' },
          { name: 'Страхові посередники', slug: 'insurance-intermediaries' },
          { name: 'Аудитори та аудиторські фірми', slug: 'auditors' },
          {
            name: 'Особи, які надають супровідні послуги',
            slug: 'supporting-services',
          },
        ],
      },
      {
        name: 'Об’єднання та структури',
        slug: 'associations-and-structures',
        children: [
          {
            name: 'Професійні об’єднання надавачів фінансових послуг',
            slug: 'professional-associations',
          },
          { name: 'Саморегулівні організації (СРО)', slug: 'sro' },
          { name: 'Учасники фінансових груп', slug: 'financial-group-members' },
        ],
      },
      {
        name: 'Державні органи',
        slug: 'government-bodies',
        children: [
          { name: 'Міністерства', slug: 'ministries' },
          { name: 'Судові органи', slug: 'judicial-bodies' },
        ],
      },
      {
        name: 'Бізнес',
        slug: 'business',
        children: [
          { name: 'ФОП', slug: 'fop' },
          { name: 'Юридичні особи', slug: 'legal-entities' },
        ],
      },
    ];

    for (const cat of categories) {
      const parent = await Taxonomy.findOneAndUpdate(
        { slug: cat.slug },
        { name: cat.name, slug: cat.slug },
        { upsert: true, new: true },
      );

      if (cat.children) {
        for (const child of cat.children) {
          await Taxonomy.findOneAndUpdate(
            { slug: child.slug },
            { name: child.name, slug: child.slug, parentId: parent._id },
            { upsert: true },
          );
        }
      }
    }

    console.log('Taxonomy seeded successfully');

    // Link existing subjects to categories (Example logic)
    // This is just a placeholder; in a real scenario, you'd match subjects by name/alias
    const nbuCategory = await Taxonomy.findOne({ slug: 'nbu' });
    if (nbuCategory) {
      await Subject.updateMany(
        { canonical_name: /Національний банк України/i },
        { $addToSet: { taxonomies: nbuCategory._id } },
      );
    }

    const banksCategory = await Taxonomy.findOne({ slug: 'banks' });
    if (banksCategory) {
      await Subject.updateMany(
        { legal_status: 'legal_entity', canonical_name: /банк/i },
        { $addToSet: { taxonomies: banksCategory._id } },
      );
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding taxonomy:', error);
    process.exit(1);
  }
};

seedTaxonomy();
