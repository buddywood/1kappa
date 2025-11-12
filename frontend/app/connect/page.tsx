'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SkeletonLoader } from '../components/Skeleton';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import ProfileList from '../components/ProfileList';
import { fetchPosts, createPost, likePost, unlikePost } from '@/lib/api';

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

export default function ConnectPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === 'authenticated' && session?.user;
  const isLoading = sessionStatus === 'loading';
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discover' | 'profile'>('discover');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/connect');
      return;
    }

    if (isAuthenticated && session) {
      loadPosts();
    }
  }, [isLoading, isAuthenticated, session, router]);

  const loadPosts = async () => {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        await unlikePost(postId);
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        await likePost(postId);
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (isLoading || loading) {
    return <SkeletonLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('discover')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'discover'
                ? 'text-crimson border-b-2 border-crimson'
                : 'text-gray-600 hover:text-crimson'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'profile'
                ? 'text-crimson border-b-2 border-crimson'
                : 'text-gray-600 hover:text-crimson'
            }`}
          >
            Profile
          </button>
        </div>

        {activeTab === 'discover' && (
          <>
            {/* Profile Stories/List */}
            <ProfileList />

            {/* Posts Feed */}
            <div className="space-y-6 mt-6">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No posts yet. Be the first to share something!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => handleLike(post.id)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="text-center py-12 text-gray-500">
            <p>Profile view coming soon...</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

