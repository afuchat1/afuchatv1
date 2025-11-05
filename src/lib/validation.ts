import { z } from 'zod';

// Search validation
export const searchSchema = z.string()
  .trim()
  .max(100, 'Search query too long')
  .refine(
    val => !val.includes('%') && !val.includes('_'), 
    'Invalid characters in search query'
  );

// Message validation
export const messageSchema = z.string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(5000, 'Message must be less than 5000 characters');

// Post validation
export const postSchema = z.string()
  .trim()
  .min(1, 'Post cannot be empty')
  .max(280, 'Post must be 280 characters or less');

// Handle validation
export const handleSchema = z.string()
  .trim()
  .min(3, 'Handle must be at least 3 characters')
  .max(20, 'Handle must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores');

// Display name validation
export const displayNameSchema = z.string()
  .trim()
  .min(1, 'Display name cannot be empty')
  .max(50, 'Display name must be less than 50 characters');

// Bio validation
export const bioSchema = z.string()
  .trim()
  .max(160, 'Bio must be less than 160 characters')
  .optional();

// Email validation
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number');

// AI generation validation
export const aiTopicSchema = z.string()
  .trim()
  .min(3, 'Topic must be at least 3 characters')
  .max(100, 'Topic must be less than 100 characters');

export const aiToneSchema = z.enum(['casual', 'professional', 'funny', 'inspiring']);
export const aiLengthSchema = z.enum(['short', 'medium', 'long']);
