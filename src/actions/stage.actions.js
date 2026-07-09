'use server';

import dbConnect from '@/lib/dbConnect';
import Stage from '@/models/Stage';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

/**
 * Get stages for a user.
 * If sprintId is provided, returns global stages + sprint-local stages merged and sorted.
 * If not provided, returns only global stages.
 */
export async function getStages(sprintId = null) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    const query = sprintId
      ? { userId, $or: [{ sprintId: null }, { sprintId }] }
      : { userId, sprintId: null };

    let stages = await Stage.find(query).sort({ order: 1 }).lean();

    if (!stages || stages.length === 0) {
      // Create defaults (always global)
      const defaults = [
        { userId, sprintId: null, name: 'To Do', order: 0 },
        { userId, sprintId: null, name: 'In Progress', order: 1 },
        { userId, sprintId: null, name: 'Done', order: 2 },
      ];
      await Stage.insertMany(defaults);
      stages = await Stage.find(query).sort({ order: 1 }).lean();
    }

    return {
      success: true,
      stages: JSON.parse(JSON.stringify(stages)),
    };
  } catch (error) {
    console.error('Get stages error:', error);
    return { error: 'Failed to fetch stages' };
  }
}

/**
 * Create a new stage.
 * @param {string} name - Stage name
 * @param {string|null} sprintId - If provided, stage is sprint-local; otherwise global.
 */
export async function createStage(name, sprintId = null) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    // Get the max order across all stages for this user (global + local) so ordering doesn't clash
    const maxStage = await Stage.findOne({ userId }).sort({ order: -1 }).lean();
    const newOrder = maxStage ? maxStage.order + 1 : 0;

    const stage = await Stage.create({
      userId,
      sprintId: sprintId || null,
      name,
      order: newOrder,
    });

    revalidatePath('/dashboard');
    return { success: true, stage: JSON.parse(JSON.stringify(stage)) };
  } catch (error) {
    console.error('Create stage error:', error);
    return { error: 'Failed to create stage' };
  }
}

/**
 * Update a stage name. Also renames matching tasks across the relevant scope.
 */
export async function updateStage(stageId, name) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    const stage = await Stage.findOne({ _id: stageId, userId });
    if (!stage) return { error: 'Stage not found' };

    const oldName = stage.name;
    stage.name = name;
    await stage.save();

    // Update Tasks with old stage name
    const Task = (await import('@/models/Task')).default;
    await Task.updateMany({ userId, stage: oldName }, { $set: { stage: name } });

    revalidatePath('/dashboard');
    return { success: true, stage: JSON.parse(JSON.stringify(stage)) };
  } catch (error) {
    console.error('Update stage error:', error);
    return { error: 'Failed to update stage' };
  }
}

/**
 * Delete a stage (ownership check).
 */
export async function deleteStage(stageId) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    await Stage.findOneAndDelete({ _id: stageId, userId });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Delete stage error:', error);
    return { error: 'Failed to delete stage' };
  }
}

/**
 * Reorder stages. Accepts an ordered array of { _id, order } objects.
 * Persists the new order values in bulk.
 */
export async function reorderStages(orderedIds) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    await Promise.all(
      orderedIds.map(({ _id, order }) =>
        Stage.findOneAndUpdate({ _id, userId }, { order })
      )
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Reorder stages error:', error);
    return { error: 'Failed to reorder stages' };
  }
}
