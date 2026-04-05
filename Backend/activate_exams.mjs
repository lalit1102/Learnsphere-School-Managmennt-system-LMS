import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/learnsphere');

// Activate all exams for Ansh's class
const result = await mongoose.connection.db.collection('exams').updateMany(
  { class: new mongoose.Types.ObjectId('69ce56722578c1619fcdebe6') },
  { $set: { isActive: true } }
);

console.log(`Activated ${result.modifiedCount} exams for class 69ce56722578c1619fcdebe6`);

process.exit();
