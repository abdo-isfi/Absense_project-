import mongoose from 'mongoose';
import moment from 'moment';

const traineeAbsenceSchema = new mongoose.Schema({
  traineeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainee',
    required: [true, 'Trainee is required'],
    index: true,
  },
  absenceRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AbsenceRecord',
    required: [true, 'Absence record is required'],
    index: true,
  },
  status: {
    type: String,
    enum: ['absent', 'late', 'present'],
    default: 'present',
  },
  isValidated: {
    type: Boolean,
    default: false,
  },
  isJustified: {
    type: Boolean,
    default: false,
  },
  hasBilletEntree: {
    type: Boolean,
    default: false,
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  validatedAt: {
    type: Date,
    default: null,
  },
  justificationComment: {
    type: String,
    default: null,
  },
  validationComment: {
    type: String,
    default: null,
  },
  absenceHours: {
    type: Number,
    default: 0,
    get: v => Math.round(v * 10) / 10,
    set: v => Math.round(v * 10) / 10,
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

// Compound indexes
traineeAbsenceSchema.index({ traineeId: 1, status: 1 });

// Method to calculate absence hours based on time range and status
traineeAbsenceSchema.methods.calculateAbsenceHours = async function() {
  if (this.status === 'present') {
    return 0;
  }
  
  if (this.status === 'late') {
    return 1; // Fixed 1 hour for late arrivals
  }
  
  // For absent status, calculate based on time range
  const AbsenceRecord = mongoose.model('AbsenceRecord');
  const record = await AbsenceRecord.findById(this.absenceRecordId);
  
  if (!record) {
    return 0;
  }
  
  const start = moment(record.startTime, 'HH:mm');
  const end = moment(record.endTime, 'HH:mm');
  const hours = end.diff(start, 'hours', true);
  
  return Math.round(hours * 10) / 10;
};

// Pre-save hook to calculate absence hours
traineeAbsenceSchema.pre('save', async function(next) {
  if (this.isModified('status') || this.isModified('absenceRecordId') || this.isNew) {
    this.absenceHours = await this.calculateAbsenceHours();
  }
  next();
});

const TraineeAbsence = mongoose.model('TraineeAbsence', traineeAbsenceSchema);

export default TraineeAbsence;
