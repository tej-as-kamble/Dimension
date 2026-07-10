'use server';

import dbConnect from '@/lib/dbConnect';
import Task from '@/models/Task';
import Sprint from '@/models/Sprint';
import Stage from '@/models/Stage';
import Tag from '@/models/Tag';
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
 * Process tags: filter out isNew tags, create them in DB, and return array of ObjectIds.
 */
async function processTags(tags, sprintId, userId) {
  const processedTags = [];
  for (const tag of tags) {
    if (tag.isNew) {
      let existing = await Tag.findOne({ name: tag.name, userId, $or: [{sprintId: null}, {sprintId}] });
      if (!existing) {
        existing = await Tag.create({ name: tag.name, sprintId, userId });
      }
      processedTags.push(existing._id);
    } else {
      processedTags.push(tag._id || tag);
    }
  }
  return processedTags;
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
    let tags = [];
    try {
      const tagsStr = formData.get('tags');
      if (tagsStr) tags = JSON.parse(tagsStr);
    } catch (e) {
      console.error('Failed to parse tags:', e);
    }

    if (!sprintId || !title) {
      return { error: 'Sprint and title are required' };
    }
    if (!tags || tags.length === 0) {
      return { error: 'At least one tag is required' };
    }

    await dbConnect();

    // Verify sprint exists and belongs to user
    const sprint = await Sprint.findOne({ _id: sprintId, userId });
    if (!sprint) {
      return { error: 'Sprint not found' };
    }

    const processedTagIds = await processTags(tags, sprintId, userId);

    const task = await Task.create({
      userId,
      sprintId,
      title,
      description,
      priority,
      stage,
      tags: processedTagIds,
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
      .populate('tags')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const serialized = tasks.map((task) => ({
      ...task,
      _id: task._id.toString(),
      userId: task.userId.toString(),
      sprintId: task.sprintId.toString(),
    }));

    // Fetch user stages: global (sprintId: null) + sprint-local stages merged
    let stages = await Stage.find({
      userId,
      $or: [{ sprintId: null }, { sprintId }],
    }).sort({ order: 1 }).lean();
    if (!stages || stages.length === 0) {
      const defaults = [
        { userId, sprintId: null, name: 'To Do', order: 0 },
        { userId, sprintId: null, name: 'In Progress', order: 1 },
        { userId, sprintId: null, name: 'Done', order: 2 },
      ];
      await Stage.insertMany(defaults);
      stages = await Stage.find({
        userId,
        $or: [{ sprintId: null }, { sprintId }],
      }).sort({ order: 1 }).lean();
    }

    const grouped = {};
    const validStageNames = new Set();
    stages.forEach(stage => {
      grouped[stage.name] = [];
      validStageNames.add(stage.name);
    });

    serialized.forEach(t => {
      const stageName = validStageNames.has(t.stage) ? t.stage : (stages[0]?.name || 'To Do');
      if (!grouped[stageName]) grouped[stageName] = [];
      grouped[stageName].push(t);
    });

    return {
      success: true,
      tasks: JSON.parse(JSON.stringify(serialized)),
      grouped: JSON.parse(JSON.stringify(grouped)),
      stages: JSON.parse(JSON.stringify(stages)),
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

    const task = await Task.findOne({ _id: taskId, userId }).populate('tags').lean();

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
    let tags = undefined;
    try {
      const tagsStr = formData.get('tags');
      if (tagsStr) tags = JSON.parse(tagsStr);
    } catch (e) {
      console.error('Failed to parse tags:', e);
    }

    if (title) updates.title = title;
    if (description !== null && description !== undefined)
      updates.description = description;
    if (priority) updates.priority = priority;
    if (stage) updates.stage = stage;
    if (tags && tags.length > 0) {
      updates.tags = await processTags(tags, existingTask.sprintId, userId);
    } else if (tags && tags.length === 0) {
      return { error: 'At least one tag is required' };
    }

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
    ).populate('tags').lean();

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
 * Move a Task to a (possibly different) column at a specific index.
 * Handles stage change + order update + activity logging + sibling reorder.
 */
export async function moveTask(taskId, targetStage, newIndex) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) return { error: 'Task not found' };

    const oldStage = task.stage;
    const stageChanged = oldStage !== targetStage;

    // Get all tasks in the target column (excluding the moved card if same column)
    const filter = { sprintId: task.sprintId, userId, stage: targetStage };
    if (!stageChanged) {
      filter._id = { $ne: taskId };
    }
    const siblings = await Task.find(filter).sort({ order: 1, createdAt: -1 }).lean();

    // Insert the task id at the desired index
    const reordered = [...siblings];
    const clampedIndex = Math.max(0, Math.min(newIndex, reordered.length));
    reordered.splice(clampedIndex, 0, task);

    // Batch-update order values for every card in the target column
    const bulkOps = reordered.map((t, i) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: { order: i, ...(t._id.equals(task._id) ? { stage: targetStage } : {}) } },
      },
    }));
    await Task.bulkWrite(bulkOps);

    // If cross-column: also re-index the source column to close the gap
    if (stageChanged) {
      const sourceSiblings = await Task.find({
        sprintId: task.sprintId, userId, stage: oldStage,
      }).sort({ order: 1, createdAt: -1 }).lean();

      if (sourceSiblings.length > 0) {
        const sourceOps = sourceSiblings.map((t, i) => ({
          updateOne: { filter: { _id: t._id }, update: { $set: { order: i } } },
        }));
        await Task.bulkWrite(sourceOps);
      }

      // Activity log
      await Task.updateOne(
        { _id: taskId },
        { $push: { activityLog: { actionDescription: `Moved from '${oldStage}' to '${targetStage}'`, timestamp: new Date() } } }
      );
    }

    revalidatePath(`/dashboard/sprints/${task.sprintId}`);
    return { success: true };
  } catch (error) {
    console.error('Move task error:', error);
    return { error: error.message || 'Failed to move task' };
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
