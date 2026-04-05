import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/learnsphere');

const exams = await mongoose.connection.db.collection('exams').find({}).toArray();

console.log('\n=== ALL EXAMS ===');
for (const e of exams) {
  console.log(`TITLE: ${e.title}`);
  console.log(`  CLASS: ${e.class}`);
  console.log(`  ACTIVE: ${e.isActive}`);
  console.log('---');
}

console.log('\n=== STUDENT ANSH CLASS ===');
console.log('Student class: 69ce56722578c1619fcdebe6');

const matching = exams.filter(e => 
  e.class?.toString() === '69ce56722578c1619fcdebe6' && e.isActive === true
);
console.log(`Matching active exams for student: ${matching.length}`);
matching.forEach(e => console.log(`  - ${e.title}`));

process.exit();
