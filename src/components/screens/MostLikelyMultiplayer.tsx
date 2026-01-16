import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Users, Trophy, Beer } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { mostLikelyQuestions } from '@/data/mostLikelyData';

interface Player {
  id: string;
  nickname: string;
  avatar: string;
  isHost: boolean;
  totalVotesReceived: number;
}

interface Vote {
  voterId: string;
  votedForId: string;
  voterName: string;
}

type GamePhase = 'waiting' | 'voting' | 'results' | 'summary';

const MostLikelyMultiplayer: React.FC = () => {
  const { language } = useLanguage();
  const { setCurrentScreen } = useGame();
  const isRTL = language === 'he';

  const primaryColor = 'hsl(174 84% 50%)';

  const [roomId] = useState(() => localStorage.getItem('mlRoomId') || '');
  const [deviceId] = useState(() => localStorage.getItem('mlDeviceId') || '');
  const [isHost] = useState(() => localStorage.getItem('mlIsHost') === 'true');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [timer, setTimer] = useState(15);
  const [gameStats, setGameStats] = useState<{partyAnimal: Player | null; saint: Player | null}>({ partyAnimal: null, saint: null });

  const currentQuestion = questionOrder[currentQuestionIndex] 
    ? mostLikelyQuestions.find(q => q.id === questionOrder[currentQuestionIndex])
    : null;

  // Initialize game
  useEffect(() => {
    if (!roomId) return;
    
    const init = async () => {
      // Get room data
      const { data: room } = await (supabase
        .from('most_likely_rooms' as any)
        .select('*')
        .eq('id', roomId)
        .single() as any);
      
      if (room) {
        setQuestionOrder(room.question_order || []);
        setCurrentQuestionIndex(room.current_question_index);
        setPhase(room.status === 'playing' ? 'voting' : 'waiting');
      }

      // Get my player ID
      const { data: myPlayer } = await (supabase
        .from('most_likely_players' as any)
        .select('id')
        .eq('room_id', roomId)
        .eq('device_id', deviceId)
        .single() as any);
      
      if (myPlayer) setMyPlayerId(myPlayer.id);

      await fetchPlayers();
    };

    init();
  }, [roomId, deviceId]);

  // Subscribe to room changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`ml-game-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'most_likely_rooms', filter: `id=eq.${roomId}` }, 
        (payload: any) => {
          if (payload.new) {
            setCurrentQuestionIndex(payload.new.current_question_index);
            if (payload.new.status === 'playing') setPhase('voting');
            if (payload.new.status === 'finished') setPhase('summary');
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'most_likely_votes', filter: `room_id=eq.${roomId}` },
        () => fetchVotes()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'most_likely_players', filter: `room_id=eq.${roomId}` },
        () => fetchPlayers()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // Timer logic
  useEffect(() => {
    if (phase !== 'voting') return;
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (isHost) showResults();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isHost]);

  // Check if all voted
  useEffect(() => {
    if (phase === 'voting' && votes.length === players.length && players.length >= 2 && isHost) {
      showResults();
    }
  }, [votes.length, players.length, phase, isHost]);

  const fetchPlayers = useCallback(async () => {
    const { data } = await (supabase
      .from('most_likely_players' as any)
      .select('*')
      .eq('room_id', roomId)
      .order('created_at') as any);
    
    if (data) {
      setPlayers((data as any[]).map((p: any) => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        isHost: p.is_host,
        totalVotesReceived: p.total_votes_received,
      })));
    }
  }, [roomId]);

  const fetchVotes = useCallback(async () => {
    const { data } = await (supabase
      .from('most_likely_votes' as any)
      .select('*')
      .eq('room_id', roomId)
      .eq('question_index', currentQuestionIndex) as any);
    
    if (data) {
      // Get player names for voters
      const voterNames: Record<string, string> = {};
      players.forEach(p => { voterNames[p.id] = p.nickname; });
      
      setVotes((data as any[]).map((v: any) => ({
        voterId: v.voter_id,
        votedForId: v.voted_for_id,
        voterName: voterNames[v.voter_id] || '',
      })));
      
      const myVote = (data as any[]).find((v: any) => v.voter_id === myPlayerId);
      setHasVoted(!!myVote);
    }
  }, [roomId, currentQuestionIndex, myPlayerId, players]);

  const submitVote = async (playerId: string) => {
    if (hasVoted || !myPlayerId) return;
    setSelectedPlayer(playerId);

    await (supabase.from('most_likely_votes' as any).insert({
      room_id: roomId,
      question_index: currentQuestionIndex,
      voter_id: myPlayerId,
      voted_for_id: playerId,
    }) as any);

    setHasVoted(true);
    fetchVotes();
  };

  const showResults = async () => {
    setPhase('results');
  };

  const nextQuestion = async () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= questionOrder.length) {
      // Game over - calculate stats
      const sorted = [...players].sort((a, b) => b.totalVotesReceived - a.totalVotesReceived);
      setGameStats({
        partyAnimal: sorted[0] || null,
        saint: sorted[sorted.length - 1] || null,
      });
      
      await (supabase.from('most_likely_rooms' as any).update({ status: 'finished' }).eq('id', roomId) as any);
      setPhase('summary');
    } else {
      // Update vote counts
      const voteCounts: Record<string, number> = {};
      votes.forEach(v => { voteCounts[v.votedForId] = (voteCounts[v.votedForId] || 0) + 1; });
      
      for (const [playerId, count] of Object.entries(voteCounts)) {
        const player = players.find(p => p.id === playerId);
        if (player) {
          await (supabase.from('most_likely_players' as any)
            .update({ total_votes_received: player.totalVotesReceived + count })
            .eq('id', playerId) as any);
        }
      }

      await (supabase.from('most_likely_rooms' as any).update({ current_question_index: nextIndex }).eq('id', roomId) as any);
      
      setHasVoted(false);
      setSelectedPlayer(null);
      setVotes([]);
      setTimer(15);
      setPhase('voting');
    }
  };

  // Get winner of current round
  const getWinner = () => {
    const voteCounts: Record<string, number> = {};
    votes.forEach(v => { voteCounts[v.votedForId] = (voteCounts[v.votedForId] || 0) + 1; });
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const winnerId = Object.entries(voteCounts).find(([, c]) => c === maxVotes)?.[0];
    return players.find(p => p.id === winnerId);
  };

  const getVotersFor = (playerId: string) => votes.filter(v => v.votedForId === playerId).map(v => v.voterName);

  // Summary Screen
  if (phase === 'summary') {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-4xl font-black text-neon-cyan mb-8">{isRTL ? 'סיכום המשחק' : 'Game Summary'}</h1>
          
          {gameStats.partyAnimal && (
            <div className="glass-card p-6 mb-4">
              <div className="text-4xl mb-2">🍺</div>
              <p className="text-lg text-muted-foreground">{isRTL ? 'השתיין של הערב' : 'Party Animal'}</p>
              <p className="text-2xl font-black" style={{ color: primaryColor }}>
                {gameStats.partyAnimal.avatar} {gameStats.partyAnimal.nickname}
              </p>
            </div>
          )}
          
          {gameStats.saint && (
            <div className="glass-card p-6 mb-8">
              <div className="text-4xl mb-2">😇</div>
              <p className="text-lg text-muted-foreground">{isRTL ? 'הצדיק' : 'The Saint'}</p>
              <p className="text-2xl font-black text-green-400">
                {gameStats.saint.avatar} {gameStats.saint.nickname}
              </p>
            </div>
          )}

          <Button size="xl" onClick={() => setCurrentScreen('gameSelection')} className="w-full text-xl font-black py-6" style={{ background: `linear-gradient(135deg, ${primaryColor}, hsl(187 100% 42%))` }}>
            {isRTL ? 'חזרה לתפריט' : 'Back to Menu'}
          </Button>
        </motion.div>
      </div>
    );
  }

  // Results Screen
  if (phase === 'results') {
    const winner = getWinner();
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
            <div className="text-6xl mb-4">{winner?.avatar || '🤷'}</div>
            <h2 className="text-3xl font-black mb-2" style={{ color: primaryColor }}>{winner?.nickname}</h2>
            <p className="text-xl text-muted-foreground mb-4">{isRTL ? 'הרוב קבעו - תשתה!' : 'The group has spoken - DRINK!'}</p>
            
            <div className="glass-card p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-2">{isRTL ? 'הצביעו בעדו:' : 'Voted by:'}</p>
              <p className="font-bold">{winner ? getVotersFor(winner.id).join(', ') : '-'}</p>
            </div>
          </motion.div>
        </div>

        {isHost && (
          <Button size="xl" onClick={nextQuestion} className="w-full text-xl font-black py-6" style={{ background: `linear-gradient(135deg, ${primaryColor}, hsl(187 100% 42%))` }}>
            {currentQuestionIndex + 1 >= questionOrder.length ? (isRTL ? 'סיום' : 'Finish') : (isRTL ? 'שאלה הבאה' : 'Next Question')}
          </Button>
        )}
      </div>
    );
  }

  // Voting Screen
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentScreen('gameSelection')} className="p-2 glass-card rounded-xl">
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="font-bold">{timer}s</span>
        </div>
        <div className="text-sm">{currentQuestionIndex + 1}/{questionOrder.length}</div>
      </div>

      <motion.div className="glass-card p-6 mb-6 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <p className="text-2xl font-black" style={{ color: primaryColor }}>
          {currentQuestion ? (isRTL ? currentQuestion.he : currentQuestion.en) : '...'}
        </p>
      </motion.div>

      <div className="flex-1">
        <p className="text-center text-muted-foreground mb-4">
          {hasVoted ? (isRTL ? 'ממתין לשאר...' : 'Waiting for others...') : (isRTL ? 'בחר מישהו!' : 'Pick someone!')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {players.map(player => (
            <motion.button
              key={player.id}
              onClick={() => !hasVoted && submitVote(player.id)}
              disabled={hasVoted}
              className={`glass-card p-4 text-center transition-all ${selectedPlayer === player.id ? 'ring-2 ring-neon-cyan' : ''}`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-4xl block mb-2">{player.avatar}</span>
              <span className="font-bold">{player.nickname}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground mt-4">
        <Users className="w-4 h-4 inline mr-1" />
        {votes.length}/{players.length} {isRTL ? 'הצביעו' : 'voted'}
      </div>
    </div>
  );
};

export default MostLikelyMultiplayer;
