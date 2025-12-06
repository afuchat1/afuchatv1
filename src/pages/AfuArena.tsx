import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Trophy, 
  Users, 
  Copy, 
  Check, 
  Zap,
  Target,
  Crown,
  Timer,
  Loader2,
  Heart,
  Shield,
  Crosshair,
  Flame,
  Snowflake,
  Star,
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw
} from 'lucide-react';

type GameStatus = 'waiting' | 'playing' | 'finished';

interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  score: number;
  weapon: 'pistol' | 'rifle' | 'shotgun' | 'sniper';
  ammo: number;
  shield: number;
  speed: number;
  lastShot: number;
  direction: number;
  isMoving: boolean;
  ability: 'dash' | 'heal' | 'freeze' | 'rage';
  abilityCooldown: number;
  respawnTimer: number;
  kills: number;
  deaths: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  ownerId: string;
  damage: number;
  speed: number;
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: 'health' | 'shield' | 'ammo' | 'speed' | 'weapon';
  value: number | string;
}

interface GameState {
  players: Record<string, Player>;
  projectiles: Projectile[];
  powerUps: PowerUp[];
  gameTime: number;
  maxTime: number;
  killFeed: { killer: string; victim: string; weapon: string; timestamp: number }[];
}

interface GameRoom {
  id: string;
  room_code: string;
  host_id: string;
  guest_id: string | null;
  host_score: number;
  guest_score: number;
  status: GameStatus;
  round: number;
  max_rounds: number;
  current_target_x: number | null;
  current_target_y: number | null;
  target_spawned_at: string | null;
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  player_data: Record<string, Player>;
  game_state: GameState;
}

