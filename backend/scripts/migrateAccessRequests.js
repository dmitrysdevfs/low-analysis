import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Connecting to DB...');
  if (!process.env.MONGODB_URI) {
    console.error(
      'Error: MONGODB_URI is not defined in environment variables.',
    );
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const collection = mongoose.connection.db.collection(
    'legislatoraccessrequests',
  );
  const docs = await collection.find({}).toArray();

  console.log(`Found ${docs.length} access requests to process.`);
  let migratedCount = 0;

  for (const doc of docs) {
    const updateFields = {};
    const unsetFields = {};

    // 1. user_id -> userId
    if ('user_id' in doc && !('userId' in doc)) {
      updateFields.userId = doc.user_id;
      unsetFields.user_id = '';
    }

    // 2. reviewed_by -> reviewedBy
    if ('reviewed_by' in doc && !('reviewedBy' in doc)) {
      updateFields.reviewedBy = doc.reviewed_by;
      unsetFields.reviewed_by = '';
    }

    // 3. review_note -> adminNote
    if ('review_note' in doc && !('adminNote' in doc)) {
      updateFields.adminNote = doc.review_note;
      unsetFields.review_note = '';
    }

    // 4. organization + reason -> message
    if (('organization' in doc || 'reason' in doc) && !('message' in doc)) {
      const parts = [];
      if (doc.organization) {
        parts.push(`Організація: ${doc.organization}`);
      }
      if (doc.reason) {
        parts.push(`Причина: ${doc.reason}`);
      }
      updateFields.message = parts.join('. ');

      if ('organization' in doc) unsetFields.organization = '';
      if ('reason' in doc) unsetFields.reason = '';
    }

    // Apply updates if there are any changes to be made
    if (
      Object.keys(updateFields).length > 0 ||
      Object.keys(unsetFields).length > 0
    ) {
      const updateDoc = {};
      if (Object.keys(updateFields).length > 0) {
        updateDoc.$set = updateFields;
      }
      if (Object.keys(unsetFields).length > 0) {
        updateDoc.$unset = unsetFields;
      }

      await collection.updateOne({ _id: doc._id }, updateDoc);
      console.log(`Migrated access request _id: ${doc._id}`);
      migratedCount++;
    }
  }

  console.log(`Migration completed. Migrated ${migratedCount} documents.`);
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
