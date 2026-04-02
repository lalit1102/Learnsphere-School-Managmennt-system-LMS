import mongoose from 'mongoose';
import Timetable from './src/models/timetable.js';

mongoose.connect('mongodb://localhost:27017/learnsphere')
  .then(() => {
    return Timetable.findOne({ class: new mongoose.Types.ObjectId('69ce56722578c1619fcdebe6') });
  })
  .then(doc => {
    if(doc) {
      console.log("Timetable found!", JSON.stringify({
        _id: doc._id,
        periodsPerDay: doc.schedule[0]?.periods?.length
      }, null, 2));
    } else {
      console.log("No timetable yet.");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
