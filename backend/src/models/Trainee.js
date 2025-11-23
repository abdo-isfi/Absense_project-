import mongoose from 'mongoose';

const traineeSchema = new mongoose.Schema({
  cef: {
    type: String,
    required: [true, 'CEF is required'],
    unique: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  groupe: {
    type: String,
    required: [true, 'Groupe is required'],
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    trim: true,
    default: null,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for class (alias for groupe)
traineeSchema.virtual('class').get(function() {
  return this.groupe;
});

// Method to calculate total absence hours
traineeSchema.methods.calculateTotalAbsenceHours = async function() {
  const TraineeAbsence = mongoose.model('TraineeAbsence');
  const absences = await TraineeAbsence.find({
    traineeId: this._id,
    isJustified: false,
    status: 'absent',
  });
  
  let totalHours = 0;
  for (const absence of absences) {
    totalHours += absence.absenceHours || 0;
  }
  
  return totalHours;
};

// Method to calculate disciplinary note
traineeSchema.methods.calculateDisciplinaryNote = async function() {
  const TraineeAbsence = mongoose.model('TraineeAbsence');
  
  const absenceHours = await this.calculateTotalAbsenceHours();
  
  const lateArrivals = await TraineeAbsence.countDocuments({
    traineeId: this._id,
    status: 'late',
  });
  
  const absenceDeduction = Math.floor(absenceHours / 2.5) * 0.5;
  const latenessDeduction = Math.floor(lateArrivals / 4) * 1;
  
  const finalNote = Math.max(0, 20 - absenceDeduction - latenessDeduction);
  
  return Math.round(finalNote * 10) / 10;
};

const Trainee = mongoose.model('Trainee', traineeSchema);

export default Trainee;
