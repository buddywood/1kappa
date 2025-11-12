'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Post {
  id: number;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  created_at: string;
  hashtags?: string[];
}

interface PostCardProps {
  post: Post;
  onLike: () => void;
}

export default function PostCard({ post, onLike }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const extractHashtags = (text: string) => {
    const hashtagRegex = /#(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = hashtagRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'hashtag', content: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  const renderContent = () => {
    const parts = extractHashtags(post.content);
    return parts.map((part, index) => {
      if (part.type === 'hashtag') {
        return (
          <span key={index} className="text-crimson font-medium">
            #{part.content}
          </span>
        );
      }
      return <span key={index}>{part.content}</span>;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-4">
        <Link href={`/connect/profile/${post.author_id}`}>
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            {post.author_avatar ? (
              <Image
                src={post.author_avatar}
                alt={post.author_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-crimson font-bold">
                {post.author_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1">
          <Link href={`/connect/profile/${post.author_id}`}>
            <p className="font-semibold text-midnight-navy hover:text-crimson transition">
              {post.author_name}
            </p>
          </Link>
          <p className="text-xs text-gray-500">{formatTime(post.created_at)}</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Post Image */}
      {post.image_url && (
        <div className="relative w-full aspect-square bg-gray-100">
          <Image
            src={post.image_url}
            alt={post.content}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={onLike}
            className={`transition ${
              post.is_liked ? 'text-crimson' : 'text-gray-600 hover:text-crimson'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={post.is_liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-gray-600 hover:text-crimson transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-crimson transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-crimson transition ml-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>

        {/* Likes Count */}
        {post.likes_count > 0 && (
          <p className="text-sm font-semibold text-midnight-navy mb-2">
            {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Post Content */}
        <div className="text-sm text-midnight-navy mb-2">
          <Link href={`/connect/profile/${post.author_id}`}>
            <span className="font-semibold mr-2 hover:text-crimson transition">
              {post.author_name}
            </span>
          </Link>
          <span>{renderContent()}</span>
        </div>

        {/* Comments Count */}
        {post.comments_count > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-gray-500 hover:text-crimson transition mb-2"
          >
            View all {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Comments coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

