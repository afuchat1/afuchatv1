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

/**
 * Renders text content with clickable hashtags and links
 */
export function renderContentWithLinks(content: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Combined regex for hashtags and URLs
  const combinedRegex = /(#\w+|https?:\/\/[^\s]+)/g;
  const matches = Array.from(content.matchAll(combinedRegex));

  matches.forEach((match, idx) => {
    const matchText = match[0];
    const matchIndex = match.index!;

    // Add text before the match
    if (matchIndex > lastIndex) {
      parts.push(content.substring(lastIndex, matchIndex));
    }

    // Add the matched item (hashtag or URL)
    if (matchText.startsWith('#')) {
      const hashtag = matchText.substring(1);
      parts.push(
        React.createElement(
          'a',
          {
            key: `hashtag-${idx}`,
            href: `/search?q=${encodeURIComponent(hashtag)}`,
            className: 'text-primary hover:underline font-medium',
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
            },
          },
          matchText
        )
      );
    } else if (matchText.startsWith('http')) {
      parts.push(
        React.createElement(
          'a',
          {
            key: `url-${idx}`,
            href: matchText,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'text-primary hover:underline',
            onClick: (e: React.MouseEvent) => {
              e.stopPropagation();
            },
          },
          matchText.length > 50 ? matchText.substring(0, 50) + '...' : matchText
        )
      );
    }

    lastIndex = matchIndex + matchText.length;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}
