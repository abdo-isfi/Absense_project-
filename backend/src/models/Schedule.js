import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  day: {
    type: String,
    required: [true, 'Day is required'],
    enum: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    enum: ['08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:30'],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Group is required'],
  },
  room: {
    type: String,
    required: [true, 'Room is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Session type is required'],
    enum: ['Cours', 'TD', 'TP'],
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher is required'],
    index: true,
  },
  sessions: [sessionSchema],
  weekNumber: {
    type: Number,
    default: 1,
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    default: () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      // Academic year starts in September (month 8)
      return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
scheduleSchema.index({ teacher: 1, academicYear: 1, weekNumber: 1 });
scheduleSchema.index({ 'sessions.group': 1 });

// Virtual for total hours calculation
scheduleSchema.virtual('totalHours').get(function() {
  return this.sessions.length * 2.5; // Each slot is 2.5 hours
});

// Ensure virtuals are included in JSON
scheduleSchema.set('toJSON', { virtuals: true });
scheduleSchema.set('toObject', { virtuals: true });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
