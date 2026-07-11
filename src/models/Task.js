import mongoose from 'mongoose';

/**
 * Flexible enums — adding new values only requires appending to these arrays.
 */
const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

/**
 * Activity Log sub-document schema.
 * Each entry records a timestamped action description for the audit trail.
 */
const ActivityLogSchema = new mongoose.Schema(
  {
    actionDescription: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false, // No need for individual _id on sub-documents
  }
);

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
      index: true,
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      required: [true, 'Task must belong to a sprint'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    taskType: {
      type: String,
      enum: {
        values: ['Story', 'Feature', 'Bug'],
        message: '{VALUE} is not a valid task type',
      },
      required: [true, 'Please provide a task type'],
    },
    deadline: {
      type: Date,
    },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITIES,
        message: '{VALUE} is not a valid priority',
      },
      default: 'Medium',
    },
    stage: {
      type: String,
      default: 'To Do',
    },
    order: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    activityLog: [ActivityLogSchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient sprint view queries
TaskSchema.index({ userId: 1, sprintId: 1, stage: 1 });

export { TASK_PRIORITIES };
export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
