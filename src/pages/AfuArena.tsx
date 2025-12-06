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
  direction: number; // angle in degrees
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
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [hostInfo, setHostInfo] = useState<PlayerInfo | null>(null);
  const [guestInfo, setGuestInfo] = useState<PlayerInfo | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const localGameStateRef = useRef<GameState | null>(null);

  // Initialize audio
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
    x: isHost ? 15 : 85,
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
    maxTime: 180, // 3 minutes
    killFeed: []
  });

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
      toast.success('Room created! Share the code with a friend');
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
        toast.error('Room not found or game already started');
        return;
      }

      if (room.host_id === user.id) {
        toast.error('You cannot join your own room');
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

  // Subscribe to room updates
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

          // Sync game state from remote
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', ' ', 'e', 'r'].includes(key)) {
        e.preventDefault();
        setKeys(prev => new Set(prev).add(key));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse controls
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  // Start the game
  const startGame = async () => {
    if (!gameRoom || !user || gameRoom.host_id !== user.id) return;
    if (!gameRoom.guest_id) {
      toast.error('Waiting for opponent to join');
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

  // Game loop
  useEffect(() => {
    if (gameRoom?.status !== 'playing' || !user) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastUpdateRef.current;
      
      if (deltaTime >= 16) { // ~60fps
        lastUpdateRef.current = timestamp;
        updateGame(deltaTime / 1000);
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameRoom?.status, user, keys, mousePos, isMouseDown]);

  const updateGame = async (dt: number) => {
    if (!localGameStateRef.current || !user || !gameRoom) return;
    
    const state = { ...localGameStateRef.current };
    const player = state.players[user.id];
    if (!player || player.respawnTimer > 0) {
      // Handle respawn
      if (player && player.respawnTimer > 0) {
        player.respawnTimer -= dt;
        if (player.respawnTimer <= 0) {
          player.health = player.maxHealth;
          player.x = player.id === gameRoom.host_id ? 15 : 85;
          player.y = 50;
          player.respawnTimer = 0;
        }
      }
      localGameStateRef.current = state;
      return;
    }

    // Movement
    let dx = 0, dy = 0;
    if (keys.has('w')) dy -= 1;
    if (keys.has('s')) dy += 1;
    if (keys.has('a')) dx -= 1;
    if (keys.has('d')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      dx /= mag;
      dy /= mag;
      player.x = Math.max(2, Math.min(98, player.x + dx * player.speed * dt * 20));
      player.y = Math.max(2, Math.min(98, player.y + dy * player.speed * dt * 20));
      player.isMoving = true;
    } else {
      player.isMoving = false;
    }

    // Direction (aim towards mouse)
    player.direction = Math.atan2(mousePos.y - player.y, mousePos.x - player.x) * 180 / Math.PI;

    // Shooting
    const now = Date.now();
    if (isMouseDown && player.ammo > 0) {
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

    // Ability use
    if (keys.has('e') && player.abilityCooldown <= 0) {
      useAbility(player, state);
      player.abilityCooldown = ABILITY_COOLDOWNS[player.ability];
      playSound(600, 0.3, 'triangle');
    }

    // Reload
    if (keys.has('r')) {
      player.ammo = WEAPON_STATS[player.weapon].ammo;
      playSound(300, 0.2);
    }

    // Reduce cooldown
    if (player.abilityCooldown > 0) {
      player.abilityCooldown -= dt * 1000;
    }

    // Update projectiles
    state.projectiles = state.projectiles.filter(proj => {
      proj.x += proj.dx * dt * 10;
      proj.y += proj.dy * dt * 10;

      // Check bounds
      if (proj.x < 0 || proj.x > 100 || proj.y < 0 || proj.y > 100) {
        return false;
      }

      // Check collision with other players
      for (const playerId in state.players) {
        if (playerId === proj.ownerId) continue;
        const target = state.players[playerId];
        if (target.respawnTimer > 0) continue;

        const dist = Math.sqrt((proj.x - target.x) ** 2 + (proj.y - target.y) ** 2);
        if (dist < 4) { // Hit!
          let damage = proj.damage;
          if (target.shield > 0) {
            const shieldAbsorb = Math.min(target.shield, damage * 0.5);
            target.shield -= shieldAbsorb;
            damage -= shieldAbsorb;
          }
          target.health -= damage;
          playSound(150, 0.1);

          if (target.health <= 0) {
            // Kill!
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

            // Check win condition
            if (player.kills >= 10) {
              endGame(proj.ownerId);
            }
          }
          return false;
        }
      }
      return true;
    });

    // Update powerups
    state.powerUps.forEach((powerUp, index) => {
      const dist = Math.sqrt((powerUp.x - player.x) ** 2 + (powerUp.y - player.y) ** 2);
      if (dist < 5) {
        applyPowerUp(player, powerUp);
        state.powerUps.splice(index, 1);
        playSound(500, 0.2);
      }
    });

    // Spawn powerups periodically
    state.gameTime += dt;
    if (state.powerUps.length < 3 && Math.random() < 0.005) {
      spawnPowerUp(state);
    }

    // Check time limit
    if (state.gameTime >= state.maxTime) {
      const winner = Object.values(state.players).reduce((a, b) => a.kills > b.kills ? a : b);
      endGame(winner.id);
    }

    state.players[user.id] = player;
    localGameStateRef.current = state;

    // Sync to database periodically
    if (Math.random() < 0.05) { // ~5% of frames
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
        player.x = Math.max(2, Math.min(98, player.x + Math.cos(angle) * dashDist));
        player.y = Math.max(2, Math.min(98, player.y + Math.sin(angle) * dashDist));
        break;
      case 'heal':
        player.health = Math.min(player.maxHealth, player.health + 50);
        break;
      case 'freeze':
        // Slow enemies temporarily
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
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
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

  const isHost = user && gameRoom?.host_id === user.id;
  const gameState = localGameStateRef.current || (gameRoom?.game_state as GameState);
  const myPlayer = gameState?.players?.[user?.id || ''];
  const opponent = gameState?.players?.[Object.keys(gameState?.players || {}).find(k => k !== user?.id) || ''];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Swords className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Afu Arena</span>
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

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {!gameRoom ? (
          /* Lobby */
          <div className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    <Crosshair className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Battle Royale Arena</CardTitle>
                <p className="text-muted-foreground">Real-time 1v1 combat with weapons & abilities</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={createRoom} 
                  className="w-full h-14 text-lg"
                  disabled={loading || !user}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Swords className="h-5 w-5 mr-2" />}
                  Create Room
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or join</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Room code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="h-14 text-center text-xl font-mono tracking-widest uppercase"
                    maxLength={6}
                  />
                  <Button 
                    onClick={joinRoom}
                    disabled={loading || !user || !joinCode.trim()}
                    className="h-14 px-6"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Join'}
                  </Button>
                </div>

                {!user && (
                  <p className="text-center text-sm text-muted-foreground">
                    Sign in to play multiplayer
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Game Features */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Crosshair className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">Weapons</span>
                </div>
                <p className="text-xs text-muted-foreground">Pistol, Rifle, Shotgun, Sniper</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">Abilities</span>
                </div>
                <p className="text-xs text-muted-foreground">Dash, Heal, Freeze, Rage</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Power-ups</span>
                </div>
                <p className="text-xs text-muted-foreground">Health, Shield, Ammo, Speed</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-semibold">Win Reward</span>
                </div>
                <p className="text-xs text-muted-foreground">+150 Nexa for victory</p>
              </Card>
            </div>

            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <div><kbd className="px-2 py-1 bg-muted rounded">W A S D</kbd> Move</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">Mouse</kbd> Aim & Shoot</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">E</kbd> Use Ability</div>
                <div><kbd className="px-2 py-1 bg-muted rounded">R</kbd> Reload</div>
              </CardContent>
            </Card>
          </div>
        ) : gameRoom.status === 'waiting' ? (
          /* Waiting Room */
          <div className="space-y-6">
            <Card className="border-primary/20">
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

                <div className="flex justify-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      {hostInfo?.avatar_url ? (
                        <img src={hostInfo.avatar_url} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Users className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <p className="text-sm font-medium">{hostInfo?.display_name || 'Host'}</p>
                    <span className="text-xs text-primary">Host</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-muted-foreground">VS</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                      {guestInfo ? (
                        guestInfo.avatar_url ? (
                          <img src={guestInfo.avatar_url} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Users className="h-8 w-8" />
                        )
                      ) : (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          /* Game Arena */
          <div className="space-y-4">
            {/* HUD */}
            <div className="grid grid-cols-3 gap-4">
              {/* My Stats */}
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <Progress value={myPlayer?.health || 0} className="h-2" />
                  <span className="text-xs">{myPlayer?.health || 0}</span>
                </div>
                {(myPlayer?.shield || 0) > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <Progress value={myPlayer?.shield || 0} max={50} className="h-2" />
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{myPlayer?.weapon?.toUpperCase()}</span>
                  <span>{myPlayer?.ammo || 0} ammo</span>
                </div>
              </Card>

              {/* Score */}
              <Card className="p-3 text-center">
                <div className="text-2xl font-bold">
                  <span className="text-primary">{myPlayer?.kills || 0}</span>
                  <span className="mx-2 text-muted-foreground">-</span>
                  <span className="text-red-500">{opponent?.kills || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  First to 10 kills
                </div>
              </Card>

              {/* Timer */}
              <Card className="p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span className="text-lg font-mono">
                    {Math.floor((gameState?.maxTime || 180) - (gameState?.gameTime || 0))}s
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ability: {myPlayer?.abilityCooldown && myPlayer.abilityCooldown > 0 
                    ? `${Math.ceil(myPlayer.abilityCooldown / 1000)}s` 
                    : 'Ready (E)'}
                </div>
              </Card>
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

            {/* Game Area */}
            <div
              ref={gameAreaRef}
              className="relative aspect-[16/10] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden cursor-crosshair border-2 border-primary/30"
              onMouseMove={handleMouseMove}
              onMouseDown={() => setIsMouseDown(true)}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseLeave={() => setIsMouseDown(false)}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 opacity-10">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-t border-white" style={{ top: `${(i + 1) * 10}%` }} />
                ))}
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-white" style={{ left: `${(i + 1) * 10}%` }} />
                ))}
              </div>

              {/* Power-ups */}
              {gameState?.powerUps?.map(pu => (
                <motion.div
                  key={pu.id}
                  className={`absolute w-6 h-6 rounded-full flex items-center justify-center ${
                    pu.type === 'health' ? 'bg-red-500' :
                    pu.type === 'shield' ? 'bg-blue-500' :
                    pu.type === 'ammo' ? 'bg-yellow-500' :
                    pu.type === 'speed' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}
                  style={{ left: `${pu.x}%`, top: `${pu.y}%`, transform: 'translate(-50%, -50%)' }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  {pu.type === 'health' && <Heart className="h-3 w-3 text-white" />}
                  {pu.type === 'shield' && <Shield className="h-3 w-3 text-white" />}
                  {pu.type === 'ammo' && <Target className="h-3 w-3 text-white" />}
                  {pu.type === 'speed' && <Zap className="h-3 w-3 text-white" />}
                  {pu.type === 'weapon' && <Crosshair className="h-3 w-3 text-white" />}
                </motion.div>
              ))}

              {/* Projectiles */}
              {gameState?.projectiles?.map(proj => (
                <motion.div
                  key={proj.id}
                  className="absolute w-2 h-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
                  style={{ left: `${proj.x}%`, top: `${proj.y}%`, transform: 'translate(-50%, -50%)' }}
                />
              ))}

              {/* Players */}
              {gameState?.players && Object.values(gameState.players).map(player => (
                <motion.div
                  key={player.id}
                  className={`absolute w-10 h-10 rounded-full flex items-center justify-center ${
                    player.id === user?.id ? 'bg-primary' : 'bg-red-500'
                  } ${player.respawnTimer > 0 ? 'opacity-30' : ''}`}
                  style={{ 
                    left: `${player.x}%`, 
                    top: `${player.y}%`, 
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={player.isMoving ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                >
                  {/* Direction indicator */}
                  <div 
                    className="absolute w-6 h-1 bg-white/50 origin-left rounded"
                    style={{ transform: `rotate(${player.direction}deg)` }}
                  />
                  <Crosshair className="h-5 w-5 text-white" />
                  
                  {/* Health bar */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${player.id === user?.id ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${player.health}%` }}
                    />
                  </div>
                  
                  {/* Shield indicator */}
                  {player.shield > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500/50 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${player.shield * 2}%` }} />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Kill Feed */}
              <div className="absolute top-2 right-2 space-y-1">
                {gameState?.killFeed?.slice(0, 3).map((kill, i) => (
                  <motion.div
                    key={kill.timestamp}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="px-2 py-1 bg-black/50 rounded text-xs text-white"
                  >
                    <span className={kill.killer === user?.id ? 'text-primary' : 'text-red-400'}>
                      {kill.killer === user?.id ? 'You' : 'Enemy'}
                    </span>
                    {' '}🔫{' '}
                    <span className={kill.victim === user?.id ? 'text-red-400' : 'text-primary'}>
                      {kill.victim === user?.id ? 'You' : 'Enemy'}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Respawn Timer */}
              {myPlayer?.respawnTimer > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">Respawning...</p>
                    <p className="text-white text-4xl">{Math.ceil(myPlayer.respawnTimer)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Game Over */
          <Card className="border-primary/20">
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
        )}
      </main>
    </div>
  );
};

export default AfuArena;