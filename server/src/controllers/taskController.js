import mongoose from 'mongoose';
import Task from '../models/Task.js';

export const getTasks = async (req, res, next) => {
  try {
    const { status, view } = req.query;
    const filter = { user: req.user._id };

    if (view === 'history' || status === 'completed') {
      filter.status = 'completed';
    } else if (view === 'active') {
      filter.status = { $ne: 'completed' };
    } else if (status) {
      filter.status = status;
    }

    // Sort completed tasks by completedAt desc, active tasks by dueDate or createdAt desc
    const sortField = filter.status === 'completed' ? { completedAt: -1, updatedAt: -1 } : { createdAt: -1 };
    const tasks = await Task.find(filter).sort(sortField);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, attachments } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required',
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date and time is mandatory',
      });
    }

    const isCompleted = status === 'completed';

    const task = await Task.create({
      user: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'pending',
      priority: priority || 'medium',
      dueDate: new Date(dueDate),
      completedAt: isCompleted ? new Date() : null,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const existingTask = await Task.findOne({ _id: id, user: req.user._id });
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized',
      });
    }

    const updates = { ...req.body };

    // Maintain completedAt timestamp automatically based on status transition
    if (updates.status === 'completed' && existingTask.status !== 'completed') {
      updates.completedAt = new Date();
    } else if (updates.status && updates.status !== 'completed' && existingTask.status === 'completed') {
      updates.completedAt = null;
    }

    if (updates.dueDate !== undefined) {
      if (!updates.dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date and time cannot be empty',
        });
      }
      updates.dueDate = new Date(updates.dueDate);
    }

    if (updates.attachments !== undefined) {
      updates.attachments = Array.isArray(updates.attachments) ? updates.attachments : [];
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const deletedTask = await Task.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task removed successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};