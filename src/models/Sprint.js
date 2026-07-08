import mongoose from 'mongoose';

/**
 * Flexible status enum for Sprints.
 * Adding new statuses only requires adding a string to this array.
 */
const SPRINT_STATUSES = ['Planning', 'Active', 'Closed'];

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
      required: [true, 'Please provide a start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date'],
    },
    sprintGoal: {
      type: String,
      trim: true,
      maxlength: [500, 'Sprint goal cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: SPRINT_STATUSES,
        message: '{VALUE} is not a valid sprint status',
      },
      default: 'Planning',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient dashboard queries
SprintSchema.index({ userId: 1, status: 1 });
SprintSchema.index({ userId: 1, createdAt: -1 });

/**
 * Validation: endDate must be after startDate
 */
SprintSchema.pre('validate', function () {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
});

export { SPRINT_STATUSES };
export default mongoose.models.Sprint || mongoose.model('Sprint', SprintSchema);
