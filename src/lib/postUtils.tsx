import React from 'react';

/**
 * Extracts URLs from text content
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Extracts hashtags from text content
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = Array.from(text.matchAll(hashtagRegex));
  return matches.map(match => match[1]);
}
