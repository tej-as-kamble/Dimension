import mongoose from 'mongoose';

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a tag name'],
      trim: true,
      maxlength: [30, 'Tag name cannot be more than 30 characters'],
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      // If null/undefined, it can be considered a global tag
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tag must belong to a user'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of tag names within a sprint/global scope per user
TagSchema.index({ name: 1, sprintId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Tag || mongoose.model('Tag', TagSchema);
