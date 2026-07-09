'use server';

import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * Register a new user with credentials (email/password).
 */
export async function registerUser(formData) {
  try {
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim().toLowerCase();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validation
    if (!name || !email || !password) {
      return { error: 'All fields are required' };
    }

    if (name.length > 60) {
      return { error: 'Name cannot exceed 60 characters' };
    }

    if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' };
    }

    if (password !== confirmPassword) {
      return { error: 'Passwords do not match' };
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: 'An account with this email already exists' };
    }

    // Create user (password will be hashed by pre-save hook)
    await User.create({
      name,
      email,
      password,
      authProvider: 'credentials',
    });

    return { success: true, message: 'Account created successfully' };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}

/**
 * Update user password.
 * Users are already authenticated via session; no current password required.
 */
export async function updatePassword(formData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in' };
    }

    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (!newPassword) {
      return { error: 'New password is required' };
    }

    if (newPassword.length < 6) {
      return { error: 'Password must be at least 6 characters' };
    }

    if (newPassword !== confirmPassword) {
      return { error: 'Passwords do not match' };
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select('+password');
    if (!user) {
      return { error: 'User not found' };
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('Password update error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}

/**
 * Get the current user's profile info.
 */
export async function getUserProfile() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in' };
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select(
      'name email image authProvider'
    );

    if (!user) {
      return { error: 'User not found' };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        authProvider: user.authProvider,
        hasPassword: !!user.password,
      },
    };
  } catch (error) {
    console.error('Get profile error:', error);
    return { error: 'Something went wrong' };
  }
}
