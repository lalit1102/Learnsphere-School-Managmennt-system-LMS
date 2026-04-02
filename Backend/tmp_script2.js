import mongoose from 'mongoose';
import Timetable from './src/models/timetable.js';
// need to load other models for populate to work
import './src/models/subject.js';
import './src/models/user.js';
import './src/models/class.js';

mongoose.connect('mongodb://localhost:27017/learnsphere')
  .then(() => {
    return Timetable.findOne({ _id: new mongoose.Types.ObjectId('69ce188da74111fdea6f59d9') })
      .populate("schedule.periods.subject", "name code")
      .populate("schedule.periods.teacher", "name email");
  })
  .then(doc => {
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
