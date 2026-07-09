'use server';

import dbConnect from '@/lib/dbConnect';
import Comment from '@/models/Comment';
import Task from '@/models/Task';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export async function getCommentsByTaskId(taskId) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    // Verify user has access to task (assuming user must own the task)
    const task = await Task.findOne({ _id: taskId, userId }).lean();
    if (!task) {
      return { error: 'Task not found or unauthorized' };
    }

    const comments = await Comment.find({ taskId })
      .populate('userId', 'name image')
      .sort({ createdAt: 1 })
      .lean();

    return {
      success: true,
      comments: JSON.parse(JSON.stringify(comments)),
    };
  } catch (error) {
    console.error('Get comments error:', error);
    return { error: 'Failed to fetch comments' };
  }
}

export async function createComment(taskId, content) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    if (!content?.trim()) {
      return { error: 'Comment content is required' };
    }

    const task = await Task.findOne({ _id: taskId, userId }).lean();
    if (!task) {
      return { error: 'Task not found or unauthorized' };
    }

    const comment = await Comment.create({
      taskId,
      userId,
      content: content.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate('userId', 'name image').lean();

    return {
      success: true,
      comment: JSON.parse(JSON.stringify(populatedComment)),
    };
  } catch (error) {
    console.error('Create comment error:', error);
    return { error: error.message || 'Failed to create comment' };
  }
}

export async function updateComment(commentId, content) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    if (!content?.trim()) {
      return { error: 'Comment content is required' };
    }

    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, userId },
      { content: content.trim() },
      { new: true }
    ).populate('userId', 'name image').lean();

    if (!comment) {
      return { error: 'Comment not found or unauthorized' };
    }

    return {
      success: true,
      comment: JSON.parse(JSON.stringify(comment)),
    };
  } catch (error) {
    console.error('Update comment error:', error);
    return { error: error.message || 'Failed to update comment' };
  }
}

export async function deleteComment(commentId) {
  try {
    const userId = await getAuthUserId();
    await dbConnect();

    const comment = await Comment.findOneAndDelete({ _id: commentId, userId });

    if (!comment) {
      return { error: 'Comment not found or unauthorized' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete comment error:', error);
    return { error: 'Failed to delete comment' };
  }
}
