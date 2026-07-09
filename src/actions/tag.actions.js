'use server';

import dbConnect from '@/lib/dbConnect';
import Tag from '@/models/Tag';
import { auth } from '@/lib/auth';

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

const COMMON_TAGS = ['bug', 'feature', 'urgent'];

/**
 * Seed common tags for a user if they don't exist.
 */
async function seedCommonTags(userId) {
  for (const name of COMMON_TAGS) {
    const exists = await Tag.findOne({ name, userId, sprintId: null });
    if (!exists) {
      await Tag.create({ name, userId, sprintId: null });
    }
  }
}

/**
 * Get all tags relevant to a sprint (global + sprint-specific).
 */
export async function getTagsForSprint(sprintId) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    // Ensure common tags exist
    await seedCommonTags(userId);

    const query = {
      userId,
      $or: [{ sprintId: null }, { sprintId }],
    };

    const tags = await Tag.find(query).sort({ name: 1 }).lean();

    return {
      success: true,
      tags: JSON.parse(JSON.stringify(tags.map(t => ({ ...t, _id: t._id.toString() })))),
    };
  } catch (error) {
    console.error('Get tags error:', error);
    return { error: 'Failed to fetch tags' };
  }
}

/**
 * Create a new tag (sprint-specific).
 */
export async function createTag(name, sprintId) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    const normalizedName = name.trim().toLowerCase();

    if (!normalizedName) {
      return { error: 'Tag name is required' };
    }

    // Check if tag already exists (global or sprint-specific)
    const existing = await Tag.findOne({
      name: normalizedName,
      userId,
      $or: [{ sprintId: null }, { sprintId }],
    }).lean();

    if (existing) {
      return { success: true, tag: JSON.parse(JSON.stringify({ ...existing, _id: existing._id.toString() })) };
    }

    const newTag = await Tag.create({
      name: normalizedName,
      userId,
      sprintId,
    });

    return {
      success: true,
      tag: JSON.parse(JSON.stringify({ ...newTag.toObject(), _id: newTag._id.toString() })),
    };
  } catch (error) {
    console.error('Create tag error:', error);
    return { error: error.message || 'Failed to create tag' };
  }
}
