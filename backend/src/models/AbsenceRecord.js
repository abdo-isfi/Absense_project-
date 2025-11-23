import mongoose from 'mongoose';

const absenceRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required'],
    index: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null,
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  isValidated: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index for date and group
absenceRecordSchema.index({ date: 1, groupId: 1 });

const AbsenceRecord = mongoose.model('AbsenceRecord', absenceRecordSchema);

export default AbsenceRecord;
