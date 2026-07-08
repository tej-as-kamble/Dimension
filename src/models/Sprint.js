import mongoose from 'mongoose';

const SprintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sprint must belong to a user'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a sprint name'],
      trim: true,
      maxlength: [100, 'Sprint name cannot exceed 100 characters'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    sprintGoal: {
      type: String,
      trim: true,
      maxlength: [500, 'Sprint goal cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

SprintSchema.index({ userId: 1, createdAt: -1 });

/**
 * Validation: endDate must be after startDate
 */
SprintSchema.pre('validate', function () {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
});

export default mongoose.models.Sprint || mongoose.model('Sprint', SprintSchema);