interface PlayerInfo {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

const WEAPON_STATS: Record<string, { damage: number; fireRate: number; ammo: number; speed: number; spread: number; pellets?: number }> = {
  pistol: { damage: 15, fireRate: 400, ammo: 30, speed: 12, spread: 0.05 },
  rifle: { damage: 12, fireRate: 150, ammo: 60, speed: 15, spread: 0.1 },
  shotgun: { damage: 8, fireRate: 800, ammo: 16, speed: 10, spread: 0.4, pellets: 5 },
  sniper: { damage: 75, fireRate: 1200, ammo: 10, speed: 20, spread: 0 }
};

const ABILITY_COOLDOWNS: Record<string, number> = {
  dash: 5000,
  heal: 10000,
  freeze: 15000,
  rage: 20000
};

const AfuArena = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myProfile, setMyProfile] = useState<PlayerInfo | null>(null);
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [hostInfo, setHostInfo] = useState<PlayerInfo | null>(null);
  const [guestInfo, setGuestInfo] = useState<PlayerInfo | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [singlePlayerState, setSinglePlayerState] = useState<GameState | null>(null);
  const [singlePlayerStatus, setSinglePlayerStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [singlePlayerWon, setSinglePlayerWon] = useState(false);
  
  // Mobile touch controls state
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [aimDirection, setAimDirection] = useState(0);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const localGameStateRef = useRef<GameState | null>(null);
  const joystickOriginRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContextRef.current) return;
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (e) {}
  }, [soundEnabled]);

  const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const fetchPlayerInfo = async (playerId: string): Promise<PlayerInfo | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', playerId)
      .single();
    return data;
  };

  const createInitialPlayer = (id: string, isHost: boolean): Player => ({
    id,
    x: isHost ? 20 : 80,
    y: 50,
    health: 100,
    maxHealth: 100,
    score: 0,
    weapon: 'pistol',
    ammo: 30,
    shield: 0,
    speed: 5,
    lastShot: 0,
    direction: isHost ? 0 : 180,
    isMoving: false,
    ability: isHost ? 'dash' : 'heal',
    abilityCooldown: 0,
    respawnTimer: 0,
    kills: 0,
    deaths: 0
  });

  const createInitialGameState = (hostId: string, guestId: string): GameState => ({
    players: {
      [hostId]: createInitialPlayer(hostId, true),
      [guestId]: createInitialPlayer(guestId, false)
    },
    projectiles: [],
    powerUps: [],
    gameTime: 0,
    maxTime: 180,
    killFeed: []
  });

  const BOT_ID = 'bot-player-1';
  const BOT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=afu-bot';

  const createSinglePlayerGameState = (playerId: string): GameState => ({
    players: {
      [playerId]: createInitialPlayer(playerId, true),
      [BOT_ID]: { ...createInitialPlayer(BOT_ID, false), ability: 'rage' }
    },
    projectiles: [],
    powerUps: [],
    gameTime: 0,
    maxTime: 180,
    killFeed: []
  });

  const startSinglePlayer = async () => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }

    setIsSinglePlayer(true);
    
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      playSound(440, 0.2);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(null);
    playSound(880, 0.3);

    const initialState = createSinglePlayerGameState(user.id);
    localGameStateRef.current = initialState;
    setSinglePlayerState(initialState);
    setSinglePlayerStatus('playing');
  };

  // Touch handlers for joystick
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickRef.current?.getBoundingClientRect();
    if (rect) {
      joystickOriginRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setIsJoystickActive(true);
    }
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!isJoystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - joystickOriginRef.current.x;
    const dy = touch.clientY - joystickOriginRef.current.y;
    const maxDist = 40;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    setJoystickPos({
      x: (Math.cos(angle) * clampedDist) / maxDist,
      y: (Math.sin(angle) * clampedDist) / maxDist
    });
  };

  const handleJoystickEnd = () => {
    setIsJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
  };

  // Touch handler for shooting
  const handleShootAreaTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = gameAreaRef.current?.getBoundingClientRect();
    if (rect && localGameStateRef.current && user) {
      const player = localGameStateRef.current.players[user.id];
      if (player) {
        const touchX = ((touch.clientX - rect.left) / rect.width) * 100;
        const touchY = ((touch.clientY - rect.top) / rect.height) * 100;
        const angle = Math.atan2(touchY - player.y, touchX - player.x) * 180 / Math.PI;
        setAimDirection(angle);
      }
    }
    setIsShooting(true);
  };

  const handleShootAreaEnd = () => {
    setIsShooting(false);
  };

  const updateBot = (state: GameState, dt: number) => {
    const bot = state.players[BOT_ID];
    const player = Object.values(state.players).find(p => p.id !== BOT_ID);
    if (!bot || !player || bot.respawnTimer > 0) return;

    const dx = player.x - bot.x;
    const dy = player.y - bot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const idealDist = 25;
    let moveX = 0, moveY = 0;
    
    if (dist > idealDist + 5) {
      moveX = dx / dist;
      moveY = dy / dist;
    } else if (dist < idealDist - 5) {
      moveX = -dx / dist;
      moveY = -dy / dist;
    } else {
      const strafeAngle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
      moveX = Math.cos(strafeAngle) * 0.5;
      moveY = Math.sin(strafeAngle) * 0.5;
    }

    moveX += (Math.random() - 0.5) * 0.3;
    moveY += (Math.random() - 0.5) * 0.3;

    bot.x = Math.max(8, Math.min(92, bot.x + moveX * bot.speed * dt * 15));
    bot.y = Math.max(8, Math.min(92, bot.y + moveY * bot.speed * dt * 15));
    bot.isMoving = true;

    const aimError = (Math.random() - 0.5) * 15;
    bot.direction = Math.atan2(player.y - bot.y, player.x - bot.x) * 180 / Math.PI + aimError;

    const now = Date.now();
    if (dist < 50 && player.respawnTimer <= 0) {
      const weapon = WEAPON_STATS[bot.weapon];
      if (now - bot.lastShot >= weapon.fireRate + Math.random() * 200) {
        if (bot.ammo > 0) {
          bot.lastShot = now;
          bot.ammo -= 1;
          
          const pelletCount = weapon.pellets || 1;
          for (let i = 0; i < pelletCount; i++) {
            const spreadAngle = (Math.random() - 0.5) * weapon.spread;
            const angle = (bot.direction * Math.PI / 180) + spreadAngle;
            state.projectiles.push({
              id: `${BOT_ID}-${now}-${i}`,
              x: bot.x,
              y: bot.y,
              dx: Math.cos(angle) * weapon.speed,
              dy: Math.sin(angle) * weapon.speed,
              ownerId: BOT_ID,
              damage: weapon.damage,
              speed: weapon.speed
            });
          }
        } else {
          bot.ammo = WEAPON_STATS[bot.weapon].ammo;
        }
      }
    }

    if (bot.abilityCooldown <= 0 && Math.random() < 0.01) {
      useAbility(bot, state);
      bot.abilityCooldown = ABILITY_COOLDOWNS[bot.ability];
    }

    state.powerUps.forEach((pu, idx) => {
      const puDist = Math.sqrt((pu.x - bot.x) ** 2 + (pu.y - bot.y) ** 2);
      if (puDist < 5) {
        applyPowerUp(bot, pu);
        state.powerUps.splice(idx, 1);
      }
    });
  };

  const createRoom = async () => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }
    setLoading(true);
    try {
      const roomCode = generateRoomCode();
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          host_id: user.id,
          status: 'waiting',
          max_rounds: 10,
          player_data: {},
          game_state: {}
        })
        .select()
        .single();

      if (error) throw error;
      const typedData: GameRoom = { 
        ...data, 
        status: data.status as GameStatus,
        player_data: (data.player_data as unknown as Record<string, Player>) || {},
        game_state: (data.game_state as unknown as GameState) || {} as GameState
      };
      setGameRoom(typedData);
      const hostData = await fetchPlayerInfo(user.id);
      setHostInfo(hostData);
      toast.success('Room created!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }
    if (!joinCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    setLoading(true);
    try {
      const { data: room, error: findError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', joinCode.toUpperCase())
        .eq('status', 'waiting')
        .single();

      if (findError || !room) {
        toast.error('Room not found');
        return;
      }

      if (room.host_id === user.id) {
        toast.error('Cannot join your own room');
        return;
      }

      const { data, error } = await supabase
        .from('game_rooms')
        .update({ guest_id: user.id })
        .eq('id', room.id)
        .select()
        .single();

      if (error) throw error;
      const typedData: GameRoom = { 
        ...data, 
        status: data.status as GameStatus,
        player_data: (data.player_data as unknown as Record<string, Player>) || {},
        game_state: (data.game_state as unknown as GameState) || {} as GameState
      };
      setGameRoom(typedData);
      
      const [hostData, guestData] = await Promise.all([
        fetchPlayerInfo(data.host_id),
        fetchPlayerInfo(user.id)
      ]);
      setHostInfo(hostData);
      setGuestInfo(guestData);
      toast.success('Joined room!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!gameRoom?.id) return;

    const channel = supabase
      .channel(`game-room-${gameRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${gameRoom.id}`
        },
        async (payload) => {
          const newRoom = payload.new as any;
          const typedRoom: GameRoom = {
            ...newRoom,
            status: newRoom.status as GameStatus,
            player_data: newRoom.player_data || {},
            game_state: newRoom.game_state || {}
          };
          setGameRoom(typedRoom);

          if (newRoom.guest_id && !guestInfo) {
            const guestData = await fetchPlayerInfo(newRoom.guest_id);
            setGuestInfo(guestData);
          }

          if (typedRoom.game_state && Object.keys(typedRoom.game_state).length > 0) {
            localGameStateRef.current = typedRoom.game_state as GameState;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameRoom?.id, guestInfo]);

  const startGame = async () => {
    if (!gameRoom || !user || gameRoom.host_id !== user.id) return;
    if (!gameRoom.guest_id) {
      toast.error('Waiting for opponent');
      return;
    }

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      playSound(440, 0.2);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(null);
    playSound(880, 0.3);

    const initialState = createInitialGameState(gameRoom.host_id, gameRoom.guest_id);
    localGameStateRef.current = initialState;

    await supabase
      .from('game_rooms')
      .update({ 
        status: 'playing',
        started_at: new Date().toISOString(),
        game_state: JSON.parse(JSON.stringify(initialState))
      })
      .eq('id', gameRoom.id);
  };

  useEffect(() => {
    if ((gameRoom?.status !== 'playing' && singlePlayerStatus !== 'playing') || !user) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastUpdateRef.current;
      
      if (deltaTime >= 16) {
        lastUpdateRef.current = timestamp;
        if (isSinglePlayer) {
          updateSinglePlayerGame(deltaTime / 1000);
        } else {
          updateGame(deltaTime / 1000);
        }
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameRoom?.status, singlePlayerStatus, user, joystickPos, isShooting, aimDirection, isSinglePlayer]);

  const updateSinglePlayerGame = async (dt: number) => {
    if (!localGameStateRef.current || !user) return;
    
    const state = { ...localGameStateRef.current };
    const player = state.players[user.id];
    const bot = state.players[BOT_ID];

    if (player && player.respawnTimer > 0) {
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) {
        player.health = player.maxHealth;
        player.x = 20;
        player.y = 50;
        player.respawnTimer = 0;
      }
    }

    if (bot && bot.respawnTimer > 0) {
      bot.respawnTimer -= dt;
      if (bot.respawnTimer <= 0) {
        bot.health = bot.maxHealth;
        bot.x = 80;
        bot.y = 50;
        bot.respawnTimer = 0;
      }
    }

    if (!player || player.respawnTimer > 0) {
      localGameStateRef.current = state;
      setSinglePlayerState({ ...state });
      return;
    }

    // Movement from joystick
    if (joystickPos.x !== 0 || joystickPos.y !== 0) {
      player.x = Math.max(8, Math.min(92, player.x + joystickPos.x * player.speed * dt * 25));
      player.y = Math.max(8, Math.min(92, player.y + joystickPos.y * player.speed * dt * 25));
      player.isMoving = true;
      player.direction = Math.atan2(joystickPos.y, joystickPos.x) * 180 / Math.PI;
    } else {
      player.isMoving = false;
    }

    // Shooting
    const now = Date.now();
    if (isShooting && player.ammo > 0) {
      player.direction = aimDirection;
      const weapon = WEAPON_STATS[player.weapon];
      if (now - player.lastShot >= weapon.fireRate) {
        player.lastShot = now;
        player.ammo -= 1;
        playSound(200 + Math.random() * 100, 0.1, 'square');

        const pelletCount = weapon.pellets || 1;
        for (let i = 0; i < pelletCount; i++) {
          const spreadAngle = (Math.random() - 0.5) * weapon.spread;
          const angle = (player.direction * Math.PI / 180) + spreadAngle;
          state.projectiles.push({
            id: `${user.id}-${now}-${i}`,
            x: player.x,
            y: player.y,
            dx: Math.cos(angle) * weapon.speed,
            dy: Math.sin(angle) * weapon.speed,
            ownerId: user.id,
            damage: weapon.damage,
            speed: weapon.speed
          });
        }
      }
    }

    if (player.abilityCooldown > 0) {
      player.abilityCooldown -= dt * 1000;
    }

    updateBot(state, dt);
    if (bot && bot.abilityCooldown > 0) {
      bot.abilityCooldown -= dt * 1000;
    }

    // Update projectiles
    state.projectiles = state.projectiles.filter(proj => {
      proj.x += proj.dx * dt * 10;
      proj.y += proj.dy * dt * 10;

      if (proj.x < 0 || proj.x > 100 || proj.y < 0 || proj.y > 100) {
        return false;
      }

      for (const playerId in state.players) {
        if (playerId === proj.ownerId) continue;
        const target = state.players[playerId];
        if (target.respawnTimer > 0) continue;

        const dist = Math.sqrt((proj.x - target.x) ** 2 + (proj.y - target.y) ** 2);
        if (dist < 6) {
          let damage = proj.damage;
          if (target.shield > 0) {
            const shieldAbsorb = Math.min(target.shield, damage * 0.5);
            target.shield -= shieldAbsorb;
            damage -= shieldAbsorb;
          }
          target.health -= damage;
          playSound(150, 0.1);

          if (target.health <= 0) {
            target.deaths += 1;
            target.respawnTimer = 3;
            const killer = state.players[proj.ownerId];
            if (killer) {
              killer.kills += 1;
              killer.score += 100;
            }
            state.killFeed.unshift({
              killer: proj.ownerId,
              victim: playerId,
              weapon: state.players[proj.ownerId]?.weapon || 'pistol',
              timestamp: now
            });
            playSound(800, 0.4, 'sawtooth');

            if (killer && killer.kills >= 10) {
              endSinglePlayerGame(proj.ownerId === user.id);
            }
          }
          return false;
        }
      }
      return true;
    });

    state.powerUps.forEach((powerUp, index) => {
      const dist = Math.sqrt((powerUp.x - player.x) ** 2 + (powerUp.y - player.y) ** 2);
      if (dist < 6) {
        applyPowerUp(player, powerUp);
        state.powerUps.splice(index, 1);
        playSound(500, 0.2);
      }
    });

    state.gameTime += dt;
    if (state.powerUps.length < 3 && Math.random() < 0.005) {
      spawnPowerUp(state);
    }

    if (state.gameTime >= state.maxTime) {
      const winner = Object.values(state.players).reduce((a, b) => a.kills > b.kills ? a : b);
      endSinglePlayerGame(winner.id === user.id);
    }

    state.players[user.id] = player;
    localGameStateRef.current = state;
    setSinglePlayerState({ ...state });
  };

  const endSinglePlayerGame = async (playerWon: boolean) => {
    setSinglePlayerStatus('finished');
    setSinglePlayerWon(playerWon);
    
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);

    if (playerWon && user) {
      try {
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_action_type: 'game_won',
          p_xp_amount: 100,
          p_metadata: { game: 'afu_arena', mode: 'single_player' }
        });
        toast.success('Victory! +100 Nexa');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const restartSinglePlayer = () => {
    setSinglePlayerStatus('idle');
    setSinglePlayerState(null);
    setIsSinglePlayer(false);
    localGameStateRef.current = null;
  };

  const updateGame = async (dt: number) => {
    if (!localGameStateRef.current || !user || !gameRoom) return;
    
    const state = { ...localGameStateRef.current };
    const player = state.players[user.id];
    if (!player || player.respawnTimer > 0) {
      if (player && player.respawnTimer > 0) {
        player.respawnTimer -= dt;
        if (player.respawnTimer <= 0) {
          player.health = player.maxHealth;
          player.x = player.id === gameRoom.host_id ? 20 : 80;
          player.y = 50;
          player.respawnTimer = 0;
        }
      }
      localGameStateRef.current = state;
      return;
    }

    // Movement from joystick
    if (joystickPos.x !== 0 || joystickPos.y !== 0) {
      player.x = Math.max(8, Math.min(92, player.x + joystickPos.x * player.speed * dt * 25));
      player.y = Math.max(8, Math.min(92, player.y + joystickPos.y * player.speed * dt * 25));
      player.isMoving = true;
      player.direction = Math.atan2(joystickPos.y, joystickPos.x) * 180 / Math.PI;
    } else {
      player.isMoving = false;
    }

    const now = Date.now();
    if (isShooting && player.ammo > 0) {
      player.direction = aimDirection;
      const weapon = WEAPON_STATS[player.weapon];
      if (now - player.lastShot >= weapon.fireRate) {
        player.lastShot = now;
        player.ammo -= 1;
        playSound(200 + Math.random() * 100, 0.1, 'square');

        const pelletCount = weapon.pellets || 1;
        for (let i = 0; i < pelletCount; i++) {
          const spreadAngle = (Math.random() - 0.5) * weapon.spread;
          const angle = (player.direction * Math.PI / 180) + spreadAngle;
          const projectile: Projectile = {
            id: `${user.id}-${now}-${i}`,
            x: player.x,
            y: player.y,
            dx: Math.cos(angle) * weapon.speed,
            dy: Math.sin(angle) * weapon.speed,
            ownerId: user.id,
            damage: weapon.damage,
            speed: weapon.speed
          };
          state.projectiles.push(projectile);
        }
      }
    }

    if (player.abilityCooldown > 0) {
      player.abilityCooldown -= dt * 1000;
    }

    state.projectiles = state.projectiles.filter(proj => {
      proj.x += proj.dx * dt * 10;
      proj.y += proj.dy * dt * 10;

      if (proj.x < 0 || proj.x > 100 || proj.y < 0 || proj.y > 100) {
        return false;
      }

      for (const playerId in state.players) {
        if (playerId === proj.ownerId) continue;
        const target = state.players[playerId];
        if (target.respawnTimer > 0) continue;

        const dist = Math.sqrt((proj.x - target.x) ** 2 + (proj.y - target.y) ** 2);
        if (dist < 6) {
          let damage = proj.damage;
          if (target.shield > 0) {
            const shieldAbsorb = Math.min(target.shield, damage * 0.5);
            target.shield -= shieldAbsorb;
            damage -= shieldAbsorb;
          }
          target.health -= damage;
          playSound(150, 0.1);

          if (target.health <= 0) {
            target.deaths += 1;
            target.respawnTimer = 3;
            player.kills += 1;
            player.score += 100;
            state.killFeed.unshift({
              killer: proj.ownerId,
              victim: playerId,
              weapon: player.weapon,
              timestamp: now
            });
            playSound(800, 0.4, 'sawtooth');

            if (player.kills >= 10) {
              endGame(proj.ownerId);
            }
          }
          return false;
        }
      }
      return true;
    });

    state.powerUps.forEach((powerUp, index) => {
      const dist = Math.sqrt((powerUp.x - player.x) ** 2 + (powerUp.y - player.y) ** 2);
      if (dist < 6) {
        applyPowerUp(player, powerUp);
        state.powerUps.splice(index, 1);
        playSound(500, 0.2);
      }
    });

    state.gameTime += dt;
    if (state.powerUps.length < 3 && Math.random() < 0.005) {
      spawnPowerUp(state);
    }

    if (state.gameTime >= state.maxTime) {
      const winner = Object.values(state.players).reduce((a, b) => a.kills > b.kills ? a : b);
      endGame(winner.id);
    }

    state.players[user.id] = player;
    localGameStateRef.current = state;

    if (Math.random() < 0.05) {
      await supabase
        .from('game_rooms')
        .update({ game_state: JSON.parse(JSON.stringify(state)) })
        .eq('id', gameRoom.id);
    }
  };

  const useAbility = (player: Player, state: GameState) => {
    switch (player.ability) {
      case 'dash':
        const dashDist = 15;
        const angle = player.direction * Math.PI / 180;
        player.x = Math.max(8, Math.min(92, player.x + Math.cos(angle) * dashDist));
        player.y = Math.max(8, Math.min(92, player.y + Math.sin(angle) * dashDist));
        break;
      case 'heal':
        player.health = Math.min(player.maxHealth, player.health + 50);
        break;
      case 'freeze':
        Object.values(state.players).forEach(p => {
          if (p.id !== player.id) p.speed = 2;
        });
        setTimeout(() => {
          if (localGameStateRef.current) {
            Object.values(localGameStateRef.current.players).forEach(p => p.speed = 5);
          }
        }, 3000);
        break;
      case 'rage':
        player.speed = 8;
        setTimeout(() => {
          if (localGameStateRef.current?.players[player.id]) {
            localGameStateRef.current.players[player.id].speed = 5;
          }
        }, 5000);
        break;
    }
  };

  const applyPowerUp = (player: Player, powerUp: PowerUp) => {
    switch (powerUp.type) {
      case 'health':
        player.health = Math.min(player.maxHealth, player.health + (powerUp.value as number));
        break;
      case 'shield':
        player.shield = Math.min(50, player.shield + (powerUp.value as number));
        break;
      case 'ammo':
        player.ammo += powerUp.value as number;
        break;
      case 'speed':
        player.speed += powerUp.value as number;
        break;
      case 'weapon':
        player.weapon = powerUp.value as Player['weapon'];
        player.ammo = WEAPON_STATS[player.weapon].ammo;
        break;
    }
  };

  const spawnPowerUp = (state: GameState) => {
    const types: PowerUp['type'][] = ['health', 'shield', 'ammo', 'speed', 'weapon'];
    const type = types[Math.floor(Math.random() * types.length)];
    const weapons: Player['weapon'][] = ['rifle', 'shotgun', 'sniper'];
    
    const powerUp: PowerUp = {
      id: `pu-${Date.now()}`,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      type,
      value: type === 'weapon' 
        ? weapons[Math.floor(Math.random() * weapons.length)]
        : type === 'health' ? 30 
        : type === 'shield' ? 25 
        : type === 'ammo' ? 20 
        : 1
    };
    state.powerUps.push(powerUp);
  };

  const endGame = async (winnerId: string) => {
    if (!gameRoom) return;
    
    await supabase
      .from('game_rooms')
      .update({
        status: 'finished',
        winner_id: winnerId,
        ended_at: new Date().toISOString()
      })
      .eq('id', gameRoom.id);

    if (winnerId === user?.id) {
      try {
        await supabase.rpc('award_xp', {
          p_user_id: user.id,
          p_action_type: 'game_won',
          p_xp_amount: 150,
          p_metadata: { game: 'afu_arena', mode: 'battle_royale' }
        });
        toast.success('Victory! +150 Nexa');
      } catch (e) {
        console.error(e);
      }
    }

    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  };

  const copyRoomCode = () => {
    if (gameRoom?.room_code) {
      navigator.clipboard.writeText(gameRoom.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Room code copied!');
    }
  };

  const leaveRoom = async () => {
    if (!gameRoom || !user) return;
    
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    
    if (gameRoom.host_id === user.id) {
      await supabase.from('game_rooms').delete().eq('id', gameRoom.id);
    } else {
      await supabase
        .from('game_rooms')
        .update({ guest_id: null })
        .eq('id', gameRoom.id);
    }
    
    setGameRoom(null);
    setHostInfo(null);
    setGuestInfo(null);
    localGameStateRef.current = null;
  };

  const playAgain = async () => {
    if (!gameRoom || !user || gameRoom.host_id !== user.id || !gameRoom.guest_id) return;

    const newState = createInitialGameState(gameRoom.host_id, gameRoom.guest_id);
    localGameStateRef.current = newState;

    await supabase
      .from('game_rooms')
      .update({
        status: 'waiting',
        host_score: 0,
        guest_score: 0,
        round: 1,
        current_target_x: null,
        current_target_y: null,
        winner_id: null as unknown as string,
        started_at: null as unknown as string,
        ended_at: null as unknown as string,
        game_state: JSON.parse(JSON.stringify(newState))
      })
      .eq('id', gameRoom.id);
  };

  const handleUseAbility = () => {
    if (!localGameStateRef.current || !user) return;
    const player = localGameStateRef.current.players[user.id];
    if (player && player.abilityCooldown <= 0) {
      useAbility(player, localGameStateRef.current);
      player.abilityCooldown = ABILITY_COOLDOWNS[player.ability];
      playSound(600, 0.3, 'triangle');
    }
  };

  const handleReload = () => {
    if (!localGameStateRef.current || !user) return;
    const player = localGameStateRef.current.players[user.id];
    if (player) {
      player.ammo = WEAPON_STATS[player.weapon].ammo;
      playSound(300, 0.2);
    }
  };

  const getPlayerAvatar = (playerId: string) => {
    if (playerId === BOT_ID) return BOT_AVATAR;
    if (playerId === user?.id) return myProfile?.avatar_url || null;
    if (playerId === hostInfo?.id) return hostInfo?.avatar_url;
    if (playerId === guestInfo?.id) return guestInfo?.avatar_url;
    return null;
  };

  const getPlayerName = (playerId: string) => {
    if (playerId === BOT_ID) return 'Bot';
    if (playerId === user?.id) return 'You';
    if (playerId === hostInfo?.id) return hostInfo?.display_name || 'Host';
    if (playerId === guestInfo?.id) return guestInfo?.display_name || 'Guest';
    return 'Player';
  };

  const isHost = user && gameRoom?.host_id === user.id;
  const gameState = localGameStateRef.current || (gameRoom?.game_state as GameState);
  const myPlayer = gameState?.players?.[user?.id || ''];
  const opponent = gameState?.players?.[Object.keys(gameState?.players || {}).find(k => k !== user?.id) || ''];

  // Render Player Component with Avatar
  const renderPlayer = (player: Player) => {
    const avatarUrl = getPlayerAvatar(player.id);
    const isMe = player.id === user?.id;
    
    return (
      <motion.div
        key={player.id}
        className={`absolute flex flex-col items-center ${player.respawnTimer > 0 ? 'opacity-30' : ''}`}
        style={{ 
          left: `${player.x}%`, 
          top: `${player.y}%`, 
          transform: 'translate(-50%, -50%)',
        }}
        animate={player.isMoving ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.3 }}
      >
        {/* Health bar above player */}
        <div className="absolute -top-6 w-14 h-2 bg-black/50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${isMe ? 'bg-green-500' : 'bg-red-400'}`}
            style={{ width: `${player.health}%` }}
          />
        </div>
        
        {/* Shield bar */}
        {player.shield > 0 && (
          <div className="absolute -top-8 w-14 h-1.5 bg-blue-900/50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${player.shield * 2}%` }} />
          </div>
        )}

        {/* Player avatar */}
        <div 
          className={`relative w-12 h-12 rounded-full overflow-hidden border-3 ${
            isMe ? 'border-primary' : 'border-red-500'
          } shadow-lg`}
          style={{ borderWidth: 3 }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isMe ? 'bg-primary' : 'bg-red-500'}`}>
              <Crosshair className="h-6 w-6 text-white" />
            </div>
          )}
          
          {/* Direction indicator overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ 
              background: `linear-gradient(${player.direction}deg, transparent 40%, ${isMe ? 'hsl(var(--primary) / 0.5)' : 'rgba(239,68,68,0.5)'} 100%)`
            }}
          />
        </div>

        {/* Name tag below */}
        <div className="absolute -bottom-5 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white whitespace-nowrap">
          {getPlayerName(player.id)}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <span className="font-bold">Afu Arena</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <main className="flex-1 flex flex-col">
        {/* Single Player Playing */}
        {isSinglePlayer && singlePlayerStatus === 'playing' ? (
          <div className="flex-1 flex flex-col">
            {/* HUD */}
            <div className="px-4 py-2 grid grid-cols-3 gap-2">
              {/* My Stats */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary">
                  {myProfile?.avatar_url ? (
                    <img src={myProfile.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-bold">
                        {myProfile?.display_name?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">You</div>
                  <div className="text-lg font-bold text-primary">
                    {singlePlayerState?.players[user?.id || '']?.kills || 0}
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="flex flex-col items-center justify-center p-2 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  <span className="text-sm font-mono font-bold">
                    {Math.floor((singlePlayerState?.maxTime || 180) - (singlePlayerState?.gameTime || 0))}s
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">First to 10</div>
              </div>

              {/* Bot Stats */}
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl justify-end">
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-xs font-semibold truncate">Bot</div>
                  <div className="text-lg font-bold text-red-500">
                    {singlePlayerState?.players[BOT_ID]?.kills || 0}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500">
                  <img src={BOT_AVATAR} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Countdown */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur"
                >
                  <span className="text-8xl font-bold text-primary">{countdown}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Area - Touch to shoot */}
            <div
              ref={gameAreaRef}
              className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden touch-none"
              onTouchStart={handleShootAreaTouch}
              onTouchMove={handleShootAreaTouch}
              onTouchEnd={handleShootAreaEnd}
            >
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-10">
                {[...Array(8)].map((_, i) => (
                  <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-white/30" style={{ top: `${(i + 1) * 12.5}%` }} />
                ))}
                {[...Array(8)].map((_, i) => (
                  <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-white/30" style={{ left: `${(i + 1) * 12.5}%` }} />
                ))}
              </div>

              {/* Power-ups */}
              {singlePlayerState?.powerUps?.map(pu => (
                <motion.div
                  key={pu.id}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    pu.type === 'health' ? 'bg-red-500 shadow-red-500/50' :
                    pu.type === 'shield' ? 'bg-blue-500 shadow-blue-500/50' :
                    pu.type === 'ammo' ? 'bg-yellow-500 shadow-yellow-500/50' :
                    pu.type === 'speed' ? 'bg-green-500 shadow-green-500/50' :
                    'bg-purple-500 shadow-purple-500/50'
                  }`}
                  style={{ left: `${pu.x}%`, top: `${pu.y}%`, transform: 'translate(-50%, -50%)' }}
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {pu.type === 'health' && <Heart className="h-4 w-4 text-white" />}
                  {pu.type === 'shield' && <Shield className="h-4 w-4 text-white" />}
                  {pu.type === 'ammo' && <Target className="h-4 w-4 text-white" />}
                  {pu.type === 'speed' && <Zap className="h-4 w-4 text-white" />}
                  {pu.type === 'weapon' && <Crosshair className="h-4 w-4 text-white" />}
                </motion.div>
              ))}

              {/* Projectiles */}
              {singlePlayerState?.projectiles?.map(proj => (
                <motion.div
                  key={proj.id}
                  className="absolute w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
                  style={{ left: `${proj.x}%`, top: `${proj.y}%`, transform: 'translate(-50%, -50%)' }}
                />
              ))}

              {/* Players with avatars */}
              {singlePlayerState?.players && Object.values(singlePlayerState.players).map(renderPlayer)}

              {/* Kill Feed */}
              <div className="absolute top-2 right-2 space-y-1">
                {singlePlayerState?.killFeed?.slice(0, 3).map((kill) => (
                  <motion.div
                    key={kill.timestamp}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1"
                  >
                    <span className={kill.killer === user?.id ? 'text-primary' : 'text-red-400'}>
                      {getPlayerName(kill.killer)}
                    </span>
                    <span>🔫</span>
                    <span className={kill.victim === user?.id ? 'text-red-400' : 'text-primary'}>
                      {getPlayerName(kill.victim)}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Respawn Overlay */}
              {singlePlayerState?.players[user?.id || '']?.respawnTimer > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center">
                    <p className="text-white text-xl font-bold">Respawning...</p>
                    <p className="text-white text-5xl font-bold">{Math.ceil(singlePlayerState.players[user?.id || ''].respawnTimer)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="p-4 bg-background border-t border-border/50">
              <div className="flex items-end justify-between">
                {/* Left: Joystick */}
                <div
                  ref={joystickRef}
                  className="relative w-28 h-28 rounded-full bg-muted/50 border-2 border-border/50"
                  onTouchStart={handleJoystickStart}
                  onTouchMove={handleJoystickMove}
                  onTouchEnd={handleJoystickEnd}
                >
                  <div 
                    className="absolute w-14 h-14 rounded-full bg-primary/80 shadow-lg"
                    style={{
                      left: `50%`,
                      top: `50%`,
                      transform: `translate(calc(-50% + ${joystickPos.x * 30}px), calc(-50% + ${joystickPos.y * 30}px))`
                    }}
                  />
                </div>

                {/* Center: Info */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-muted rounded">{myPlayer?.weapon?.toUpperCase() || 'PISTOL'}</span>
                    <span className="px-2 py-1 bg-muted rounded">{myPlayer?.ammo || 0} 🔫</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500"
                        style={{ width: `${singlePlayerState?.players[user?.id || '']?.health || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleReload}
                    className="h-10 px-4"
                  >
                    Reload
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleUseAbility}
                    disabled={(myPlayer?.abilityCooldown || 0) > 0}
                    className="h-10 px-4"
                  >
                    {(myPlayer?.abilityCooldown || 0) > 0 
                      ? `${Math.ceil((myPlayer?.abilityCooldown || 0) / 1000)}s`
                      : myPlayer?.ability?.toUpperCase() || 'ABILITY'
                    }
                  </Button>
                </div>
              </div>
              
              <p className="text-center text-xs text-muted-foreground mt-2">
                Tap game area to shoot
              </p>
            </div>
          </div>
        ) : isSinglePlayer && singlePlayerStatus === 'finished' ? (
          /* Single Player Game Over */
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm border-primary/20">
              <CardContent className="pt-6 text-center">
                {singlePlayerWon ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex p-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4"
                    >
                      <Trophy className="h-16 w-16 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-primary mb-2">Victory!</h2>
                    <p className="text-lg text-muted-foreground mb-6">+100 Nexa</p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex p-6 rounded-full bg-muted mb-4">
                      <Swords className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Defeat</h2>
                    <p className="text-muted-foreground mb-6">Better luck next time!</p>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-sm text-muted-foreground">Your Kills</p>
                    <p className="text-3xl font-bold">{singlePlayerState?.players[user?.id || '']?.kills || 0}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-sm text-muted-foreground">Your Deaths</p>
                    <p className="text-3xl font-bold">{singlePlayerState?.players[user?.id || '']?.deaths || 0}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={startSinglePlayer} className="flex-1 h-12">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                  <Button variant="outline" onClick={restartSinglePlayer} className="flex-1 h-12">
                    Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !gameRoom ? (
          /* Lobby */
          <div className="flex-1 p-4 space-y-4 overflow-auto">
            <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    <Swords className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">Battle Arena</h1>
                <p className="text-muted-foreground mb-6">First to 10 kills wins!</p>

                <div className="space-y-3">
                  <Button 
                    onClick={startSinglePlayer} 
                    disabled={loading} 
                    className="w-full h-14 text-lg"
                  >
                    <Target className="h-5 w-5 mr-2" />
                    Single Player
                  </Button>
                  
                  <Button 
                    onClick={createRoom} 
                    disabled={loading} 
                    variant="outline"
                    className="w-full h-12"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                    Create Room
                  </Button>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Room Code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="h-12 text-center uppercase"
                      maxLength={6}
                    />
                    <Button onClick={joinRoom} disabled={loading || !joinCode} className="h-12 px-6">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Info */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Crosshair className="h-4 w-4" />
                  <span className="font-semibold text-sm">Weapons</span>
                </div>
                <p className="text-xs text-muted-foreground">Pistol, Rifle, Shotgun, Sniper</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="font-semibold text-sm">Abilities</span>
                </div>
                <p className="text-xs text-muted-foreground">Dash, Heal, Freeze, Rage</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Star className="h-4 w-4" />
                  <span className="font-semibold text-sm">Power-ups</span>
                </div>
                <p className="text-xs text-muted-foreground">Health, Shield, Ammo, Speed</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Trophy className="h-4 w-4" />
                  <span className="font-semibold text-sm">Rewards</span>
                </div>
                <p className="text-xs text-muted-foreground">+100-150 Nexa</p>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Controls</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">👆</div>
                  <span>Drag left joystick to move</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">🎯</div>
                  <span>Tap game area to aim & shoot</span>
                </div>
              </div>
            </Card>
          </div>
        ) : gameRoom.status === 'waiting' ? (
          /* Waiting Room */
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm border-primary/20">
              <CardContent className="pt-6 text-center">
                <div className="p-4 rounded-2xl bg-primary/10 inline-flex mb-4">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Waiting for Opponent</h2>
                
                <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-xl mb-4">
                  <span className="font-mono text-2xl tracking-widest">{gameRoom.room_code}</span>
                  <Button variant="ghost" size="icon" onClick={copyRoomCode}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex justify-center gap-6 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary mb-2 mx-auto">
                      {hostInfo?.avatar_url ? (
                        <img src={hostInfo.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium">{hostInfo?.display_name || 'Host'}</p>
                    <span className="text-xs text-primary">Host</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-muted-foreground">VS</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-muted mb-2 mx-auto">
                      {guestInfo ? (
                        guestInfo.avatar_url ? (
                          <img src={guestInfo.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Users className="h-8 w-8" />
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium">{guestInfo?.display_name || 'Waiting...'}</p>
                  </div>
                </div>

                {isHost && (
                  <Button 
                    onClick={startGame} 
                    disabled={!gameRoom.guest_id}
                    className="w-full h-12"
                  >
                    <Swords className="h-5 w-5 mr-2" />
                    Start Battle
                  </Button>
                )}

                <Button variant="ghost" onClick={leaveRoom} className="mt-4">
                  Leave Room
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : gameRoom.status === 'playing' ? (
          /* Multiplayer Game */
          <div className="flex-1 flex flex-col">
            {/* HUD */}
            <div className="px-4 py-2 grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary">
                  {getPlayerAvatar(user?.id || '') ? (
                    <img src={getPlayerAvatar(user?.id || '') || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-bold">U</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">You</div>
                  <div className="text-lg font-bold text-primary">{myPlayer?.kills || 0}</div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-2 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  <span className="text-sm font-mono font-bold">
                    {Math.floor((gameState?.maxTime || 180) - (gameState?.gameTime || 0))}s
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground">First to 10</div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-xl justify-end">
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-xs font-semibold truncate">Opponent</div>
                  <div className="text-lg font-bold text-red-500">{opponent?.kills || 0}</div>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500">
                  {getPlayerAvatar(opponent?.id || '') ? (
                    <img src={getPlayerAvatar(opponent?.id || '') || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-red-500 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">O</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur"
                >
                  <span className="text-8xl font-bold text-primary">{countdown}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Area */}
            <div
              ref={gameAreaRef}
              className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden touch-none"
              onTouchStart={handleShootAreaTouch}
              onTouchMove={handleShootAreaTouch}
              onTouchEnd={handleShootAreaEnd}
            >
              <div className="absolute inset-0 opacity-10">
                {[...Array(8)].map((_, i) => (
                  <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-white/30" style={{ top: `${(i + 1) * 12.5}%` }} />
                ))}
                {[...Array(8)].map((_, i) => (
                  <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-white/30" style={{ left: `${(i + 1) * 12.5}%` }} />
                ))}
              </div>

              {gameState?.powerUps?.map(pu => (
                <motion.div
                  key={pu.id}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    pu.type === 'health' ? 'bg-red-500 shadow-red-500/50' :
                    pu.type === 'shield' ? 'bg-blue-500 shadow-blue-500/50' :
                    pu.type === 'ammo' ? 'bg-yellow-500 shadow-yellow-500/50' :
                    pu.type === 'speed' ? 'bg-green-500 shadow-green-500/50' :
                    'bg-purple-500 shadow-purple-500/50'
                  }`}
                  style={{ left: `${pu.x}%`, top: `${pu.y}%`, transform: 'translate(-50%, -50%)' }}
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {pu.type === 'health' && <Heart className="h-4 w-4 text-white" />}
                  {pu.type === 'shield' && <Shield className="h-4 w-4 text-white" />}
                  {pu.type === 'ammo' && <Target className="h-4 w-4 text-white" />}
                  {pu.type === 'speed' && <Zap className="h-4 w-4 text-white" />}
                  {pu.type === 'weapon' && <Crosshair className="h-4 w-4 text-white" />}
                </motion.div>
              ))}

              {gameState?.projectiles?.map(proj => (
                <motion.div
                  key={proj.id}
                  className="absolute w-3 h-3 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
                  style={{ left: `${proj.x}%`, top: `${proj.y}%`, transform: 'translate(-50%, -50%)' }}
                />
              ))}

              {gameState?.players && Object.values(gameState.players).map(renderPlayer)}

              <div className="absolute top-2 right-2 space-y-1">
                {gameState?.killFeed?.slice(0, 3).map((kill) => (
                  <motion.div
                    key={kill.timestamp}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1"
                  >
                    <span className={kill.killer === user?.id ? 'text-primary' : 'text-red-400'}>
                      {getPlayerName(kill.killer)}
                    </span>
                    <span>🔫</span>
                    <span className={kill.victim === user?.id ? 'text-red-400' : 'text-primary'}>
                      {getPlayerName(kill.victim)}
                    </span>
                  </motion.div>
                ))}
              </div>

              {myPlayer?.respawnTimer > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center">
                    <p className="text-white text-xl font-bold">Respawning...</p>
                    <p className="text-white text-5xl font-bold">{Math.ceil(myPlayer.respawnTimer)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Controls */}
            <div className="p-4 bg-background border-t border-border/50">
              <div className="flex items-end justify-between">
                <div
                  ref={joystickRef}
                  className="relative w-28 h-28 rounded-full bg-muted/50 border-2 border-border/50"
                  onTouchStart={handleJoystickStart}
                  onTouchMove={handleJoystickMove}
                  onTouchEnd={handleJoystickEnd}
                >
                  <div 
                    className="absolute w-14 h-14 rounded-full bg-primary/80 shadow-lg"
                    style={{
                      left: `50%`,
                      top: `50%`,
                      transform: `translate(calc(-50% + ${joystickPos.x * 30}px), calc(-50% + ${joystickPos.y * 30}px))`
                    }}
                  />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-muted rounded">{myPlayer?.weapon?.toUpperCase() || 'PISTOL'}</span>
                    <span className="px-2 py-1 bg-muted rounded">{myPlayer?.ammo || 0} 🔫</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-red-500" />
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500"
                        style={{ width: `${myPlayer?.health || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={handleReload}
                    className="h-10 px-4"
                  >
                    Reload
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleUseAbility}
                    disabled={(myPlayer?.abilityCooldown || 0) > 0}
                    className="h-10 px-4"
                  >
                    {(myPlayer?.abilityCooldown || 0) > 0 
                      ? `${Math.ceil((myPlayer?.abilityCooldown || 0) / 1000)}s`
                      : myPlayer?.ability?.toUpperCase() || 'ABILITY'
                    }
                  </Button>
                </div>
              </div>
              
              <p className="text-center text-xs text-muted-foreground mt-2">
                Tap game area to shoot
              </p>
            </div>
          </div>
        ) : (
          /* Game Over */
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm border-primary/20">
              <CardContent className="pt-6 text-center">
                {gameRoom.winner_id === user?.id ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex p-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-4"
                    >
                      <Trophy className="h-16 w-16 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-primary mb-2">Victory!</h2>
                    <p className="text-lg text-muted-foreground mb-6">+150 Nexa</p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex p-6 rounded-full bg-muted mb-4">
                      <Swords className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Defeat</h2>
                    <p className="text-muted-foreground mb-6">Better luck next time!</p>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-sm text-muted-foreground">Your Kills</p>
                    <p className="text-3xl font-bold">{myPlayer?.kills || 0}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-sm text-muted-foreground">Your Deaths</p>
                    <p className="text-3xl font-bold">{myPlayer?.deaths || 0}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {isHost && (
                    <Button onClick={playAgain} className="flex-1 h-12">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Play Again
                    </Button>
                  )}
                  <Button variant="outline" onClick={leaveRoom} className="flex-1 h-12">
                    Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AfuArena;
