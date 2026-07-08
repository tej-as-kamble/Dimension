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

export async function getStages() {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    let stages = await Stage.find({ userId }).sort({ order: 1 }).lean();

    if (!stages || stages.length === 0) {
      // Create defaults
      const defaults = [
        { userId, name: 'To Do', order: 0 },
        { userId, name: 'In Progress', order: 1 },
        { userId, name: 'Done', order: 2 },
      ];
      await Stage.insertMany(defaults);
      stages = await Stage.find({ userId }).sort({ order: 1 }).lean();
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

export async function createStage(name) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    const maxStage = await Stage.findOne({ userId }).sort({ order: -1 }).lean();
    const newOrder = maxStage ? maxStage.order + 1 : 0;

    const stage = await Stage.create({
      userId,
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
