import mongoose from 'mongoose';

const dropoutSchema = new mongoose.Schema({
  traineeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainee',
    required: [true, 'Trainee is required'],
  },
  reason: {
    type: String,
    trim: true,
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Dropout = mongoose.model('Dropout', dropoutSchema);

export default Dropout;
