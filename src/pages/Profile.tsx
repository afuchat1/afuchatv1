import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, ArrowLeft, MessageSquare, UserPlus, UserMinus } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  handle: string;
  bio?: string;
  is_verified?: boolean;
  is_private?: boolean;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      checkFollowStatus();
      fetchUserPosts();
    }
  }, [userId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      toast.error('Failed to load profile');
      navigate('/');
      return;
    }

    setProfile(data);
  };

  const checkFollowStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    setIsFollowing(!!data);
  };

  const fetchUserPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (!error) {
        setIsFollowing(false);
        toast.success('Unfollowed');
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (!error) {
        setIsFollowing(true);
        toast.success('Following');
      }
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if there's an existing 1-on-1 chat
    const { data: existingChats } = await supabase
      .from('chat_members')
      .select('chat_id, chats!inner(is_group)')
      .eq('user_id', user.id);

    if (existingChats) {
      for (const chat of existingChats) {
        const { data: members } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chat.chat_id);

        if (members && members.length === 2 && members.some(m => m.user_id === userId)) {
          navigate(`/chat/${chat.chat_id}`);
          return;
        }
      }
    }

    // Create new chat
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        is_group: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (chatError) {
      toast.error('Failed to create chat');
      return;
    }

    // Add both users as members
    const { error: membersError } = await supabase
      .from('chat_members')
      .insert([
        { chat_id: newChat.id, user_id: user.id },
        { chat_id: newChat.id, user_id: userId },
      ]);

    if (membersError) {
      toast.error('Failed to add members');
      return;
    }

    navigate(`/chat/${newChat.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                {profile.is_verified && (
                  <svg
                    viewBox="0 0 22 22"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                  >
                    <path
                      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                      fill="#1d9bf0"
                    />
                  </svg>
                )}
              </div>
              <p className="text-muted-foreground">@{profile.handle}</p>
              {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            </div>
          </div>

          {user && user.id !== userId && (
            <div className="flex gap-2">
              <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
              {isFollowing && (
                <Button onClick={handleStartChat} variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No posts yet
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="p-4">
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(post.created_at).toLocaleString()}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
