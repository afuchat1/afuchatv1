import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, MessageSquare, UserPlus, Pencil, Calendar, Lock, LogOut, Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';
import { GradeBadge, type Grade } from '@/components/gamification/GradeBadge';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { AchievementBadges } from '@/components/gamification/AchievementBadges';
import { ReferralSystem } from '@/components/gamification/ReferralSystem';
import { ReceivedGifts } from '@/components/gifts/ReceivedGifts';
import { TipStats } from '@/components/tips/TipStats';
import { TipButton } from '@/components/tips/TipButton';
import ProfileActionsSheet from '@/components/ProfileActionsSheet';
import { OwlAvatar } from '@/components/avatar/OwlAvatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useAITranslation } from '@/hooks/useAITranslation';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { LinkPreviewCard } from '@/components/ui/LinkPreviewCard';
import { DefaultAvatar } from '@/components/avatar/DefaultAvatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { BusinessBadge } from '@/components/BusinessBadge';
import { AffiliatedBadge } from '@/components/AffiliatedBadge';
import { AffiliateDetailsSheet } from '@/components/AffiliateDetailsSheet';

interface Profile {
	id: string;
	display_name: string;
	handle: string;
	bio?: string;
	is_verified?: boolean;
	is_organization_verified?: boolean;
	is_affiliate?: boolean;
	is_private?: boolean;
	created_at?: string;
	xp: number;
	current_grade: Grade;
	avatar_url?: string | null;
	website_url?: string | null;
	is_business_mode?: boolean;
	affiliated_business_id?: string | null;
	affiliated_business?: {
		avatar_url: string | null;
		display_name: string;
	} | null;
	affiliation_date?: string;
}

interface Post {
	id: string;
	content: string;
	created_at: string;
	acknowledgment_count: number;
	reply_count: number;
	post_images?: Array<{
		image_url: string;
		alt_text: string | null;
		display_order: number;
	}>;
	post_link_previews?: Array<{
		url: string;
		title?: string | null;
		description?: string | null;
		image_url?: string | null;
		site_name?: string | null;
	}>;
}

const isUUID = (str: string): boolean => {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(str);
};

const MENTION_REGEX = /@(\w+)/g;

