import mongoose from 'mongoose';

const StageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Stage must belong to a user'],
      index: true,
    },
    /**
     * Optional: if set, this stage is local to the specified sprint.
     * If null/absent, the stage is global (shared across all sprints).
     */
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a stage name'],
      trim: true,
      maxlength: [50, 'Stage name cannot exceed 50 characters'],
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    color: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

StageSchema.index({ userId: 1, order: 1 });
StageSchema.index({ userId: 1, sprintId: 1 });

export default mongoose.models.Stage || mongoose.model('Stage', StageSchema);
