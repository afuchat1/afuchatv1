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
function buildMainMenu(isLinked: boolean, profile?: any) {
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

function buildProfileMenu(profile: any) {
  const verified = profile?.is_verified ? '✅' : '';
  const premium = profile?.is_verified ? '⭐ Premium' : '';
  
  const text = `👤 <b>Your Profile</b>

<b>Name:</b> ${profile?.display_name || 'Not set'} ${verified}
<b>Handle:</b> @${profile?.handle || 'not_set'}
<b>Bio:</b> ${profile?.bio || 'No bio yet'}

<b>Stats:</b>
• Grade: ${profile?.current_grade || 'Newcomer'}
• Nexa: ${profile?.xp?.toLocaleString() || 0}
• Login Streak: ${profile?.login_streak || 0} days 🔥

${premium}`;

  const buttons = [
    [{ text: '✏️ Edit Profile', callback_data: 'edit_profile' }],
    [{ text: '📊 View Stats', callback_data: 'view_stats' }],
    [{ text: '👥 Followers', callback_data: 'my_followers' }, { text: '👥 Following', callback_data: 'my_following' }],
    [{ text: '🏠 Main Menu', callback_data: 'main_menu' }],
  ];

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

function buildLinkAccountMenu() {
  const text = `🔗 <b>Link Your AfuChat Account</b>

To link your existing AfuChat account:

1. Go to AfuChat web/app
2. Navigate to Settings → Security
3. Click "Link Telegram"
4. Enter the code shown there

Or enter your email to receive a link code:`;

  const buttons = [
    [{ text: '📧 Send Link Code to Email', callback_data: 'link_via_email' }],
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

  switch (data) {
    case 'main_menu': {
      const menu = buildMainMenu(isLinked, profile);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
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
      
      const menu = buildProfileMenu(freshProfile);
      await editMessage(chatId, messageId, menu.text, menu.reply_markup);
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
    if (isLinked) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tgUser.user_id)
        .single();
      profile = data;
    }
    
    const menu = buildMainMenu(isLinked, profile);
    await sendTelegramMessage(chatId, menu.text, menu.reply_markup);
    return;
  }
  
  // Handle /menu command
  if (text === '/menu') {
    const tgUser = await getOrCreateTelegramUser(telegramUser);
    const isLinked = tgUser?.is_linked && tgUser?.user_id;
    let profile = null;
    if (isLinked) {
      const { data } = await supabase.from('profiles').select('*').eq('id', tgUser.user_id).single();
      profile = data;
    }
    const menu = buildMainMenu(isLinked, profile);
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
        .eq('link_token', text.trim())
        .gt('link_token_expires_at', new Date().toISOString())
        .single();
      
      if (linkUser && linkUser.user_id) {
        // Link the accounts
        await supabase
          .from('telegram_users')
          .update({
            user_id: linkUser.user_id,
            is_linked: true,
            link_token: null,
            link_token_expires_at: null,
            current_menu: 'main'
          })
          .eq('telegram_id', telegramUser.id);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', linkUser.user_id)
          .single();
        
        const menu = buildMainMenu(true, profile);
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
