'use server';

import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import Sprint from '@/models/Sprint';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Helper: Get the authenticated user's ID or throw.
 */
async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

/**
 * Chronological Logging Engine
 * Compares old and new values for tracked fields and generates activity log entries.
 */
function generateActivityLogEntries(oldTask, newValues) {
  const entries = [];
  const trackedFields = [
    { field: 'priority', label: 'priority' },
    { field: 'stage', label: 'stage' },
    { field: 'title', label: 'title' },
  ];

  for (const { field, label } of trackedFields) {
    if (
      newValues[field] !== undefined &&
      newValues[field] !== oldTask[field]
    ) {
      entries.push({
        actionDescription: `Changed ${label} from '${oldTask[field]}' to '${newValues[field]}'`,
        timestamp: new Date(),
      });
    }
  }

  // Description changes are tracked but don't log the full content
  if (
    newValues.description !== undefined &&
    newValues.description !== oldTask.description
  ) {
    entries.push({
      actionDescription: 'Updated description',
      timestamp: new Date(),
    });
  }

  return entries;
}

/**
 * Create a new Task within a Sprint.
 */
export async function createTask(formData) {
  try {
    const userId = await getAuthUserId();

    const sprintId = formData.get('sprintId');
    const title = formData.get('title')?.trim();
    const description = formData.get('description') || '';
    const priority = formData.get('priority') || 'Medium';
    const stage = formData.get('stage') || 'To Do';

    if (!sprintId || !title) {
      return { error: 'Sprint and title are required' };
    }

    await dbConnect();

    // Verify sprint exists and belongs to user
    const sprint = await Sprint.findOne({ _id: sprintId, userId });
    if (!sprint) {
      return { error: 'Sprint not found' };
    }

    const task = await Task.create({
      userId,
      sprintId,
      title,
      description,
      priority,
      stage,
      activityLog: [
        {
          actionDescription: 'Created task',
          timestamp: new Date(),
        },
      ],
    });

    revalidatePath(`/dashboard/sprints/${sprintId}`);

    return {
      success: true,
      task: JSON.parse(JSON.stringify(task)),
    };
  } catch (error) {
    console.error('Create task error:', error);
    return { error: error.message || 'Failed to create task' };
  }
}

/**
 * Get all Tasks for a Sprint, grouped by stage.
 */
export async function getTasksBySprintId(sprintId) {
  try {
    const userId = await getAuthUserId();

    await dbConnect();

    const tasks = await Task.find({ sprintId, userId })
      .sort({ createdAt: -1 })
      .lean();

    const serialized = tasks.map((task) => ({
      ...task,
      _id: task._id.toString(),
      userId: task.userId.toString(),
      sprintId: task.sprintId.toString(),
    }));

    // Group by stage
    const grouped = {
      'To Do': serialized.filter((t) => t.stage === 'To Do'),
      'In Progress': serialized.filter((t) => t.stage === 'In Progress'),
      Done: serialized.filter((t) => t.stage === 'Done'),
    };

    return {
      success: true,
      tasks: JSON.parse(JSON.stringify(serialized)),
      grouped: JSON.parse(JSON.stringify(grouped)),
    };
  } catch (error) {
    console.error('Get tasks error:', error);
    return { error: 'Failed to fetch tasks' };
  }
}

/**
 * Get a single Task by ID (with ownership check).
 */
export async function getTaskById(taskId) {
  try {
    const userId = await getAuthUserId();

    await dbConnect();

    const task = await Task.findOne({ _id: taskId, userId }).lean();

    if (!task) {
      return { error: 'Task not found' };
    }

    return {
      success: true,
      task: JSON.parse(
        JSON.stringify({
          ...task,
          _id: task._id.toString(),
          userId: task.userId.toString(),
          sprintId: task.sprintId.toString(),
        })
      ),
    };
  } catch (error) {
    console.error('Get task error:', error);
    return { error: 'Failed to fetch task' };
  }
}

/**
 * Update a Task. Automatically generates activity log entries for tracked field changes.
 */
export async function updateTask(taskId, formData) {
  try {
    const userId = await getAuthUserId();

    await dbConnect();

    // Fetch existing task to compare
    const existingTask = await Task.findOne({ _id: taskId, userId });
    if (!existingTask) {
      return { error: 'Task not found' };
    }

    const updates = {};
    const title = formData.get('title')?.trim();
    const description = formData.get('description');
    const priority = formData.get('priority');
    const stage = formData.get('stage');

    if (title) updates.title = title;
    if (description !== null && description !== undefined)
      updates.description = description;
    if (priority) updates.priority = priority;
    if (stage) updates.stage = stage;

    // Chronological Logging Engine: generate log entries for changes
    const logEntries = generateActivityLogEntries(existingTask, updates);

    // Apply updates and push log entries
    const updateQuery = { ...updates };
    const pushQuery =
      logEntries.length > 0
        ? { $push: { activityLog: { $each: logEntries } }, $set: updateQuery }
        : { $set: updateQuery };

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      logEntries.length > 0 ? pushQuery : { $set: updateQuery },
      { new: true, runValidators: true }
    ).lean();

    revalidatePath(`/dashboard/sprints/${existingTask.sprintId}`);
    revalidatePath(
      `/dashboard/sprints/${existingTask.sprintId}/tasks/${taskId}`
    );

    return {
      success: true,
      task: JSON.parse(JSON.stringify(task)),
    };
  } catch (error) {
    console.error('Update task error:', error);
    return { error: error.message || 'Failed to update task' };
  }
}

/**
 * Delete a Task (with ownership check).
 */
export async function deleteTask(taskId) {
  try {
    const userId = await getAuthUserId();

    await dbConnect();

    const task = await Task.findOneAndDelete({ _id: taskId, userId });

    if (!task) {
      return { error: 'Task not found' };
    }

    revalidatePath(`/dashboard/sprints/${task.sprintId}`);

    return { success: true, message: 'Task deleted successfully' };
  } catch (error) {
    console.error('Delete task error:', error);
    return { error: 'Failed to delete task' };
  }
}
