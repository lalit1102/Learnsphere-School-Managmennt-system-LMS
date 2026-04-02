import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/learnsphere')
  .then(() => {
    return mongoose.connection.collection('timetables').findOne({ _id: new mongoose.Types.ObjectId('69ce188da74111fdea6f59d9') });
  })
  .then(doc => {
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
