import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Telegram API helper
async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const body: any = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = JSON.stringify(replyMarkup);
  }
  
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function editMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  const body: any = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
  };
  if (replyMarkup) {
    body.reply_markup = JSON.stringify(replyMarkup);
  }
  
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

// Get or create telegram user
async function getOrCreateTelegramUser(telegramUser: any) {
  const { data: existing } = await supabase
    .from('telegram_users')
    .select('*, profiles(*)')
    .eq('telegram_id', telegramUser.id)
    .single();
  
  if (existing) return existing;
  
  const { data: newUser } = await supabase
    .from('telegram_users')
    .insert({
      telegram_id: telegramUser.id,
      telegram_username: telegramUser.username,
      telegram_first_name: telegramUser.first_name,
      telegram_last_name: telegramUser.last_name,
    })
    .select()
    .single();
  
  return newUser;
}

// Menu builders
function buildMainMenu(isLinked: boolean, profile?: any, isAdminUser = false) {
  const greeting = profile ? `👋 Welcome back, <b>${profile.display_name}</b>!` : '👋 Welcome to <b>AfuChat Bot</b>!';
  const balance = profile ? `\n\n💰 <b>Nexa:</b> ${profile.xp?.toLocaleString() || 0}\n🪙 <b>ACoin:</b> ${profile.acoin?.toLocaleString() || 0}` : '';
  
  const text = `${greeting}${balance}

<b>AfuChat</b> - Your social platform on Telegram!

${isLinked ? '✅ Your account is linked' : '🔗 Link your account to access all features'}`;

  const buttons = isLinked ? [
    [{ text: '📰 Feed', callback_data: 'menu_feed' }, { text: '💬 Chats', callback_data: 'menu_chats' }],
    [{ text: '💰 Wallet', callback_data: 'menu_wallet' }, { text: '🎁 Gifts', callback_data: 'menu_gifts' }],
    [{ text: '👤 Profile', callback_data: 'menu_profile' }, { text: '🔔 Notifications', callback_data: 'menu_notifications' }],
    [{ text: '👥 Discover Users', callback_data: 'suggested_users' }],
    [{ text: '⚙️ Settings', callback_data: 'menu_settings' }],
    ...(isAdminUser ? [[{ text: '🔐 Admin Panel', callback_data: 'admin_menu' }]] : []),
  ] : [
    [{ text: '🔗 Link Existing Account', callback_data: 'link_account' }],
    [{ text: '📝 Create New Account', callback_data: 'create_account' }],
    [{ text: 'ℹ️ About AfuChat', callback_data: 'about' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildFeedMenu(posts: any[]) {
  let text = '📰 <b>Latest Posts</b>\n\n';
  
  if (posts.length === 0) {
    text += 'No posts yet. Be the first to post!';
  } else {
    posts.slice(0, 5).forEach((post, i) => {
      const author = post.profiles?.display_name || 'Unknown';
      const content = post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '');
      text += `${i + 1}. <b>${author}</b>\n${content}\n❤️ ${post.likes || 0} | 💬 ${post.replies || 0}\n\n`;
    });
  }

  const buttons = [
    [{ text: '✍️ New Post', callback_data: 'new_post' }],
    [{ text: '🔄 Refresh', callback_data: 'menu_feed' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildWalletMenu(profile: any) {
  const text = `💰 <b>Your Wallet</b>

<b>Nexa Balance:</b> ${profile?.xp?.toLocaleString() || 0} ⚡
<b>ACoin Balance:</b> ${profile?.acoin?.toLocaleString() || 0} 🪙

<b>Current Grade:</b> ${profile?.current_grade || 'Newcomer'}

━━━━━━━━━━━━━━━━━━━━
<i>Earn Nexa by posting, engaging, and daily logins!</i>`;

  const buttons = [
    [{ text: '💱 Convert Nexa → ACoin', callback_data: 'convert_nexa' }],
    [{ text: '📤 Send Nexa', callback_data: 'send_nexa' }],
    [{ text: '📊 Transaction History', callback_data: 'tx_history' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildGiftsMenu() {
  const text = `🎁 <b>Gifts</b>

Send beautiful gifts to your friends and earn rare collectibles!

<b>Features:</b>
• Browse all available gifts
• Send gifts to friends
• View your gift collection
• Trade rare gifts on marketplace`;

  const buttons = [
    [{ text: '🛍️ Browse Gifts', callback_data: 'browse_gifts' }],
    [{ text: '📦 My Collection', callback_data: 'my_gifts' }],
    [{ text: '🏪 Marketplace', callback_data: 'gift_marketplace' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildChatsMenu(chats: any[]) {
  let text = '💬 <b>Your Chats</b>\n\n';
  
  if (chats.length === 0) {
    text += 'No conversations yet. Start chatting!';
  } else {
    chats.slice(0, 5).forEach((chat, i) => {
      const name = chat.name || 'Private Chat';
      const lastMsg = chat.last_message?.slice(0, 30) || 'No messages';
      text += `${i + 1}. <b>${name}</b>\n   ${lastMsg}...\n\n`;
    });
  }

  const buttons = [
    [{ text: '➕ New Chat', callback_data: 'new_chat' }],
    [{ text: '👥 Create Group', callback_data: 'create_group' }],
    [{ text: '🔄 Refresh', callback_data: 'menu_chats' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildProfileMenu(profile: any, followerCount = 0, followingCount = 0) {
  const verified = profile?.is_verified ? '✅' : '';
  const premium = profile?.is_verified ? '⭐ Premium' : '';
  
  const text = `👤 <b>Your Profile</b>

<b>Name:</b> ${profile?.display_name || 'Not set'} ${verified}
<b>Handle:</b> @${profile?.handle || 'not_set'}
<b>Bio:</b> ${profile?.bio || 'No bio yet'}
<b>Country:</b> ${profile?.country || 'Not set'}

<b>Stats:</b>
• Grade: ${profile?.current_grade || 'Newcomer'}
• Nexa: ${profile?.xp?.toLocaleString() || 0}
• Followers: ${followerCount}
• Following: ${followingCount}
• Login Streak: ${profile?.login_streak || 0} days 🔥

${premium}`;

  const buttons = [
    [{ text: '✏️ Edit Profile', callback_data: 'edit_profile' }],
    [{ text: '📊 View Stats', callback_data: 'view_stats' }],
    [{ text: `👥 Followers (${followerCount})`, callback_data: 'my_followers' }, { text: `👥 Following (${followingCount})`, callback_data: 'my_following' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildEditProfileMenu(profile: any) {
  const text = `✏️ <b>Edit Profile</b>

Current values:
• <b>Name:</b> ${profile?.display_name || 'Not set'}
• <b>Username:</b> @${profile?.handle || 'not_set'}
• <b>Bio:</b> ${profile?.bio || 'No bio yet'}
• <b>Country:</b> ${profile?.country || 'Not set'}

Select what you want to edit:`;

  const buttons = [
    [{ text: '📝 Edit Name', callback_data: 'edit_display_name' }],
    [{ text: '📝 Edit Bio', callback_data: 'edit_bio' }],
    [{ text: '🌍 Edit Country', callback_data: 'edit_country' }],
    [{ text: '⬅️ Back to Profile', callback_data: 'menu_profile' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildFollowersMenu(followers: any[], page = 0, totalCount = 0) {
  let text = `👥 <b>Your Followers</b>\n\nTotal: ${totalCount}\n\n`;
  
  if (followers.length === 0) {
    text += 'No followers yet.';
  } else {
    followers.forEach((f, i) => {
      const verified = f.is_verified ? '✅' : '';
      text += `${page * 5 + i + 1}. <b>${f.display_name}</b> ${verified}\n   @${f.handle}\n`;
    });
  }

  const buttons: any[] = [];
  
  const navButtons = [];
  if (page > 0) navButtons.push({ text: '⬅️ Prev', callback_data: `followers_page_${page - 1}` });
  if (totalCount > (page + 1) * 5) navButtons.push({ text: 'Next ➡️', callback_data: `followers_page_${page + 1}` });
  if (navButtons.length > 0) buttons.push(navButtons);
  
  buttons.push([{ text: '⬅️ Back to Profile', callback_data: 'menu_profile' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildFollowingMenu(following: any[], page = 0, totalCount = 0) {
  let text = `👥 <b>Following</b>\n\nTotal: ${totalCount}\n\n`;
  
  if (following.length === 0) {
    text += 'Not following anyone yet.';
  } else {
    following.forEach((f, i) => {
      const verified = f.is_verified ? '✅' : '';
      text += `${page * 5 + i + 1}. <b>${f.display_name}</b> ${verified}\n   @${f.handle}\n`;
    });
  }

  const buttons: any[] = [];
  
  // Add unfollow buttons
  following.forEach(f => {
    buttons.push([{ text: `❌ Unfollow @${f.handle}`, callback_data: `unfollow_${f.id}` }]);
  });
  
  const navButtons = [];
  if (page > 0) navButtons.push({ text: '⬅️ Prev', callback_data: `following_page_${page - 1}` });
  if (totalCount > (page + 1) * 5) navButtons.push({ text: 'Next ➡️', callback_data: `following_page_${page + 1}` });
  if (navButtons.length > 0) buttons.push(navButtons);
  
  buttons.push([{ text: '⬅️ Back to Profile', callback_data: 'menu_profile' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildNotificationsMenu(notifications: any[]) {
  let text = '🔔 <b>Notifications</b>\n\n';
  
  if (notifications.length === 0) {
    text += 'No new notifications!';
  } else {
    notifications.slice(0, 10).forEach((notif) => {
      const icon = notif.type === 'new_like' ? '❤️' : 
                   notif.type === 'new_follower' ? '👤' :
                   notif.type === 'new_reply' ? '💬' :
                   notif.type === 'gift' ? '🎁' : '📢';
      text += `${icon} ${notif.message || notif.type}\n`;
    });
  }

  const buttons = [
    [{ text: '✅ Mark All Read', callback_data: 'mark_read' }],
    [{ text: '🔄 Refresh', callback_data: 'menu_notifications' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildSettingsMenu() {
  const text = `⚙️ <b>Settings</b>

Manage your AfuChat account settings.`;

  const buttons = [
    [{ text: '🔔 Notification Settings', callback_data: 'notif_settings' }],
    [{ text: '🔒 Privacy Settings', callback_data: 'privacy_settings' }],
    [{ text: '🔗 Unlink Account', callback_data: 'unlink_account' }],
    [{ text: '🌐 Open Web App', callback_data: 'open_webapp' }],
    [{ text: '🗑️ Delete Account', callback_data: 'delete_account' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildSuggestedUsersMenu(users: any[], followingIds: string[]) {
  let text = '👥 <b>Suggested Users to Follow</b>\n\n';
  text += 'Follow at least one user to get started!\n\n';
  
  if (users.length === 0) {
    text += 'No suggested users available at the moment.';
  } else {
    users.forEach((user, i) => {
      const verified = user.is_verified ? '✅' : '';
      const business = user.is_business_mode ? '💼' : '';
      const following = followingIds.includes(user.id) ? '✓ Following' : '';
      text += `${i + 1}. <b>${user.display_name}</b> ${verified}${business}\n   @${user.handle} ${following}\n`;
      if (user.bio) text += `   <i>${user.bio.slice(0, 50)}${user.bio.length > 50 ? '...' : ''}</i>\n`;
      text += '\n';
    });
  }

  const buttons = users.map(user => {
    const isFollowing = followingIds.includes(user.id);
    return [{ 
      text: isFollowing ? `✓ Following @${user.handle}` : `➕ Follow @${user.handle}`, 
      callback_data: `follow_${user.id}` 
    }];
  });
  
  buttons.push([{ text: '🔄 Refresh', callback_data: 'suggested_users' }]);
  buttons.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildDeleteAccountMenu() {
  const text = `⚠️ <b>Delete Account</b>

<b>WARNING:</b> This action is <b>PERMANENT</b> and cannot be undone!

Deleting your account will remove:
• All your posts and replies
• All your messages and chats
• All your followers and following
• Your Nexa and ACoin balance
• All gifts sent and received
• All your data

Are you absolutely sure you want to delete your account?`;

  const buttons = [
    [{ text: '⚠️ Yes, Delete My Account', callback_data: 'confirm_delete_account' }],
    [{ text: '❌ Cancel', callback_data: 'menu_settings' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

// Admin menu builders
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  return !!data;
}

function buildAdminMenu() {
  const text = `🔐 <b>Admin Dashboard</b>

Manage the AfuChat platform:`;

  const buttons = [
    [{ text: '👥 Manage Users', callback_data: 'admin_users' }],
    [{ text: '📰 Manage Posts', callback_data: 'admin_posts' }],
    [{ text: '💰 Manage Wallets', callback_data: 'admin_wallets' }],
    [{ text: '📊 Platform Stats', callback_data: 'admin_stats' }],
    [{ text: '🎁 Manage Gifts', callback_data: 'admin_gifts' }],
    [{ text: '⭐ Subscriptions', callback_data: 'admin_subscriptions' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminStatsMenu() {
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
  const { count: messageCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
  const { count: activeSubCount } = await supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: giftTxCount } = await supabase.from('gift_transactions').select('*', { count: 'exact', head: true });
  const { data: totalNexa } = await supabase.from('profiles').select('xp');
  const { data: totalACoin } = await supabase.from('profiles').select('acoin');
  
  const totalNexaSum = totalNexa?.reduce((acc: number, p: any) => acc + (p.xp || 0), 0) || 0;
  const totalACoinSum = totalACoin?.reduce((acc: number, p: any) => acc + (p.acoin || 0), 0) || 0;
  
  const text = `📊 <b>Platform Statistics</b>

<b>Users:</b>
👥 Total Users: ${userCount?.toLocaleString() || 0}
⭐ Active Subscriptions: ${activeSubCount?.toLocaleString() || 0}

<b>Content:</b>
📰 Total Posts: ${postCount?.toLocaleString() || 0}
💬 Total Messages: ${messageCount?.toLocaleString() || 0}
🎁 Gift Transactions: ${giftTxCount?.toLocaleString() || 0}

<b>Economy:</b>
⚡ Total Nexa in Circulation: ${totalNexaSum.toLocaleString()}
🪙 Total ACoin in Circulation: ${totalACoinSum.toLocaleString()}`;

  const buttons = [
    [{ text: '🔄 Refresh', callback_data: 'admin_stats' }],
    [{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminUsersMenu(page = 0) {
  const pageSize = 5;
  const { data: users, count } = await supabase
    .from('profiles')
    .select('id, display_name, handle, xp, acoin, is_verified, is_business_mode, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  let text = `👥 <b>User Management</b>\n\nPage ${page + 1} of ${Math.ceil((count || 0) / pageSize)}\n\n`;
  
  (users || []).forEach((u: any, i: number) => {
    const verified = u.is_verified ? '✅' : '';
    const business = u.is_business_mode ? '💼' : '';
    text += `${page * pageSize + i + 1}. <b>${u.display_name}</b> ${verified}${business}\n   @${u.handle} | ${u.xp} Nexa\n\n`;
  });

  const buttons = (users || []).map((u: any) => ([
    { text: `👤 ${u.display_name}`, callback_data: `admin_user_${u.id}` }
  ]));
  
  const navButtons = [];
  if (page > 0) navButtons.push({ text: '⬅️ Prev', callback_data: `admin_users_page_${page - 1}` });
  if ((count || 0) > (page + 1) * pageSize) navButtons.push({ text: 'Next ➡️', callback_data: `admin_users_page_${page + 1}` });
  if (navButtons.length > 0) buttons.push(navButtons);
  
  buttons.push([{ text: '🔍 Search User', callback_data: 'admin_search_user' }]);
  buttons.push([{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminUserDetailMenu(userId: string) {
  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (!user) {
    return { text: '❌ User not found', reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'admin_users' }]] } };
  }

  const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId);
  const { count: followerCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
  
  const verified = user.is_verified ? '✅' : '❌';
  const business = user.is_business_mode ? '💼 Business' : '👤 Personal';
  
  const text = `👤 <b>${user.display_name}</b>

<b>Handle:</b> @${user.handle}
<b>Bio:</b> ${user.bio || 'No bio'}
<b>Country:</b> ${user.country || 'Not set'}

<b>Status:</b>
• Verified: ${verified}
• Account Type: ${business}
• Grade: ${user.current_grade || 'Newcomer'}

<b>Economy:</b>
• Nexa: ${user.xp?.toLocaleString() || 0}
• ACoin: ${user.acoin?.toLocaleString() || 0}

<b>Stats:</b>
• Posts: ${postCount || 0}
• Followers: ${followerCount || 0}
• Login Streak: ${user.login_streak || 0} days

<b>Created:</b> ${new Date(user.created_at).toLocaleDateString()}`;

  const buttons = [
    [{ text: '➕ Give Nexa', callback_data: `admin_give_nexa_${userId}` }, { text: '➕ Give ACoin', callback_data: `admin_give_acoin_${userId}` }],
    [{ text: user.is_verified ? '❌ Remove Verified' : '✅ Verify User', callback_data: `admin_toggle_verify_${userId}` }],
    [{ text: '🗑️ Delete User', callback_data: `admin_delete_user_${userId}` }],
    [{ text: '⬅️ Back to Users', callback_data: 'admin_users' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminPostsMenu(page = 0) {
  const pageSize = 5;
  const { data: posts, count } = await supabase
    .from('posts')
    .select('id, content, author_id, created_at, profiles(display_name, handle)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  let text = `📰 <b>Post Management</b>\n\nPage ${page + 1} of ${Math.ceil((count || 0) / pageSize)}\n\n`;
  
  (posts || []).forEach((p: any, i: number) => {
    const content = p.content.slice(0, 50) + (p.content.length > 50 ? '...' : '');
    text += `${page * pageSize + i + 1}. <b>${p.profiles?.display_name || 'Unknown'}</b>\n   ${content}\n\n`;
  });

  const buttons = (posts || []).map((p: any) => ([
    { text: `📄 Post by ${p.profiles?.display_name || 'Unknown'}`, callback_data: `admin_post_${p.id}` }
  ]));
  
  const navButtons = [];
  if (page > 0) navButtons.push({ text: '⬅️ Prev', callback_data: `admin_posts_page_${page - 1}` });
  if ((count || 0) > (page + 1) * pageSize) navButtons.push({ text: 'Next ➡️', callback_data: `admin_posts_page_${page + 1}` });
  if (navButtons.length > 0) buttons.push(navButtons);
  
  buttons.push([{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminPostDetailMenu(postId: string) {
  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(display_name, handle)')
    .eq('id', postId)
    .single();
  
  if (!post) {
    return { text: '❌ Post not found', reply_markup: { inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'admin_posts' }]] } };
  }

  const { count: likeCount } = await supabase.from('post_acknowledgments').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  const { count: replyCount } = await supabase.from('post_replies').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  
  const text = `📰 <b>Post Details</b>

<b>Author:</b> ${post.profiles?.display_name} (@${post.profiles?.handle})
<b>Created:</b> ${new Date(post.created_at).toLocaleString()}

<b>Content:</b>
${post.content}

<b>Stats:</b>
❤️ ${likeCount || 0} likes | 💬 ${replyCount || 0} replies | 👁️ ${post.view_count || 0} views`;

  const buttons = [
    [{ text: '🗑️ Delete Post', callback_data: `admin_delete_post_${postId}` }],
    [{ text: '⬅️ Back to Posts', callback_data: 'admin_posts' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

async function buildAdminSubscriptionsMenu() {
  const { data: subs, count } = await supabase
    .from('user_subscriptions')
    .select('*, profiles(display_name, handle), subscription_plans(name)', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10);

  let text = `⭐ <b>Active Subscriptions</b>\n\nTotal Active: ${count || 0}\n\n`;
  
  (subs || []).forEach((s: any, i: number) => {
    text += `${i + 1}. <b>${s.profiles?.display_name}</b> (@${s.profiles?.handle})\n   Plan: ${s.subscription_plans?.name || 'Unknown'}\n   Expires: ${new Date(s.expires_at).toLocaleDateString()}\n\n`;
  });

  const buttons = [
    [{ text: '🔄 Refresh', callback_data: 'admin_subscriptions' }],
    [{ text: '⬅️ Admin Menu', callback_data: 'admin_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildLinkAccountMenu() {
  const text = `🔗 <b>Link Your AfuChat Account</b>

Choose how you want to link your account:

<b>Option 1:</b> Enter your AfuChat email address
<b>Option 2:</b> Enter a link code from the app
<b>Option 3:</b> Generate code in Settings → Security`;

  const buttons = [
    [{ text: '📧 Link via Email', callback_data: 'link_via_email' }],
    [{ text: '🔑 Enter Link Code', callback_data: 'enter_link_code' }],
    [{ text: '⬅️ Back', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildCreateAccountMenu() {
  const text = `📝 <b>Create New AfuChat Account</b>

Create a new AfuChat account directly from Telegram!

Your Telegram info will be used:
• Name: Will use your Telegram name
• Username: Will try to use @${'{telegram_username}'}

You'll need to provide:
• Email address
• Password`;

  const buttons = [
    [{ text: '✅ Start Registration', callback_data: 'start_registration' }],
    [{ text: '⬅️ Back', callback_data: 'main_menu' }],
  ];

  return { text, reply_markup: { inline_keyboard: buttons } };
}

function buildBrowseGiftsMenu(gifts: any[]) {
  let text = '🛍️ <b>Available Gifts</b>\n\n';
  
  gifts.slice(0, 8).forEach((gift) => {
    const price = Math.ceil(gift.base_xp_cost * (gift.price_multiplier || 1));
    text += `${gift.emoji} <b>${gift.name}</b> - ${price} Nexa\n`;
  });

  const buttons = gifts.slice(0, 8).map(gift => ([
    { text: `${gift.emoji} ${gift.name}`, callback_data: `gift_${gift.id}` }
  ]));
  
  buttons.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);

  return { text, reply_markup: { inline_keyboard: buttons } };
}

// Handle callback queries
async function handleCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const telegramUser = callbackQuery.from;
  
  await answerCallbackQuery(callbackQuery.id);
  
  const tgUser = await getOrCreateTelegramUser(telegramUser);
  const isLinked = tgUser?.is_linked && tgUser?.user_id;
  const profile = tgUser?.profiles;

  // Check if user is admin
  const isAdminUser = isLinked && tgUser?.user_id ? await isAdmin(tgUser.user_id) : false;

  switch (data) {
    case 'main_menu': {
      const menu = buildMainMenu(isLinked, profile, isAdminUser);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_menu': {
      if (!isLinked || !isAdminUser) {
        await editMessage(chatId, messageId, '❌ Access denied. Admin privileges required.', {
          inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      const menu = buildAdminMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_stats': {
      if (!isAdminUser) return;
      const menu = await buildAdminStatsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_users': {
      if (!isAdminUser) return;
      const menu = await buildAdminUsersMenu(0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_posts': {
      if (!isAdminUser) return;
      const menu = await buildAdminPostsMenu(0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_subscriptions': {
      if (!isAdminUser) return;
      const menu = await buildAdminSubscriptionsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_search_user': {
      if (!isAdminUser) return;
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'admin_awaiting_user_search' })
        .eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '🔍 Enter username or display name to search:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'admin_users' }]]
      });
      break;
    }
    
    case 'menu_feed': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first to access the feed.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles(display_name, handle)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      const { data: replyCounts } = await supabase
        .from('post_replies')
        .select('post_id');
      
      const { data: likeCounts } = await supabase
        .from('post_acknowledgments')
        .select('post_id');
      
      const postsWithCounts = (posts || []).map(post => ({
        ...post,
        replies: replyCounts?.filter(r => r.post_id === post.id).length || 0,
        likes: likeCounts?.filter(l => l.post_id === post.id).length || 0,
      }));
      
      const menu = buildFeedMenu(postsWithCounts);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_wallet': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first to access your wallet.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tgUser.user_id)
        .single();
      
      const menu = buildWalletMenu(freshProfile);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_gifts': {
      const menu = buildGiftsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'browse_gifts': {
      const { data: gifts } = await supabase
        .from('gifts')
        .select('*, gift_statistics(price_multiplier)')
        .order('base_xp_cost', { ascending: true })
        .limit(8);
      
      const giftsWithMultiplier = (gifts || []).map(g => ({
        ...g,
        price_multiplier: g.gift_statistics?.price_multiplier || 1
      }));
      
      const menu = buildBrowseGiftsMenu(giftsWithMultiplier);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_chats': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first to access chats.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: chatMembers } = await supabase
        .from('chat_members')
        .select('chat_id, chats(name, is_group)')
        .eq('user_id', tgUser.user_id)
        .limit(5);
      
      const chats = (chatMembers || []).map((cm: any) => ({
        name: cm.chats?.name,
        is_group: cm.chats?.is_group
      }));
      
      const menu = buildChatsMenu(chats);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'menu_profile': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first to view your profile.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tgUser.user_id)
        .single();
      
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', tgUser.user_id);
      
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', tgUser.user_id);
      
      const menu = buildProfileMenu(freshProfile, followerCount || 0, followingCount || 0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'edit_profile': {
      if (!isLinked) return;
      
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tgUser.user_id)
        .single();
      
      const menu = buildEditProfileMenu(freshProfile);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'edit_display_name': {
      if (!isLinked) return;
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_display_name' })
        .eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📝 Enter your new display name:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'edit_bio': {
      if (!isLinked) return;
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_bio' })
        .eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📝 Enter your new bio (max 160 characters):', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'edit_country': {
      if (!isLinked) return;
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_country' })
        .eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '🌍 Enter your country name (e.g., United States, Uganda, Germany):', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
      });
      break;
    }
    
    case 'my_followers': {
      if (!isLinked) return;
      
      const { data: followers, count } = await supabase
        .from('follows')
        .select('follower_id, profiles!follows_follower_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
        .eq('following_id', tgUser.user_id)
        .order('created_at', { ascending: false })
        .range(0, 4);
      
      const followerProfiles = (followers || []).map((f: any) => f.profiles).filter(Boolean);
      const menu = buildFollowersMenu(followerProfiles, 0, count || 0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'my_following': {
      if (!isLinked) return;
      
      const { data: following, count } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
        .eq('follower_id', tgUser.user_id)
        .order('created_at', { ascending: false })
        .range(0, 4);
      
      const followingProfiles = (following || []).map((f: any) => f.profiles).filter(Boolean);
      const menu = buildFollowingMenu(followingProfiles, 0, count || 0);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'link_via_email': {
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_email_link' })
        .eq('telegram_id', telegramUser.id);
      await editMessage(chatId, messageId, '📧 <b>Link via Email</b>\n\nEnter the email address associated with your AfuChat account:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
      });
      break;
    }
    
    case 'menu_notifications': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 Please link your account first to view notifications.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', tgUser.user_id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const menu = buildNotificationsMenu(notifications || []);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'mark_read': {
      if (isLinked) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', tgUser.user_id);
      }
      
      await editMessage(chatId, messageId, '✅ All notifications marked as read!', {
        inline_keyboard: [[{ text: '🔔 Notifications', callback_data: 'menu_notifications' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
      });
      break;
    }
    
    case 'menu_settings': {
      const menu = buildSettingsMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'link_account': {
      const menu = buildLinkAccountMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'create_account': {
      const menu = buildCreateAccountMenu();
      await editMessage(chatId, messageId, menu.text.replace('{telegram_username}', telegramUser.username || 'username'), menu.reply_markup);
      break;
    }
    
    case 'enter_link_code': {
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_link_code' })
        .eq('telegram_id', telegramUser.id);
      
      await editMessage(chatId, messageId, '🔑 Please enter your link code:\n\n<i>Get this code from AfuChat Settings → Security → Link Telegram</i>', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
      });
      break;
    }
    
    case 'start_registration': {
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_email' })
        .eq('telegram_id', telegramUser.id);
      
      await editMessage(chatId, messageId, '📧 Please enter your email address:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'main_menu' }]]
      });
      break;
    }
    
    case 'about': {
      const aboutText = `ℹ️ <b>About AfuChat</b>

AfuChat is a social platform where you can:

📰 Share posts and stories
💬 Chat with friends
🎁 Send and receive gifts
💰 Earn Nexa rewards
🏆 Climb the leaderboard
🎮 Play games

<b>Website:</b> afuchat.com
<b>Support:</b> support@afuchat.com`;

      await editMessage(chatId, messageId, aboutText, {
        inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
      });
      break;
    }
    
    case 'new_post': {
      if (!isLinked) return;
      
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_post_content' })
        .eq('telegram_id', telegramUser.id);
      
      await editMessage(chatId, messageId, '✍️ <b>Create New Post</b>\n\nSend me the content for your post:', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_feed' }]]
      });
      break;
    }
    
    case 'convert_nexa': {
      if (!isLinked) return;
      
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_convert_amount' })
        .eq('telegram_id', telegramUser.id);
      
      await editMessage(chatId, messageId, `💱 <b>Convert Nexa to ACoin</b>

Current balance: ${profile?.xp?.toLocaleString() || 0} Nexa
Conversion rate: 5.99% fee

Enter the amount of Nexa to convert:`, {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
      });
      break;
    }
    
    case 'send_nexa': {
      if (!isLinked) return;
      
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'awaiting_send_recipient' })
        .eq('telegram_id', telegramUser.id);
      
      await editMessage(chatId, messageId, `📤 <b>Send Nexa</b>

Current balance: ${profile?.xp?.toLocaleString() || 0} Nexa

Enter the recipient's username (without @):`, {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
      });
      break;
    }
    
    case 'open_webapp': {
      await editMessage(chatId, messageId, '🌐 Open AfuChat in your browser:\n\nhttps://afuchat.com', {
        inline_keyboard: [
          [{ text: '🌐 Open AfuChat', url: 'https://afuchat.com' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      });
      break;
    }
    
    case 'unlink_account': {
      await editMessage(chatId, messageId, '⚠️ <b>Unlink Account</b>\n\nAre you sure you want to unlink your AfuChat account from this Telegram?', {
        inline_keyboard: [
          [{ text: '✅ Yes, Unlink', callback_data: 'confirm_unlink' }],
          [{ text: '❌ Cancel', callback_data: 'menu_settings' }]
        ]
      });
      break;
    }
    
    case 'confirm_unlink': {
      await supabase
        .from('telegram_users')
        .update({ user_id: null, is_linked: false })
        .eq('telegram_id', telegramUser.id);
      
      const menu = buildMainMenu(false, null);
      await editMessage(chatId, messageId, '✅ Account unlinked successfully!\n\n' + menu.text, menu.reply_markup);
      break;
    }
    
    case 'delete_account': {
      if (!isLinked) {
        await editMessage(chatId, messageId, '🔗 No account linked to delete.', {
          inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const menu = buildDeleteAccountMenu();
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    case 'confirm_delete_account': {
      if (!isLinked || !tgUser.user_id) {
        await editMessage(chatId, messageId, '❌ No account to delete.', {
          inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      await editMessage(chatId, messageId, '⏳ <b>Deleting your account...</b>\n\nThis may take a moment...', {
        inline_keyboard: []
      });
      
      try {
        // Delete user data in order (to respect foreign key constraints)
        const userId = tgUser.user_id;
        
        // Delete messages
        await supabase.from('message_reactions').delete().eq('user_id', userId);
        await supabase.from('message_status').delete().eq('user_id', userId);
        await supabase.from('messages').delete().eq('sender_id', userId);
        await supabase.from('chat_members').delete().eq('user_id', userId);
        await supabase.from('chats').delete().eq('created_by', userId);
        
        // Delete posts
        await supabase.from('post_acknowledgments').delete().eq('user_id', userId);
        await supabase.from('post_replies').delete().eq('author_id', userId);
        const { data: userPosts } = await supabase.from('posts').select('id').eq('author_id', userId);
        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map((p: any) => p.id);
          await supabase.from('post_images').delete().in('post_id', postIds);
          await supabase.from('post_link_previews').delete().in('post_id', postIds);
          await supabase.from('post_views').delete().in('post_id', postIds);
        }
        await supabase.from('posts').delete().eq('author_id', userId);
        
        // Delete follows
        await supabase.from('follows').delete().eq('follower_id', userId);
        await supabase.from('follows').delete().eq('following_id', userId);
        
        // Delete tips
        await supabase.from('tips').delete().eq('sender_id', userId);
        await supabase.from('tips').delete().eq('receiver_id', userId);
        
        // Delete gifts
        await supabase.from('gift_transactions').delete().eq('sender_id', userId);
        await supabase.from('gift_transactions').delete().eq('receiver_id', userId);
        await supabase.from('pinned_gifts').delete().eq('user_id', userId);
        
        // Delete red envelopes
        await supabase.from('red_envelope_claims').delete().eq('claimer_id', userId);
        await supabase.from('red_envelopes').delete().eq('sender_id', userId);
        
        // Delete game data
        await supabase.from('game_scores').delete().eq('user_id', userId);
        await supabase.from('game_sessions').delete().eq('player_id', userId);
        await supabase.from('game_challenges').delete().eq('challenger_id', userId);
        await supabase.from('game_challenges').delete().eq('opponent_id', userId);
        
        // Delete marketplace
        await supabase.from('marketplace_listings').delete().eq('user_id', userId);
        
        // Delete notifications
        await supabase.from('notifications').delete().eq('user_id', userId);
        await supabase.from('notifications').delete().eq('actor_id', userId);
        await supabase.from('notification_preferences').delete().eq('user_id', userId);
        
        // Delete user achievements
        await supabase.from('user_achievements').delete().eq('user_id', userId);
        await supabase.from('user_activity_log').delete().eq('user_id', userId);
        await supabase.from('unlocked_accessories').delete().eq('user_id', userId);
        
        // Delete transactions
        await supabase.from('acoin_transactions').delete().eq('user_id', userId);
        
        // Delete referrals
        await supabase.from('referrals').delete().eq('referrer_id', userId);
        await supabase.from('referrals').delete().eq('referred_id', userId);
        
        // Delete security
        await supabase.from('security_alerts').delete().eq('user_id', userId);
        await supabase.from('active_sessions').delete().eq('user_id', userId);
        await supabase.from('login_history').delete().eq('user_id', userId);
        
        // Delete stories
        await supabase.from('story_views').delete().eq('viewer_id', userId);
        await supabase.from('stories').delete().eq('user_id', userId);
        
        // Delete chat preferences
        await supabase.from('chat_preferences').delete().eq('user_id', userId);
        await supabase.from('chat_folders').delete().eq('user_id', userId);
        await supabase.from('chat_labels').delete().eq('user_id', userId);
        
        // Delete subscriptions
        await supabase.from('user_subscriptions').delete().eq('user_id', userId);
        
        // Delete affiliate requests
        await supabase.from('affiliate_requests').delete().eq('user_id', userId);
        
        // Delete telegram link
        await supabase.from('telegram_users').delete().eq('user_id', userId);
        
        // Delete profile
        await supabase.from('profiles').delete().eq('id', userId);
        
        // Delete auth user
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
        
        if (deleteAuthError) {
          console.error('Error deleting auth user:', deleteAuthError);
          throw new Error('Failed to delete authentication record');
        }
        
        // Re-create telegram user entry (unlinked)
        await supabase.from('telegram_users').insert({
          telegram_id: telegramUser.id,
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.first_name,
          telegram_last_name: telegramUser.last_name,
          is_linked: false
        });
        
        const menu = buildMainMenu(false, null);
        await editMessage(chatId, messageId, '✅ <b>Account Permanently Deleted</b>\n\nYour AfuChat account has been completely removed.\n\nYou can create a new account anytime.\n\n' + menu.text, menu.reply_markup);
      } catch (error) {
        console.error('Delete account error:', error);
        await editMessage(chatId, messageId, '❌ Failed to delete account. Please try again or contact support.', {
          inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'confirm_delete_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      }
      break;
    }
    
    case 'suggested_users': {
      if (!isLinked || !tgUser.user_id) {
        await editMessage(chatId, messageId, '🔗 Please link your account first.', {
          inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      // Get suggested users
      const { data: suggestedUsers } = await supabase
        .from('profiles')
        .select('id, display_name, handle, bio, avatar_url, is_verified, is_business_mode')
        .neq('id', tgUser.user_id)
        .order('xp', { ascending: false })
        .limit(5);
      
      // Get current following
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', tgUser.user_id);
      
      const followingIds = (following || []).map((f: any) => f.following_id);
      
      const menu = buildSuggestedUsersMenu(suggestedUsers || [], followingIds);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
      break;
    }
    
    default: {
      // Admin pagination handlers
      if (data.startsWith('admin_users_page_')) {
        if (!isAdminUser) return;
        const page = parseInt(data.replace('admin_users_page_', ''));
        const menu = await buildAdminUsersMenu(page);
        await editMessage(chatId, messageId, menu.text, menu.reply_markup);
        return;
      }
      
      if (data.startsWith('admin_posts_page_')) {
        if (!isAdminUser) return;
        const page = parseInt(data.replace('admin_posts_page_', ''));
        const menu = await buildAdminPostsMenu(page);
        await editMessage(chatId, messageId, menu.text, menu.reply_markup);
        return;
      }
      
      if (data.startsWith('admin_user_')) {
        if (!isAdminUser) return;
        const userId = data.replace('admin_user_', '');
        const menu = await buildAdminUserDetailMenu(userId);
        await editMessage(chatId, messageId, menu.text, menu.reply_markup);
        return;
      }
      
      if (data.startsWith('admin_post_')) {
        if (!isAdminUser) return;
        const postId = data.replace('admin_post_', '');
        const menu = await buildAdminPostDetailMenu(postId);
        await editMessage(chatId, messageId, menu.text, menu.reply_markup);
        return;
      }
      
      if (data.startsWith('admin_give_nexa_')) {
        if (!isAdminUser) return;
        const targetUserId = data.replace('admin_give_nexa_', '');
        await supabase
          .from('telegram_users')
          .update({ current_menu: 'admin_awaiting_nexa_amount', menu_data: { target_user_id: targetUserId } })
          .eq('telegram_id', telegramUser.id);
        await editMessage(chatId, messageId, '➕ Enter the amount of Nexa to give:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: `admin_user_${targetUserId}` }]]
        });
        return;
      }
      
      if (data.startsWith('admin_give_acoin_')) {
        if (!isAdminUser) return;
        const targetUserId = data.replace('admin_give_acoin_', '');
        await supabase
          .from('telegram_users')
          .update({ current_menu: 'admin_awaiting_acoin_amount', menu_data: { target_user_id: targetUserId } })
          .eq('telegram_id', telegramUser.id);
        await editMessage(chatId, messageId, '➕ Enter the amount of ACoin to give:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: `admin_user_${targetUserId}` }]]
        });
        return;
      }
      
      if (data.startsWith('admin_toggle_verify_')) {
        if (!isAdminUser) return;
        const targetUserId = data.replace('admin_toggle_verify_', '');
        const { data: user } = await supabase.from('profiles').select('is_verified').eq('id', targetUserId).single();
        await supabase.from('profiles').update({ is_verified: !user?.is_verified }).eq('id', targetUserId);
        const menu = await buildAdminUserDetailMenu(targetUserId);
        await editMessage(chatId, messageId, `✅ User verification ${user?.is_verified ? 'removed' : 'granted'}!\n\n` + menu.text, menu.reply_markup);
        return;
      }
      
      if (data.startsWith('admin_delete_user_')) {
        if (!isAdminUser) return;
        const targetUserId = data.replace('admin_delete_user_', '');
        await editMessage(chatId, messageId, '⚠️ Are you sure you want to DELETE this user? This cannot be undone!', {
          inline_keyboard: [
            [{ text: '⚠️ Yes, Delete User', callback_data: `admin_confirm_delete_user_${targetUserId}` }],
            [{ text: '❌ Cancel', callback_data: `admin_user_${targetUserId}` }]
          ]
        });
        return;
      }
      
      if (data.startsWith('admin_confirm_delete_user_')) {
        if (!isAdminUser) return;
        const targetUserId = data.replace('admin_confirm_delete_user_', '');
        // Delete user data (simplified - main tables)
        await supabase.from('posts').delete().eq('author_id', targetUserId);
        await supabase.from('follows').delete().eq('follower_id', targetUserId);
        await supabase.from('follows').delete().eq('following_id', targetUserId);
        await supabase.from('notifications').delete().eq('user_id', targetUserId);
        await supabase.from('telegram_users').delete().eq('user_id', targetUserId);
        await supabase.from('profiles').delete().eq('id', targetUserId);
        await supabase.auth.admin.deleteUser(targetUserId);
        
        const menu = await buildAdminUsersMenu(0);
        await editMessage(chatId, messageId, '✅ User deleted successfully!\n\n' + menu.text, menu.reply_markup);
        return;
      }
      
      if (data.startsWith('admin_delete_post_')) {
        if (!isAdminUser) return;
        const postId = data.replace('admin_delete_post_', '');
        await editMessage(chatId, messageId, '⚠️ Are you sure you want to DELETE this post?', {
          inline_keyboard: [
            [{ text: '⚠️ Yes, Delete Post', callback_data: `admin_confirm_delete_post_${postId}` }],
            [{ text: '❌ Cancel', callback_data: `admin_post_${postId}` }]
          ]
        });
        return;
      }
      
      if (data.startsWith('admin_confirm_delete_post_')) {
        if (!isAdminUser) return;
        const postId = data.replace('admin_confirm_delete_post_', '');
        await supabase.from('post_acknowledgments').delete().eq('post_id', postId);
        await supabase.from('post_replies').delete().eq('post_id', postId);
        await supabase.from('post_images').delete().eq('post_id', postId);
        await supabase.from('post_link_previews').delete().eq('post_id', postId);
        await supabase.from('post_views').delete().eq('post_id', postId);
        await supabase.from('posts').delete().eq('id', postId);
        
        const menu = await buildAdminPostsMenu(0);
        await editMessage(chatId, messageId, '✅ Post deleted successfully!\n\n' + menu.text, menu.reply_markup);
        return;
      }

      // Handle gift selection
      if (data.startsWith('gift_')) {
        const giftId = data.replace('gift_', '');
        
        const { data: gift } = await supabase
          .from('gifts')
          .select('*, gift_statistics(price_multiplier)')
          .eq('id', giftId)
          .single();
        
        if (gift) {
          const price = Math.ceil(gift.base_xp_cost * (gift.gift_statistics?.price_multiplier || 1));
          
          await editMessage(chatId, messageId, `${gift.emoji} <b>${gift.name}</b>

${gift.description || 'A beautiful gift'}

<b>Rarity:</b> ${gift.rarity}
<b>Price:</b> ${price} Nexa

To send this gift, enter the recipient's username:`, {
            inline_keyboard: [
              [{ text: '🎁 Send Gift', callback_data: `send_gift_${giftId}` }],
              [{ text: '⬅️ Back', callback_data: 'browse_gifts' }]
            ]
          });
        }
      }
      
      // Handle send gift
      if (data.startsWith('send_gift_')) {
        if (!isLinked) {
          await editMessage(chatId, messageId, '🔗 Please link your account first to send gifts.', {
            inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }]]
          });
          return;
        }
        
        const giftId = data.replace('send_gift_', '');
        
        await supabase
          .from('telegram_users')
          .update({ 
            current_menu: 'awaiting_gift_recipient',
            menu_data: { gift_id: giftId }
          })
          .eq('telegram_id', telegramUser.id);
        
        await editMessage(chatId, messageId, '🎁 Enter the recipient\'s username (without @):', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'browse_gifts' }]]
        });
      }
      
      // Handle follow user
      if (data.startsWith('follow_')) {
        if (!isLinked || !tgUser.user_id) {
          await editMessage(chatId, messageId, '🔗 Please link your account first.', {
            inline_keyboard: [[{ text: '🔗 Link Account', callback_data: 'link_account' }]]
          });
          return;
        }
        
        const targetUserId = data.replace('follow_', '');
        
        // Check if already following
        const { data: existingFollow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', tgUser.user_id)
          .eq('following_id', targetUserId)
          .single();
        
        if (existingFollow) {
          // Unfollow
          await supabase
            .from('follows')
            .delete()
            .eq('follower_id', tgUser.user_id)
            .eq('following_id', targetUserId);
          
          await answerCallbackQuery(callbackQuery.id, 'Unfollowed!');
        } else {
          // Follow
          await supabase
            .from('follows')
            .insert({
              follower_id: tgUser.user_id,
              following_id: targetUserId
            });
          
          await answerCallbackQuery(callbackQuery.id, 'Followed!');
        }
        
        // Refresh suggested users
        const { data: suggestedUsers } = await supabase
          .from('profiles')
          .select('id, display_name, handle, bio, avatar_url, is_verified, is_business_mode')
          .neq('id', tgUser.user_id)
          .order('xp', { ascending: false })
          .limit(5);
        
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', tgUser.user_id);
        
        const followingIds = (following || []).map((f: any) => f.following_id);
        
        const menu = buildSuggestedUsersMenu(suggestedUsers || [], followingIds);
        await editMessage(chatId, messageId, menu.text, menu.reply_markup);
        return;
      }
      
      // Handle unfollow from following list
      if (data.startsWith('unfollow_')) {
        if (!isLinked || !tgUser.user_id) return;
        
        const targetUserId = data.replace('unfollow_', '');
        
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', tgUser.user_id)
          .eq('following_id', targetUserId);
        
        await answerCallbackQuery(callbackQuery.id, 'Unfollowed!');
        
        // Refresh following list
        const { data: following, count } = await supabase
          .from('follows')
          .select('following_id, profiles!follows_following_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
          .eq('follower_id', tgUser.user_id)
          .order('created_at', { ascending: false })
          .range(0, 4);
        
        const followingProfiles = (following || []).map((f: any) => f.profiles).filter(Boolean);
        const menu = buildFollowingMenu(followingProfiles, 0, count || 0);
        await editMessage(chatId, messageId, menu.text, menu.reply_markup);
        return;
      }
      
      // Handle followers/following pagination
      if (data.startsWith('followers_page_')) {
        if (!isLinked) return;
        const page = parseInt(data.replace('followers_page_', ''));
        
        const { data: followers, count } = await supabase
          .from('follows')
          .select('follower_id, profiles!follows_follower_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
          .eq('following_id', tgUser.user_id)
          .order('created_at', { ascending: false })
          .range(page * 5, (page + 1) * 5 - 1);
        
        const followerProfiles = (followers || []).map((f: any) => f.profiles).filter(Boolean);
        const menu = buildFollowersMenu(followerProfiles, page, count || 0);
        await editMessage(chatId, messageId, menu.text, menu.reply_markup);
        return;
      }
      
      if (data.startsWith('following_page_')) {
        if (!isLinked) return;
        const page = parseInt(data.replace('following_page_', ''));
        
        const { data: following, count } = await supabase
          .from('follows')
          .select('following_id, profiles!follows_following_id_fkey(id, display_name, handle, is_verified)', { count: 'exact' })
          .eq('follower_id', tgUser.user_id)
          .order('created_at', { ascending: false })
          .range(page * 5, (page + 1) * 5 - 1);
        
        const followingProfiles = (following || []).map((f: any) => f.profiles).filter(Boolean);
        const menu = buildFollowingMenu(followingProfiles, page, count || 0);
        await editMessage(chatId, messageId, menu.text, menu.reply_markup);
        return;
      }
    }
  }
}

// Handle text messages
async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text;
  const telegramUser = message.from;
  
  // Handle /start command
  if (text === '/start') {
    const tgUser = await getOrCreateTelegramUser(telegramUser);
    const isLinked = tgUser?.is_linked && tgUser?.user_id;
    
    // Get profile if linked
    let profile = null;
    let isAdminUser = false;
    if (isLinked && tgUser.user_id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tgUser.user_id)
        .single();
      profile = data;
      isAdminUser = await isAdmin(tgUser.user_id);
    }
    
    const menu = buildMainMenu(isLinked, profile, isAdminUser);
    await sendTelegramMessage(chatId, menu.text, menu.reply_markup);
    return;
  }
  
  // Handle /menu command
  if (text === '/menu') {
    const tgUser = await getOrCreateTelegramUser(telegramUser);
    const isLinked = tgUser?.is_linked && tgUser?.user_id;
    let profile = null;
    let isAdminUser = false;
    if (isLinked && tgUser.user_id) {
      const { data } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      profile = data;
      isAdminUser = await isAdmin(tgUser.user_id);
    }
    const menu = buildMainMenu(isLinked, profile, isAdminUser);
    await sendTelegramMessage(chatId, menu.text, menu.reply_markup);
    return;
  }
  
  // Get user state
  const { data: tgUser } = await supabase
    .from('telegram_users')
    .select('*, profiles(*)')
    .eq('telegram_id', telegramUser.id)
    .single();
  
  if (!tgUser) return;
  
  const currentMenu = tgUser.current_menu;
  
  // Handle different input states
  switch (currentMenu) {
    case 'awaiting_link_code': {
      // Verify link code
      const { data: linkUser } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('link_token', text.trim().toUpperCase())
        .gt('link_token_expires_at', new Date().toISOString())
        .single();
      
      if (linkUser && linkUser.user_id) {
        // Delete the current telegram user's entry (if exists and different from link entry)
        if (linkUser.telegram_id !== telegramUser.id) {
          await supabase
            .from('telegram_users')
            .delete()
            .eq('telegram_id', telegramUser.id);
        }
        
        // Update the link entry with real telegram info
        await supabase
          .from('telegram_users')
          .update({
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username,
            telegram_first_name: telegramUser.first_name,
            telegram_last_name: telegramUser.last_name,
            is_linked: true,
            link_token: null,
            link_token_expires_at: null,
            current_menu: 'main'
          })
          .eq('id', linkUser.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', linkUser.user_id)
          .single();
        
        // Check admin status
        const isAdminUser = await isAdmin(linkUser.user_id);
        const menu = buildMainMenu(true, profile, isAdminUser);
        await sendTelegramMessage(chatId, `✅ Account linked successfully!\n\nWelcome, ${profile?.display_name}!\n\n` + menu.text, menu.reply_markup);
      } else {
        await sendTelegramMessage(chatId, '❌ Invalid or expired link code. Please try again or get a new code.', {
          inline_keyboard: [[{ text: '🔗 Try Again', callback_data: 'link_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      }
      break;
    }
    
    case 'awaiting_email': {
      const email = text.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        await sendTelegramMessage(chatId, '❌ Invalid email format. Please enter a valid email:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      // Store email and ask for password
      await supabase
        .from('telegram_users')
        .update({ 
          current_menu: 'awaiting_password',
          menu_data: { email }
        })
        .eq('telegram_id', telegramUser.id);
      
      await sendTelegramMessage(chatId, '🔐 Great! Now enter a password (min 6 characters):', {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'main_menu' }]]
      });
      break;
    }
    
    case 'awaiting_password': {
      const password = text.trim();
      
      if (password.length < 6) {
        await sendTelegramMessage(chatId, '❌ Password must be at least 6 characters. Try again:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const email = tgUser.menu_data?.email;
      const displayName = telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '');
      const handle = telegramUser.username || `user_${telegramUser.id}`;
      
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          handle
        }
      });
      
      if (authError || !authData.user) {
        await sendTelegramMessage(chatId, `❌ Registration failed: ${authError?.message || 'Unknown error'}\n\nPlease try again or use a different email.`, {
          inline_keyboard: [[{ text: '📝 Try Again', callback_data: 'create_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        
        await supabase
          .from('telegram_users')
          .update({ current_menu: 'main', menu_data: {} })
          .eq('telegram_id', telegramUser.id);
        return;
      }
      
      // Link telegram user to new account
      await supabase
        .from('telegram_users')
        .update({
          user_id: authData.user.id,
          is_linked: true,
          current_menu: 'main',
          menu_data: {}
        })
        .eq('telegram_id', telegramUser.id);
      
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      // Get suggested users for new user
      const { data: suggestedUsers } = await supabase
        .from('profiles')
        .select('id, display_name, handle, bio, avatar_url, is_verified, is_business_mode')
        .neq('id', authData.user.id)
        .order('xp', { ascending: false })
        .limit(5);
      
      const suggestedMenu = buildSuggestedUsersMenu(suggestedUsers || [], []);
      
      await sendTelegramMessage(chatId, `🎉 <b>Account Created Successfully!</b>

Welcome to AfuChat, ${displayName}!

You can now log in at afuchat.com with:
📧 ${email}

━━━━━━━━━━━━━━━━━━━━

${suggestedMenu.text}`, suggestedMenu.reply_markup);
      break;
    }
    
    case 'awaiting_post_content': {
      if (!tgUser.is_linked || !tgUser.user_id) return;
      
      // Create post
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          author_id: tgUser.user_id,
          content: text.trim()
        })
        .select()
        .single();
      
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'main' })
        .eq('telegram_id', telegramUser.id);
      
      if (error || !newPost) {
        await sendTelegramMessage(chatId, '❌ Failed to create post. Please try again.', {
          inline_keyboard: [[{ text: '✍️ Try Again', callback_data: 'new_post' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      } else {
        await sendTelegramMessage(chatId, '✅ <b>Post created successfully!</b>\n\nYour post is now live on AfuChat.', {
          inline_keyboard: [[{ text: '📰 View Feed', callback_data: 'menu_feed' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      }
      break;
    }
    
    case 'awaiting_convert_amount': {
      if (!tgUser.is_linked || !tgUser.user_id) return;
      
      const amount = parseInt(text.trim());
      
      if (isNaN(amount) || amount <= 0) {
        await sendTelegramMessage(chatId, '❌ Please enter a valid number:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
        });
        return;
      }
      
      // Call conversion function
      const { data: result, error } = await supabase.rpc('convert_nexa_to_acoin', {
        p_nexa_amount: amount
      });
      
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'main' })
        .eq('telegram_id', telegramUser.id);
      
      if (error || !result?.success) {
        await sendTelegramMessage(chatId, `❌ Conversion failed: ${result?.message || error?.message || 'Unknown error'}`, {
          inline_keyboard: [[{ text: '💱 Try Again', callback_data: 'convert_nexa' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      } else {
        await sendTelegramMessage(chatId, `✅ <b>Conversion Successful!</b>\n\n${result.message}\n\n<b>New Balances:</b>\n⚡ Nexa: ${result.new_nexa_balance?.toLocaleString()}\n🪙 ACoin: ${result.new_acoin_balance?.toLocaleString()}`, {
          inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      }
      break;
    }
    
    case 'awaiting_send_recipient': {
      if (!tgUser.is_linked || !tgUser.user_id) return;
      
      const recipientHandle = text.trim().replace('@', '').toLowerCase();
      
      // Find recipient
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id, display_name, handle')
        .ilike('handle', recipientHandle)
        .single();
      
      if (!recipient) {
        await sendTelegramMessage(chatId, '❌ User not found. Please check the username and try again:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
        });
        return;
      }
      
      if (recipient.id === tgUser.user_id) {
        await sendTelegramMessage(chatId, '❌ You cannot send Nexa to yourself!', {
          inline_keyboard: [[{ text: '⬅️ Back', callback_data: 'menu_wallet' }]]
        });
        return;
      }
      
      await supabase
        .from('telegram_users')
        .update({ 
          current_menu: 'awaiting_send_amount',
          menu_data: { recipient_id: recipient.id, recipient_name: recipient.display_name }
        })
        .eq('telegram_id', telegramUser.id);
      
      await sendTelegramMessage(chatId, `📤 Sending to: <b>${recipient.display_name}</b> (@${recipient.handle})\n\nEnter the amount of Nexa to send:`, {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
      });
      break;
    }
    
    case 'awaiting_send_amount': {
      if (!tgUser.is_linked || !tgUser.user_id) return;
      
      const amount = parseInt(text.trim());
      const recipientId = tgUser.menu_data?.recipient_id;
      const recipientName = tgUser.menu_data?.recipient_name;
      
      if (isNaN(amount) || amount <= 0) {
        await sendTelegramMessage(chatId, '❌ Please enter a valid amount:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'menu_wallet' }]]
        });
        return;
      }
      
      // Send tip
      const { data: result, error } = await supabase.rpc('send_tip', {
        p_receiver_id: recipientId,
        p_xp_amount: amount
      });
      
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'main', menu_data: {} })
        .eq('telegram_id', telegramUser.id);
      
      if (error || !result?.success) {
        await sendTelegramMessage(chatId, `❌ Transfer failed: ${result?.message || error?.message || 'Unknown error'}`, {
          inline_keyboard: [[{ text: '📤 Try Again', callback_data: 'send_nexa' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      } else {
        await sendTelegramMessage(chatId, `✅ <b>Transfer Successful!</b>\n\nYou sent ${amount} Nexa to ${recipientName}!\n\n<b>New Balance:</b> ${result.new_sender_xp?.toLocaleString()} Nexa`, {
          inline_keyboard: [[{ text: '💰 Wallet', callback_data: 'menu_wallet' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      }
      break;
    }
    
    case 'awaiting_gift_recipient': {
      if (!tgUser.is_linked || !tgUser.user_id) return;
      
      const recipientHandle = text.trim().replace('@', '').toLowerCase();
      const giftId = tgUser.menu_data?.gift_id;
      
      // Find recipient
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('handle', recipientHandle)
        .single();
      
      if (!recipient) {
        await sendTelegramMessage(chatId, '❌ User not found. Please check the username:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'browse_gifts' }]]
        });
        return;
      }
      
      // Send gift
      const { data: result, error } = await supabase.rpc('send_gift', {
        p_gift_id: giftId,
        p_receiver_id: recipient.id
      });
      
      await supabase
        .from('telegram_users')
        .update({ current_menu: 'main', menu_data: {} })
        .eq('telegram_id', telegramUser.id);
      
      if (error || !result?.success) {
        await sendTelegramMessage(chatId, `❌ Failed to send gift: ${result?.message || error?.message || 'Unknown error'}`, {
          inline_keyboard: [[{ text: '🎁 Try Again', callback_data: 'browse_gifts' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      } else {
        await sendTelegramMessage(chatId, `🎉 <b>Gift Sent!</b>\n\nYou sent a gift to ${recipient.display_name}!\n\n<b>Nexa spent:</b> ${result.xp_cost}\n<b>New balance:</b> ${result.new_xp?.toLocaleString()}`, {
          inline_keyboard: [[{ text: '🎁 Send More', callback_data: 'browse_gifts' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
      }
      break;
    }
    
    case 'admin_awaiting_user_search': {
      const searchTerm = text.trim().toLowerCase();
      const { data: users } = await supabase
        .from('profiles')
        .select('id, display_name, handle, xp, is_verified')
        .or(`handle.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (!users || users.length === 0) {
        await sendTelegramMessage(chatId, '❌ No users found matching that search.', {
          inline_keyboard: [[{ text: '🔍 Search Again', callback_data: 'admin_search_user' }], [{ text: '⬅️ Back', callback_data: 'admin_users' }]]
        });
      } else {
        let text = `🔍 <b>Search Results</b>\n\nFound ${users.length} user(s):\n\n`;
        users.forEach((u: any, i: number) => {
          const verified = u.is_verified ? '✅' : '';
          text += `${i + 1}. <b>${u.display_name}</b> ${verified}\n   @${u.handle} | ${u.xp} Nexa\n\n`;
        });
        
        const buttons = users.map((u: any) => ([{ text: `👤 ${u.display_name}`, callback_data: `admin_user_${u.id}` }]));
        buttons.push([{ text: '🔍 Search Again', callback_data: 'admin_search_user' }]);
        buttons.push([{ text: '⬅️ Back', callback_data: 'admin_users' }]);
        
        await sendTelegramMessage(chatId, text, { inline_keyboard: buttons });
      }
      
      await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
      break;
    }
    
    case 'admin_awaiting_nexa_amount': {
      const amount = parseInt(text.trim());
      const targetUserId = tgUser.menu_data?.target_user_id;
      
      if (isNaN(amount) || amount <= 0) {
        await sendTelegramMessage(chatId, '❌ Please enter a valid positive number:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: `admin_user_${targetUserId}` }]]
        });
        return;
      }
      
      await supabase.from('profiles').update({ xp: supabase.rpc('', {}) }).eq('id', targetUserId);
      // Direct update
      const { data: currentProfile } = await supabase.from('profiles').select('xp').eq('id', targetUserId).single();
      await supabase.from('profiles').update({ xp: (currentProfile?.xp || 0) + amount }).eq('id', targetUserId);
      
      await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
      
      const menu = await buildAdminUserDetailMenu(targetUserId);
      await sendTelegramMessage(chatId, `✅ Added ${amount} Nexa to user!\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    case 'admin_awaiting_acoin_amount': {
      const amount = parseInt(text.trim());
      const targetUserId = tgUser.menu_data?.target_user_id;
      
      if (isNaN(amount) || amount <= 0) {
        await sendTelegramMessage(chatId, '❌ Please enter a valid positive number:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: `admin_user_${targetUserId}` }]]
        });
        return;
      }
      
      const { data: currentProfile } = await supabase.from('profiles').select('acoin').eq('id', targetUserId).single();
      await supabase.from('profiles').update({ acoin: (currentProfile?.acoin || 0) + amount }).eq('id', targetUserId);
      
      await supabase.from('telegram_users').update({ current_menu: 'main', menu_data: {} }).eq('telegram_id', telegramUser.id);
      
      const menu = await buildAdminUserDetailMenu(targetUserId);
      await sendTelegramMessage(chatId, `✅ Added ${amount} ACoin to user!\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    case 'awaiting_email_link': {
      const email = text.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        await sendTelegramMessage(chatId, '❌ Invalid email format. Please enter a valid email:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'link_account' }]]
        });
        return;
      }
      
      // Find user by email via auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        await sendTelegramMessage(chatId, '❌ Error searching for account. Please try again.', {
          inline_keyboard: [[{ text: '🔗 Try Again', callback_data: 'link_via_email' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        return;
      }
      
      const foundUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email);
      
      if (!foundUser) {
        await sendTelegramMessage(chatId, '❌ No AfuChat account found with this email.\n\nMake sure you\'re using the same email you registered with, or create a new account.', {
          inline_keyboard: [[{ text: '🔑 Try Link Code', callback_data: 'enter_link_code' }], [{ text: '📝 Create Account', callback_data: 'create_account' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
        return;
      }
      
      // Check if this AfuChat account is already linked to another Telegram
      const { data: existingLink } = await supabase
        .from('telegram_users')
        .select('id, telegram_id')
        .eq('user_id', foundUser.id)
        .eq('is_linked', true)
        .single();
      
      if (existingLink && existingLink.telegram_id !== telegramUser.id) {
        await sendTelegramMessage(chatId, '⚠️ This AfuChat account is already linked to another Telegram account.\n\nPlease unlink it from the other Telegram first, or use a different account.', {
          inline_keyboard: [[{ text: '🔑 Use Link Code', callback_data: 'enter_link_code' }], [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
        });
        await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
        return;
      }
      
      // Delete any placeholder entries for this user_id (from web link code generation)
      await supabase
        .from('telegram_users')
        .delete()
        .eq('user_id', foundUser.id)
        .neq('telegram_id', telegramUser.id);
      
      // Update this telegram user's entry
      await supabase
        .from('telegram_users')
        .update({
          user_id: foundUser.id,
          is_linked: true,
          current_menu: 'main'
        })
        .eq('telegram_id', telegramUser.id);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', foundUser.id)
        .single();
      
      // Check admin status
      const isAdminUser = await isAdmin(foundUser.id);
      const menu = buildMainMenu(true, profile, isAdminUser);
      await sendTelegramMessage(chatId, `✅ <b>Account Linked Successfully!</b>\n\nWelcome back, ${profile?.display_name}!\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    case 'awaiting_display_name': {
      const newName = text.trim();
      
      if (newName.length < 1 || newName.length > 50) {
        await sendTelegramMessage(chatId, '❌ Name must be between 1 and 50 characters. Try again:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
        });
        return;
      }
      
      await supabase
        .from('profiles')
        .update({ display_name: newName })
        .eq('id', tgUser.user_id);
      
      await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildEditProfileMenu(freshProfile);
      await sendTelegramMessage(chatId, `✅ Name updated to: <b>${newName}</b>\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    case 'awaiting_bio': {
      const newBio = text.trim();
      
      if (newBio.length > 160) {
        await sendTelegramMessage(chatId, '❌ Bio must be 160 characters or less. Try again:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
        });
        return;
      }
      
      await supabase
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', tgUser.user_id);
      
      await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildEditProfileMenu(freshProfile);
      await sendTelegramMessage(chatId, `✅ Bio updated!\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    case 'awaiting_country': {
      const newCountry = text.trim();
      
      if (newCountry.length < 2 || newCountry.length > 100) {
        await sendTelegramMessage(chatId, '❌ Please enter a valid country name:', {
          inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: 'edit_profile' }]]
        });
        return;
      }
      
      await supabase
        .from('profiles')
        .update({ country: newCountry })
        .eq('id', tgUser.user_id);
      
      await supabase.from('telegram_users').update({ current_menu: 'main' }).eq('telegram_id', telegramUser.id);
      
      const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      const menu = buildEditProfileMenu(freshProfile);
      await sendTelegramMessage(chatId, `✅ Country updated to: <b>${newCountry}</b>\n\n` + menu.text, menu.reply_markup);
      break;
    }
    
    default: {
      // Unknown command
      await sendTelegramMessage(chatId, '🤖 Use /start or /menu to open the main menu!', {
        inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
      });
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Telegram update:', JSON.stringify(update));
    
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message?.text) {
      await handleMessage(update.message);
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing Telegram update:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
