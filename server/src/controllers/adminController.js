import User from '../models/User.js';
import Task from '../models/Task.js';

// GET /api/admin/stats
export const getAdminStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const tomorrowStart = new Date(startOfToday);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(endOfToday);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const weekEnd = new Date(startOfToday);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // 7 Days ago boundary for trends
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      totalUsers,
      adminCount,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks,
      dueTodayTasks,
      dueTomorrowTasks,
      dueThisWeekTasks,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'in-progress' }),
      Task.countDocuments({ status: 'pending' }),
      Task.countDocuments({
        status: { $ne: 'completed' },
        dueDate: { $lt: now, $ne: null },
      }),
      Task.countDocuments({ priority: 'high' }),
      Task.countDocuments({ priority: 'medium' }),
      Task.countDocuments({ priority: 'low' }),
      Task.countDocuments({
        status: { $ne: 'completed' },
        dueDate: { $gte: startOfToday, $lte: endOfToday },
      }),
      Task.countDocuments({
        status: { $ne: 'completed' },
        dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
      }),
      Task.countDocuments({
        status: { $ne: 'completed' },
        dueDate: { $gt: tomorrowEnd, $lte: weekEnd },
      }),
    ]);

    // 1. Media and Attachments Deep Breakdown
    const mediaBreakdownAgg = await Task.aggregate([
      { $unwind: '$attachments' },
      {
        $group: {
          _id: '$attachments.fileType',
          count: { $sum: 1 },
          totalBytes: { $sum: '$attachments.size' },
        },
      },
    ]);

    const mediaByType = {
      image: { count: 0, bytes: 0 },
      video: { count: 0, bytes: 0 },
      document: { count: 0, bytes: 0 },
      note: { count: 0, bytes: 0 },
    };

    let totalAttachments = 0;
    let totalAttachmentBytes = 0;

    mediaBreakdownAgg.forEach((item) => {
      const type = item._id || 'document';
      if (mediaByType[type]) {
        mediaByType[type].count = item.count;
        mediaByType[type].bytes = item.totalBytes;
      }
      totalAttachments += item.count;
      totalAttachmentBytes += item.totalBytes;
    });

    // 2. Trend for Last 7 Days (Signups, Task Created, Task Completed)
    const [userSignupsAgg, taskCreatedAgg, taskCompletedAgg] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        { $match: { completedAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const signupsMap = Object.fromEntries(userSignupsAgg.map((x) => [x._id, x.count]));
    const createdMap = Object.fromEntries(taskCreatedAgg.map((x) => [x._id, x.count]));
    const completedMap = Object.fromEntries(taskCompletedAgg.map((x) => [x._id, x.count]));

    const last7DaysTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      const isoDay = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      last7DaysTrend.push({
        date: isoDay,
        label: dayLabel,
        signups: signupsMap[isoDay] || 0,
        created: createdMap[isoDay] || 0,
        completed: completedMap[isoDay] || 0,
      });
    }

    // 3. Power Users / Contributors Leaderboard (Top 5)
    const powerUsers = await User.aggregate([
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'user',
          as: 'tasks',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          totalTasks: { $size: '$tasks' },
          completedTasks: {
            $size: {
              $filter: {
                input: '$tasks',
                as: 't',
                cond: { $eq: ['$$t.status', 'completed'] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalTasks', 0] },
              { $round: [{ $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }] },
              0,
            ],
          },
        },
      },
      { $sort: { completedTasks: -1, totalTasks: -1 } },
      { $limit: 5 },
    ]);

    // 4. User Engagement Metrics
    const usersWithTasksCount = await Task.distinct('user').then((ids) => ids.length);
    const idleUsersCount = Math.max(0, totalUsers - usersWithTasksCount);
    const avgTasksPerUser = totalUsers > 0 ? (totalTasks / totalUsers).toFixed(1) : 0;

    // 5. Average Completion Turnaround Time (in hours)
    const turnaroundAgg = await Task.aggregate([
      { $match: { status: 'completed', completedAt: { $ne: null } } },
      {
        $project: {
          turnaroundHours: {
            $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$turnaroundHours' },
        },
      },
    ]);
    const avgTurnaroundHours = turnaroundAgg[0]?.avgHours ? Math.round(turnaroundAgg[0].avgHours * 10) / 10 : 0;

    // 6. Recent Platform Activity Feed (Latest 8 tasks)
    const recentActivity = await Task.find()
      .populate('user', 'name email role')
      .sort({ updatedAt: -1 })
      .limit(8)
      .select('title status priority dueDate updatedAt user');

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        adminCount,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        overdueTasks,
        highPriorityTasks,
        mediumPriorityTasks,
        lowPriorityTasks,
        dueTodayTasks,
        dueTomorrowTasks,
        dueThisWeekTasks,
        totalAttachments,
        totalAttachmentBytes,
        mediaByType,
        completionRate,
        last7DaysTrend,
        powerUsers,
        usersWithTasksCount,
        idleUsersCount,
        avgTasksPerUser,
        avgTurnaroundHours,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let matchQuery = {};

    if (search && search.trim()) {
      const q = search.trim();
      matchQuery = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      };
    }

    // Aggregate users with their task counts
    const users = await User.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: 'user',
          as: 'userTasks',
        },
      },
      {
        $project: {
          password: 0,
        },
      },
      {
        $addFields: {
          tasksCount: { $size: '$userTasks' },
          completedTasksCount: {
            $size: {
              $filter: {
                input: '$userTasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'completed'] },
              },
            },
          },
          inProgressTasksCount: {
            $size: {
              $filter: {
                input: '$userTasks',
                as: 'task',
                cond: { $eq: ['$$task.status', 'in-progress'] },
              },
            },
          },
          userTasks: '$$REMOVE', // remove full array to keep response light
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Safety check: Cannot demote the last remaining admin
    if (targetUser.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the only remaining administrator in the system',
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User ${targetUser.name} role updated to ${role}`,
      data: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting oneself
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account while logged in',
      });
    }

    // Prevent deleting last admin
    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only remaining administrator in the system',
        });
      }
    }

    // Cascade delete all tasks belonging to this user
    await Task.deleteMany({ user: id });
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `User ${targetUser.name} and their tasks have been removed`,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/tasks
export const getAllTasks = async (req, res, next) => {
  try {
    const { search, priority, status } = req.query;
    const filter = {};

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(250);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/tasks/:id
export const deleteTaskByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Task "${deletedTask.title}" has been deleted by administrator`,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/claim-admin (Convenient helper for development/testing)
export const claimAdminRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'You have been granted administrator privileges',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
