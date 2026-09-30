import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    fileType: { type: String, default: 'file' }, // 'image', 'video', 'document', 'note'
    size: { type: Number, default: 0 },
    dataUrl: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      required: [true, 'Scheduled date and time is mandatory'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    attachments: [attachmentSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Task', taskSchema);