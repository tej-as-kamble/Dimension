'use server';

import dbConnect from '@/lib/dbConnect';
import Sprint from '@/models/Sprint';
import Task from '@/models/Task';
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
 * Create a new Sprint.
 */
export async function createSprint(formData) {
  try {
    const userId = await getAuthUserId();

    const name = formData.get('name')?.trim();
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    const sprintGoal = formData.get('sprintGoal')?.trim() || '';
    const status = formData.get('status') || 'Planning';

    if (!name || !startDate || !endDate) {
      return { error: 'Name, start date, and end date are required' };
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return { error: 'End date must be after start date' };
    }

    await dbConnect();

    const sprint = await Sprint.create({
      userId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      sprintGoal,
      status,
    });

    revalidatePath('/dashboard');

    return {
      success: true,
      sprint: JSON.parse(JSON.stringify(sprint)),
    };
  } catch (error) {
    console.error('Create sprint error:', error);
    return { error: error.message || 'Failed to create sprint' };
  }
}

/**
 * Get all Sprints for the current user, sorted by most recent first.
 */
export async function getSprints() {
  try {
    const userId = await getAuthUserId();

    await dbConnect();

    const sprints = await Sprint.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Get task counts for each sprint
    const sprintIds = sprints.map((s) => s._id);
    const taskCounts = await Task.aggregate([
      { $match: { sprintId: { $in: sprintIds } } },
      { $group: { _id: '$sprintId', count: { $sum: 1 } } },
    ]);

    const taskCountMap = {};
    taskCounts.forEach((tc) => {
      taskCountMap[tc._id.toString()] = tc.count;
    });

    const sprintsWithCounts = sprints.map((sprint) => ({
      ...sprint,
      _id: sprint._id.toString(),
      userId: sprint.userId.toString(),
      taskCount: taskCountMap[sprint._id.toString()] || 0,
    }));

    return { success: true, sprints: JSON.parse(JSON.stringify(sprintsWithCounts)) };
  } catch (error) {
    console.error('Get sprints error:', error);
    return { error: 'Failed to fetch sprints' };
  }
}

/**
 * Get a single Sprint by ID (with ownership check).
 */
export async function getSprintById(sprintId) {
  try {
    const userId = await getAuthUserId();

    await dbConnect();

    const sprint = await Sprint.findOne({ _id: sprintId, userId }).lean();

    if (!sprint) {
      return { error: 'Sprint not found' };
    }

    return {
      success: true,
      sprint: JSON.parse(
        JSON.stringify({
          ...sprint,
          _id: sprint._id.toString(),
          userId: sprint.userId.toString(),
        })
      ),
    };
  } catch (error) {
    console.error('Get sprint error:', error);
    return { error: 'Failed to fetch sprint' };
  }
}

/**
 * Update a Sprint.
 */
export async function updateSprint(sprintId, formData) {
  try {
    const userId = await getAuthUserId();

    const updates = {};
    const name = formData.get('name')?.trim();
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    const sprintGoal = formData.get('sprintGoal')?.trim();
    const status = formData.get('status');

    if (name) updates.name = name;
    if (startDate) updates.startDate = new Date(startDate);
    if (endDate) updates.endDate = new Date(endDate);
    if (sprintGoal !== null && sprintGoal !== undefined)
      updates.sprintGoal = sprintGoal;
    if (status) updates.status = status;

    // Validate dates if both provided
    const effectiveStart = updates.startDate || null;
    const effectiveEnd = updates.endDate || null;
    if (effectiveStart && effectiveEnd && effectiveEnd <= effectiveStart) {
      return { error: 'End date must be after start date' };
    }

    await dbConnect();

    const sprint = await Sprint.findOneAndUpdate(
      { _id: sprintId, userId },
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!sprint) {
      return { error: 'Sprint not found' };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/sprints/${sprintId}`);

    return {
      success: true,
      sprint: JSON.parse(JSON.stringify(sprint)),
    };
  } catch (error) {
    console.error('Update sprint error:', error);
    return { error: error.message || 'Failed to update sprint' };
  }
}

/**
 * Delete a Sprint and cascade-delete all associated tasks.
 */
export async function deleteSprint(sprintId) {
  try {
    const userId = await getAuthUserId();

    await dbConnect();

    const sprint = await Sprint.findOneAndDelete({ _id: sprintId, userId });

    if (!sprint) {
      return { error: 'Sprint not found' };
    }

    // Cascade delete all tasks in this sprint
    await Task.deleteMany({ sprintId, userId });

    revalidatePath('/dashboard');

    return { success: true, message: 'Sprint deleted successfully' };
  } catch (error) {
    console.error('Delete sprint error:', error);
    return { error: 'Failed to delete sprint' };
  }
}