const ContentParser: React.FC<{ content: string, isBio?: boolean }> = ({ content, isBio = false }) => {
	const { i18n, t } = useTranslation();
	const { translateText } = useAITranslation();
	const [translatedContent, setTranslatedContent] = useState<string | null>(null);
	const [isTranslating, setIsTranslating] = useState(false);
	const navigate = useNavigate();

	const handleTranslate = async () => {
		if (translatedContent) {
			setTranslatedContent(null);
			return;
		}
		setIsTranslating(true);
		const translated = await translateText(content, i18n.language);
		setTranslatedContent(translated);
		setIsTranslating(false);
	};

	const displayContent = translatedContent || content;
	
	// Parse mentions, hashtags, and links (including plain domains like afuchat.com)
	const combinedRegex = /(@[a-zA-Z0-9_-]+|#\w+|https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
	const parts: React.ReactNode[] = [];
	let lastIndex = 0;
	
	const matches = Array.from(displayContent.matchAll(combinedRegex));
	
	matches.forEach((match, idx) => {
		const matchText = match[0];
		const index = match.index!;
		
		if (index > lastIndex) {
			parts.push(displayContent.substring(lastIndex, index));
		}
		
		if (matchText.startsWith('@')) {
			const handle = matchText.substring(1);
			parts.push(
				<Link
					key={`mention-${idx}`}
					to={`/${handle}`} 
					className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
					onClick={(e) => e.stopPropagation()}
				>
					{matchText}
				</Link>
			);
		} else if (matchText.startsWith('#')) {
			const hashtag = matchText.substring(1);
			parts.push(
				<Link
					key={`hashtag-${idx}`}
					to={`/search?q=${encodeURIComponent(hashtag)}`}
					className="text-primary hover:underline font-medium"
					onClick={(e) => e.stopPropagation()}
				>
					{matchText}
				</Link>
			);
		} else {
			// It's a URL (either with protocol or plain domain)
			const url = matchText.startsWith('http') ? matchText : `https://${matchText}`;
			parts.push(
				<a
					key={`url-${idx}`}
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary hover:underline"
					onClick={(e) => e.stopPropagation()}
				>
					{matchText.length > 50 ? matchText.substring(0, 50) + '...' : matchText}
				</a>
			);
		}
		
		lastIndex = index + matchText.length;
	});

	if (lastIndex < displayContent.length) {
		parts.push(displayContent.substring(lastIndex));
	}

	const className = isBio
		? "mt-3 text-sm whitespace-pre-wrap leading-relaxed"
		: "text-foreground whitespace-pre-wrap leading-relaxed";

	return (
		<div>
			<p className={className}>{parts}</p>
			{i18n.language !== 'en' && !isBio && (
				<Button
					variant="ghost"
					size="sm"
					onClick={handleTranslate}
					disabled={isTranslating}
					className="text-xs text-muted-foreground hover:text-primary mt-1 p-0 h-auto"
				>
					{isTranslating ? t('common.translating') : translatedContent ? t('common.showOriginal') : t('common.translate')}
				</Button>
			)}
		</div>
	);
};

// Profile Avatar Display Component
const ProfileAvatarDisplay = ({ profileId, profile }: { profileId: string | null; profile: Profile | null }) => {
	const { avatarConfig, loading } = useUserAvatar(profileId || undefined);
	const { user } = useAuth();
	const navigate = useNavigate();

	const isOwnProfile = user?.id === profileId;

	if (loading) {
		return (
			<div className="w-full h-full bg-muted animate-pulse rounded-full" />
		);
	}

	const handleClick = () => {
		if (isOwnProfile) {
			navigate(`/${profileId}/edit`);
		}
	};

	// Show uploaded avatar if available
	if (profile?.avatar_url) {
		return (
			<div 
				className={`w-full h-full ${isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
				onClick={handleClick}
				title={isOwnProfile ? 'Click to edit profile picture' : undefined}
			>
				<img 
					src={profile.avatar_url} 
					alt={profile.display_name}
					className="w-full h-full object-cover"
				/>
			</div>
		);
	}

	// Fall back to default avatar
	if (profile?.display_name) {
		return (
			<div 
				className={`w-full h-full flex items-center justify-center ${isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
				onClick={handleClick}
				title={isOwnProfile ? 'Click to edit profile picture' : undefined}
			>
				<DefaultAvatar name={profile.display_name} size={128} />
			</div>
		);
	}

	// Fallback to owl avatar if no other option
	return (
		<div 
			className={isOwnProfile ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
			onClick={handleClick}
			title={isOwnProfile ? 'Click to customize your owl' : undefined}
		>
			<OwlAvatar config={avatarConfig} size={128} />
		</div>
	);
};

const Profile = () => {
	const { t } = useTranslation();
    const { userId: urlParam } = useParams<{ userId: string }>(); 
	const navigate = useNavigate();
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [posts, setPosts] = useState<Post[]>([]);
	const [isFollowing, setIsFollowing] = useState(false);
	const [followCount, setFollowCount] = useState({ followers: 0, following: 0 });
	const [loading, setLoading] = useState(true);
	const [selectedAffiliate, setSelectedAffiliate] = useState<{
		userName: string;
		businessName: string;
		affiliatedDate: string;
		businessLogo?: string;
	} | null>(null);
	const [affiliatedUsers, setAffiliatedUsers] = useState<Array<{
		id: string;
		display_name: string;
		handle: string;
		avatar_url: string | null;
		is_verified: boolean;
		is_organization_verified: boolean;
		affiliation_date: string;
	}>>([]);

	const [profileId, setProfileId] = useState<string | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);

	const fetchFollowCounts = useCallback(async (id: string) => {
		if (!id) return;

		const { count: followerCount } = await supabase
			.from('follows')
			.select('id', { count: 'exact', head: true })
			.eq('following_id', id);

		const { count: followingCount } = await supabase
			.from('follows')
			.select('id', { count: 'exact', head: true })
			.eq('follower_id', id);

		setFollowCount({
			followers: followerCount || 0,
			following: followingCount || 0
		});
	}, []);

	const fetchAdminStatus = useCallback(async (userId: string) => {
		if (!userId) {
			setIsAdmin(false);
			return;
		}

		const { data } = await supabase
			.from('user_roles')
			.select('role')
			.eq('user_id', userId)
			.eq('role', 'admin') 
			.limit(1)
			.maybeSingle(); 

		setIsAdmin(!!data); 
	}, []);

	const fetchAffiliatedUsers = useCallback(async (businessId: string) => {
		const { data: affiliateRequests, error: requestsError } = await supabase
			.from('affiliate_requests')
			.select('user_id, requested_at')
			.eq('business_profile_id', businessId)
			.eq('status', 'approved');

		if (requestsError || !affiliateRequests) {
			console.error('Error fetching affiliate requests:', requestsError);
			return;
		}

		const userIds = affiliateRequests.map(req => req.user_id);
		if (userIds.length === 0) {
			setAffiliatedUsers([]);
			return;
		}

		const { data: users, error: usersError } = await supabase
			.from('profiles')
			.select('id, display_name, handle, avatar_url, is_verified, is_organization_verified')
			.in('id', userIds);

		if (usersError || !users) {
			console.error('Error fetching affiliated users:', usersError);
			return;
		}

		const usersWithDates = users.map(user => {
			const request = affiliateRequests.find(req => req.user_id === user.id);
			return {
				...user,
				affiliation_date: request?.requested_at || ''
			};
		});

		setAffiliatedUsers(usersWithDates);
	}, []);

	const fetchProfile = useCallback(async () => {
		setLoading(true);
		setProfile(null);
		setProfileId(null);

		if (!urlParam) { 
			setLoading(false);
			return;
		}

		const isParamUUID = isUUID(urlParam);

		let query = supabase
			.from('profiles')
			.select('*, created_at')
			.limit(1);

		if (isParamUUID) {
			query = query.eq('id', urlParam);
		} else {
			query = query.ilike('handle', urlParam);
		}

		const { data, error } = await query.maybeSingle();

		if (error && error.code !== 'PGRST116') {
			toast.error(t('common.error'));
			console.error('Profile fetch error:', error);
			setLoading(false);
			return;
		}

		if (!data) {
			toast.error(t('profile.notFound'));
			setLoading(false);
			return;
		}

		let profileData: Profile = data as Profile;

		// Fetch affiliated business data if user is an affiliate
		if (profileData.affiliated_business_id) {
			const { data: businessData } = await supabase
				.from('profiles')
				.select('avatar_url, display_name')
				.eq('id', profileData.affiliated_business_id)
				.single();
			
			if (businessData) {
				profileData.affiliated_business = {
					avatar_url: businessData.avatar_url,
					display_name: businessData.display_name
				};
			}

			// Fetch affiliation date - use reviewed_at (approval date) or fallback to requested_at
			if (profileData.is_affiliate) {
				const { data: affiliationData, error: affiliationError } = await supabase
					.from('affiliate_requests')
					.select('reviewed_at, requested_at')
					.eq('user_id', data.id)
					.eq('status', 'approved')
					.maybeSingle();

				console.log('Affiliation data:', affiliationData, 'Error:', affiliationError);

				if (affiliationData) {
					// Use reviewed_at (when approved) or fallback to requested_at
					profileData.affiliation_date = affiliationData.reviewed_at || affiliationData.requested_at;
				}
			}
		}

		setProfile(profileData);
		setProfileId(data.id);
		await fetchFollowCounts(data.id);
		
		// Fetch affiliated users if this is a business profile
		if (profileData.is_business_mode) {
			await fetchAffiliatedUsers(data.id);
		}
		
		setLoading(false);

	}, [urlParam, navigate, fetchFollowCounts, fetchAffiliatedUsers]);

	const checkFollowStatus = useCallback(async (id: string) => {
		if (!user || !id) return;

		const { data } = await supabase
			.from('follows')
			.select('id')
			.eq('follower_id', user.id)
			.eq('following_id', id)
			.limit(1)
			.single();

		setIsFollowing(!!data);
	}, [user]);

	const fetchUserPosts = useCallback(async (id: string) => {
		if (!id) return;

		if (profile?.is_private && user?.id !== id) {
			setPosts([]);
			return;
		}
		
		const { data, error } = await supabase
			.from('posts')
			.select(`
				id, 
				content, 
				created_at,
				post_images (
					image_url,
					alt_text,
					display_order
				),
				post_link_previews (
					url,
					title,
					description,
					image_url,
					site_name
				)
			`)
			.eq('author_id', id)
			.order('created_at', { ascending: false })
			.limit(20);

		if (!error && data) {
			setPosts(data.map(p => ({
				...p,
				acknowledgment_count: Math.floor(Math.random() * 100),
				reply_count: Math.floor(Math.random() * 10),
			} as Post)));
		} else {
			setPosts([]);
		}
	}, [profile, user]);


	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	useEffect(() => {
		if (profileId) {
			fetchFollowCounts(profileId);
			fetchUserPosts(profileId);
			if (user && user.id !== profileId) {
				checkFollowStatus(profileId);
			}
		}
	}, [profileId, user, fetchUserPosts, fetchFollowCounts, checkFollowStatus]);

	useEffect(() => {
		if (user) {
			fetchAdminStatus(user.id);
		} else {
			setIsAdmin(false);
		}
	}, [user, fetchAdminStatus]);

	// Listen for XP updates from gift sending
	useEffect(() => {
		const handleXPUpdate = (event: CustomEvent) => {
			// If viewing own profile, update the XP and grade
			if (user && profileId === user.id) {
				setProfile(prev => prev ? {
					...prev,
					xp: event.detail.xp || prev.xp,
					current_grade: event.detail.grade || prev.current_grade
				} : null);
			}
		};

		window.addEventListener('xp-updated', handleXPUpdate as EventListener);
		return () => {
			window.removeEventListener('xp-updated', handleXPUpdate as EventListener);
		};
	}, [user, profileId]);


	const handleFollow = async () => {
		if (!user || !profileId) {
			navigate('/auth');
			return;
		}
		const currentIsFollowing = isFollowing;

		setIsFollowing(!currentIsFollowing);
		setFollowCount(prev => ({
			...prev,
			followers: prev.followers + (currentIsFollowing ? -1 : 1)
		}));

		if (currentIsFollowing) {
			const { error } = await supabase
				.from('follows')
				.delete()
				.eq('follower_id', user.id)
				.eq('following_id', profileId);

			if (error) {
				setIsFollowing(true);
				setFollowCount(prev => ({ ...prev, followers: prev.followers + 1 }));
				toast.error(t('profile.failedToUnfollow'));
			} else {
				toast.success(t('profile.unfollow'));
			}
		} else {
			const { error } = await supabase
				.from('follows')
				.insert({ follower_id: user.id, following_id: profileId });

			if (error) {
				setIsFollowing(false);
				setFollowCount(prev => ({ ...prev, followers: prev.followers - 1 }));
				toast.error(t('profile.failedToFollow'));
			} else {
				toast.success(t('profile.follow'));
			}
		}
	};

	const handleStartChat = async () => {
		if (!user || !profileId) {
			navigate('/auth');
			return;
		}

		const { data: existingChats } = await supabase
			.from('chat_members')
			.select('chat_id, chats!inner(is_group)')
			.eq('user_id', user.id);

		if (existingChats) {
			for (const chat of existingChats) {
				if (chat.chats?.is_group === false) {
					const { data: members } = await supabase
						.from('chat_members')
						.select('user_id')
						.eq('chat_id', chat.chat_id);

					if (members && members.length === 2 && members.some(m => m.user_id === profileId)) {
						navigate(`/chat/${chat.chat_id}`);
						return;
					}
				}
			}
		}

		const { data: newChat, error: chatError } = await supabase
			.from('chats')
			.insert({ is_group: false, created_by: user.id })
			.select()
			.single();

		if (chatError) {
			toast.error(t('profile.failedToChat'));
			return;
		}

		const { error: membersError } = await supabase
			.from('chat_members')
			.insert([
				{ chat_id: newChat.id, user_id: user.id },
				{ chat_id: newChat.id, user_id: profileId },
			]);

		if (membersError) {
			toast.error(t('profile.failedToChat'));
			return;
		}

		navigate(`/chat/${newChat.id}`);
	};

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			toast.error('Failed to log out');
			console.error('Logout error:', error);
		} else {
			toast.success('Logged out successfully');
			navigate('/');
		}
	};
    
    const handleEditProfile = () => {
		navigate(`/${urlParam}/edit`);
	};

	const handleAdminDashboard = () => {
		navigate('/admin'); 
	};

	if (loading) {
		return (
			<div className="h-full flex flex-col">
				<div className="p-4 border-b border-border">
					{/* 🚨 MODIFICATION 1: Changed navigate(-1) to navigate('/') */}
					<Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />{t('common.back')}</Button>
					<Skeleton className="h-4 w-1/4 mb-4" />
				</div>
				<div className="p-4">
					<div className="flex items-center justify-between">
						<Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full -mt-10 border-4 border-background" />
						<Skeleton className="h-10 w-32 rounded-full" />
					</div>
					<Skeleton className="h-6 w-1/2 mt-4" />
					<Skeleton className="h-4 w-1/4 mt-1" />
					<Skeleton className="h-4 w-3/4 mt-3" />
					<div className="flex gap-4 mt-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
				<div className="mt-4 border-b border-border">
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="p-4 space-y-4">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-muted-foreground">{t('profile.notFound')}</div>
			</div>
		);
	}

	const formatCount = (count: number) => {
		if (count >= 1000) {
			return (count / 1000).toFixed(1) + 'K';
		}
		return count;
	};

	return (
		<div className="h-full flex flex-col">
			<div className="p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b border-border">
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<Button
							variant="ghost"
							size="icon"
							// 🚨 MODIFICATION 2: Changed navigate(-1) to navigate('/')
							onClick={() => navigate('/')}
							className="rounded-full mr-4"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div>
							<h1 className="text-xl font-bold">{profile.display_name}</h1>
							<p className="text-xs text-muted-foreground">{posts.length} {t('profile.posts')}</p>
						</div>
					</div>
					{user && user.id === profileId && (
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsActionsSheetOpen(true)}
								className="rounded-full"
								title="More options"
							>
								<Settings className="h-5 w-5" />
							</Button>
						</div>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				<div className="h-36 bg-gray-300 dark:bg-gray-700 w-full">
				</div>

				<div className="p-4">
					<div className="flex justify-between items-end -mt-20 sm:-mt-16">
						<div className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg rounded-full overflow-hidden bg-background">
							<ProfileAvatarDisplay profileId={profileId} profile={profile} />
						</div>

					{user && user.id === profileId ? (
						<div className="flex flex-col gap-2">
							<Button 
								variant="outline" 
								className="rounded-full px-4 font-bold"
								onClick={() => navigate('/avatar/edit')}
							>
								<Pencil className="h-4 w-4 mr-2" />
								Customize Owl
							</Button>
							<Button 
								variant="outline" 
								className="rounded-full px-4 font-bold"
								onClick={() => navigate(`/${urlParam}/edit`)}
							>
								<Pencil className="h-4 w-4 mr-2" />
								{t('profile.editProfile')}
							</Button>
								{isAdmin && (
									<Button
										onClick={handleAdminDashboard}
										variant="secondary"
										className="rounded-full px-4 font-bold"
									>
										<Settings className="h-4 w-4 mr-2" />
										{t('profile.adminDashboard')}
									</Button>
								)}
							</div>
						) : (
							<div className="flex gap-2">
								{isFollowing && (
									<Button onClick={handleStartChat} variant="outline" size="icon" className="rounded-full">
										<MessageSquare className="h-5 w-5" />
									</Button>
								)}
								<TipButton
									receiverId={profileId}
									receiverName={profile.display_name}
									variant="outline"
									size="default"
									showLabel={true}
								/>
								<Button
									onClick={handleFollow}
									variant={isFollowing ? "outline" : "default"}
									className="rounded-full px-4 font-bold transition-colors"
									onMouseEnter={e => isFollowing && (e.currentTarget.textContent = t('profile.unfollow'))}
									onMouseLeave={e => isFollowing && (e.currentTarget.textContent = t('profile.following'))}
								>
									{isFollowing ? t('profile.following') :
										<>
											<UserPlus className="h-4 w-4 mr-2" />
											{t('profile.follow')}
										</>
									}
								</Button>
							</div>
						)}
					</div>

					<div className="mt-3">

					{profile.is_affiliate ? (
							<div className="flex items-center gap-1">
								<button 
									className="text-xl font-extrabold leading-tight hover:underline"
									onClick={() => {
										if (profile.affiliated_business && profile.affiliation_date) {
											setSelectedAffiliate({
												userName: profile.display_name,
												businessName: profile.affiliated_business.display_name,
												affiliatedDate: profile.affiliation_date,
												businessLogo: profile.affiliated_business.avatar_url || undefined
											});
										} else {
											console.log('Missing affiliate data:', {
												affiliated_business: profile.affiliated_business,
												affiliation_date: profile.affiliation_date
											});
											toast.error('Affiliate information is not available');
										}
									}}
								>
									{profile.display_name}
								</button>
								
								{profile.is_business_mode && (
									<AffiliatedBadge 
										onClick={() => {
											if (profile.affiliated_business && profile.affiliation_date) {
												setSelectedAffiliate({
													userName: profile.display_name,
													businessName: profile.affiliated_business.display_name,
													affiliatedDate: profile.affiliation_date,
													businessLogo: profile.affiliated_business.avatar_url || undefined
												});
											} else {
												toast.error('Affiliate information is not available');
											}
										}}
									/>
								)}
								
								<div 
									onClick={() => {
										if (profile.affiliated_business && profile.affiliation_date) {
											setSelectedAffiliate({
												userName: profile.display_name,
												businessName: profile.affiliated_business.display_name,
												affiliatedDate: profile.affiliation_date,
												businessLogo: profile.affiliated_business.avatar_url || undefined
											});
										} else {
											toast.error('Affiliate information is not available');
										}
									}}
									className="cursor-pointer"
								>
									<VerifiedBadge
										isVerified={profile.is_verified}
										isOrgVerified={profile.is_organization_verified}
										isAffiliate={profile.is_affiliate}
										affiliateBusinessLogo={profile.affiliated_business?.avatar_url}
										affiliateBusinessName={profile.affiliated_business?.display_name}
									/>
								</div>
								
								{profile.is_business_mode && (
									<BusinessBadge />
								)}
							</div>
						) : (profile.is_verified || profile.is_organization_verified || profile.is_business_mode) ? (
							<Popover>
								<PopoverTrigger asChild>
									<div className="flex items-center gap-1 cursor-pointer w-fit">
										<h1 className="text-xl font-extrabold leading-tight">{profile.display_name}</h1>
									<VerifiedBadge
										isVerified={profile.is_verified}
										isOrgVerified={profile.is_organization_verified}
										isAffiliate={profile.is_affiliate}
										affiliateBusinessLogo={profile.affiliated_business?.avatar_url}
										affiliateBusinessName={profile.affiliated_business?.display_name}
									/>
									{profile.is_business_mode && (
										<BusinessBadge />
									)}
									</div>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0 border-none shadow-xl rounded-2xl" onClick={(e) => e.stopPropagation()}>

									{profile.is_organization_verified ? (
										<div className="p-4 max-w-sm">
											<VerifiedBadge isOrgVerified={true} size="lg" />
											<h3 className="font-bold text-lg mt-2 text-foreground">Verified Organization</h3>
											<p className="text-sm text-muted-foreground mt-1">
												This account is verified because it's a notable organization on AfuChat.
												<span className="block mt-2 font-bold text-foreground">@{profile.handle}</span>
											</p>
										</div>
									) : (
										<div className="p-4 max-w-sm">
											<VerifiedBadge isVerified={true} size="lg" />
											<h3 className="font-bold text-lg mt-2 text-foreground">Verified Account</h3>
											<p className="text-sm text-muted-foreground mt-1">
												This account is verified because it’s notable in government, news, entertainment, or another designated category.
												<span className="block mt-2 font-bold text-foreground">@{profile.handle}</span>
											</p>
										</div>
									)}

								</PopoverContent>
							</Popover>
						) : (
							<div className="flex items-center gap-1">
								<h1 className="text-xl font-extrabold leading-tight">{profile.display_name}</h1>
								{profile.is_business_mode && (
									<BusinessBadge />
								)}
							</div>
						)}

						<p className="text-muted-foreground text-sm">@{profile.handle}</p>
					</div>

					{profile.bio && (
						<ContentParser content={profile.bio} isBio={true} />
					)}

					{/* Website URL - Display for business profiles */}
					{profile.is_business_mode && profile.website_url && (
						<a
							href={profile.website_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
						>
							🌐 {profile.website_url}
						</a>
					)}

					{/* XP Progress Bar */}
					<div className="mt-4">
						<XPProgressBar 
							currentXP={profile.xp} 
							currentGrade={profile.current_grade as Grade}
							showDetails={true}
						/>
					</div>

					<div className="flex items-center space-x-4 mt-3 text-muted-foreground text-sm">
						<div className="flex items-center gap-1">
							<Calendar className="h-4 w-4" />
							<span className="text-xs">Joined {profile.created_at ? new Date(profile.created_at).toLocaleString('en-UG', { month: 'long', year: 'numeric' }) : 'Unknown'}</span>
						</div>
					</div>

					<div className="flex gap-4 mt-3">
						<div className="flex items-center">
							<span className="font-bold text-sm">{formatCount(followCount.following)}</span>
							<span className="text-muted-foreground text-sm ml-1 hover:underline cursor-pointer">{t('profile.following')}</span>
						</div>
						<div className="flex items-center">
							<span className="font-bold text-sm">{formatCount(followCount.followers)}</span>
							<span className="text-muted-foreground text-sm ml-1 hover:underline cursor-pointer">{t('profile.followers')}</span>
						</div>
					</div>
				</div>

				<Separator className="mt-4" />
				<Tabs defaultValue="posts" className="w-full">
					<TabsList className={`grid ${profile.is_business_mode ? 'grid-cols-5' : 'grid-cols-4'} w-full h-12 rounded-none bg-background`}>
						<TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold text-muted-foreground text-xs sm:text-sm">
							{t('profile.posts')}
						</TabsTrigger>
						<TabsTrigger value="achievements" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold text-muted-foreground text-xs sm:text-sm">
							Badges
						</TabsTrigger>
						<TabsTrigger value="gifts" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold text-muted-foreground text-xs sm:text-sm">
							Gifts
						</TabsTrigger>
						{profile.is_business_mode && (
							<TabsTrigger value="affiliates" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold text-muted-foreground text-xs sm:text-sm">
								Affiliates
							</TabsTrigger>
						)}
						{user?.id === profileId && (
							<TabsTrigger value="referrals" className="data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 data-[state=active]:border-primary data-[state=inactive]:border-transparent rounded-none font-bold text-muted-foreground text-xs sm:text-sm">
								Referrals
							</TabsTrigger>
						)}
					</TabsList>

					<TabsContent value="posts">
						{profile.is_private && user?.id !== profileId ? (
							<div className="text-center text-muted-foreground py-12">
								<Lock className="h-8 w-8 mx-auto mb-2" />
								<p className="font-semibold">This profile is private</p>
								<p className="text-sm">Follow to see their posts and activity.</p>
							</div>
						) : posts.length === 0 ? (
							<div className="text-center text-muted-foreground py-12">
								No posts yet.
							</div>
						) : (
							<div className="space-y-0 divide-y divide-border">
								{posts.map((post) => (
									<Card key={post.id} className="p-4 rounded-none border-x-0 border-t-0 hover:bg-muted/10 cursor-pointer transition-colors" onClick={() => navigate(`/post/${post.id}`)}>
										<ContentParser content={post.content} />
										{post.post_images && post.post_images.length > 0 && (
											<div className="mt-3">
												<ImageCarousel 
													images={post.post_images
														.sort((a, b) => a.display_order - b.display_order)
														.map(img => ({ url: img.image_url, alt: img.alt_text || 'Post image' }))}
												/>
											</div>
										)}
										<div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
											<span>{new Date(post.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
										</div>
									</Card>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="achievements">
						<div className="p-4">
							<AchievementBadges userId={profileId!} />
						</div>
					</TabsContent>
				<TabsContent value="gifts">
					<div className="p-4 space-y-4">
						<TipStats userId={profileId!} />
						<ReceivedGifts userId={profileId!} />
					</div>
				</TabsContent>

					{profile.is_business_mode && (
						<TabsContent value="affiliates">
							{affiliatedUsers.length === 0 ? (
								<div className="text-center text-muted-foreground py-12">
									<p className="font-semibold">No affiliates yet</p>
									<p className="text-sm">This business doesn't have any affiliated users.</p>
								</div>
							) : (
								<div className="space-y-0 divide-y divide-border">
									{affiliatedUsers.map((affiliatedUser) => (
										<div 
											key={affiliatedUser.id}
											className="p-4 hover:bg-muted/10 cursor-pointer transition-colors flex items-center gap-3"
											onClick={() => navigate(`/${affiliatedUser.handle}`)}
										>
											<div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
												{affiliatedUser.avatar_url ? (
													<img 
														src={affiliatedUser.avatar_url} 
														alt={affiliatedUser.display_name}
														className="w-full h-full object-cover"
													/>
												) : (
													<DefaultAvatar name={affiliatedUser.display_name} size={48} />
												)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-1">
													<span className="font-bold truncate">{affiliatedUser.display_name}</span>
													<VerifiedBadge
														isVerified={affiliatedUser.is_verified}
														isOrgVerified={affiliatedUser.is_organization_verified}
														isAffiliate={true}
														affiliateBusinessLogo={profile.avatar_url}
														affiliateBusinessName={profile.display_name}
													/>
												</div>
												<p className="text-sm text-muted-foreground">@{affiliatedUser.handle}</p>
												<p className="text-xs text-muted-foreground mt-1">
													Affiliated since {new Date(affiliatedUser.affiliation_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</TabsContent>
					)}

					{user?.id === profileId && (
						<TabsContent value="referrals">
							<div className="p-4">
								<ReferralSystem />
							</div>
						</TabsContent>
					)}
				</Tabs>
			</div>
			
			{/* Profile Actions Sheet */}
			<ProfileActionsSheet
				isOpen={isActionsSheetOpen}
				onClose={() => setIsActionsSheetOpen(false)}
				onLogout={handleLogout}
				onEditProfile={handleEditProfile}
			/>

			{/* Affiliate Details Sheet */}
			{selectedAffiliate && (
				<AffiliateDetailsSheet
					open={!!selectedAffiliate}
					onOpenChange={(open) => !open && setSelectedAffiliate(null)}
					userName={selectedAffiliate.userName}
					businessName={selectedAffiliate.businessName}
					affiliatedDate={selectedAffiliate.affiliatedDate}
					businessLogo={selectedAffiliate.businessLogo}
				/>
			)}
		</div>
	);
};

export default Profile;
