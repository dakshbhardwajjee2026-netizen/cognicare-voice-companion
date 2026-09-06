import React, { useState } from 'react';
import { Brain, Trophy, Sparkles, RefreshCw, Mic, Volume2 } from 'lucide-react';

interface CognitiveGamesViewProps {
  onScoreSubmit: (gameId: 'mem_match' | 'what_changed' | 'mem_tray' | 'routine_recall' | 'obj_rec', title: string, score: number) => void;
}

export const CognitiveGamesView: React.FC<CognitiveGamesViewProps> = ({ onScoreSubmit }) => {
  const [activeGame, setActiveGame] = useState<'none' | 'match' | 'changed' | 'tray' | 'routine' | 'object'>('none');
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [gameDone, setGameDone] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');

  // 1. Memory Match Cards
  const matchCards = [
    { id: 1, symbol: '🍎' }, { id: 2, symbol: '🌸' },
    { id: 3, symbol: '🍎' }, { id: 4, symbol: '🌸' }
  ];

  // 2. What Changed Items
  const initialItems = ['🍎 Apple', '🌸 Flower', '⏰ Clock', '📚 Book'];
  const changedItems = ['🍎 Apple', '🌸 Flower', '⌚ Watch', '📚 Book'];
  const [showChangedPreview, setShowChangedPreview] = useState(false);

  // 3. Memory Tray Items
  const trayItems = ['👓 Glasses', '🗝️ Key', '☕ Cup'];
  const missingTrayItems = ['👓 Glasses', '☕ Cup'];

  const handleMatchClick = (id: number) => {
    if (selectedCards.includes(id) || selectedCards.length >= 2) return;
    const next = [...selectedCards, id];
    setSelectedCards(next);
    if (next.length === 2) {
      const c1 = matchCards.find(c => c.id === next[0]);
      const c2 = matchCards.find(c => c.id === next[1]);
      if (c1 && c2 && c1.symbol === c2.symbol) {
        setTimeout(() => {
          setGameDone(true);
          onScoreSubmit('mem_match', 'Memory Match', 100);
        }, 500);
      } else {
        setTimeout(() => setSelectedCards([]), 900);
      }
    }
  };

  const startWhatChanged = () => {
    setActiveGame('changed');
    setShowChangedPreview(true);
    setTimeout(() => setShowChangedPreview(false), 4000);
  };

  const handleChangedSelect = (item: string) => {
    setGameDone(true);
    const score = item.includes('Watch') ? 100 : 50;
    onScoreSubmit('what_changed', 'What Changed?', score);
  };

  const handleTraySelect = (item: string) => {
    setGameDone(true);
    const score = item.includes('Key') ? 100 : 50;
    onScoreSubmit('mem_tray', 'Memory Tray', score);
  };

  const handleRoutineSelect = (period: string) => {
    setGameDone(true);
    const score = period === 'morning' ? 100 : 60;
    onScoreSubmit('routine_recall', 'Daily Routine Recall', score);
  };

  const handleVoiceObjectSubmit = () => {
    setGameDone(true);
    onScoreSubmit('obj_rec', 'Object Recognition', 100);
  };

  const reset = () => {
    setActiveGame('none');
    setSelectedCards([]);
    setGameDone(false);
    setVoiceInput('');
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-lg">
          <Brain className="w-5 h-5 text-blue-600" />
          <span>Cognitive Fitness Suite</span>
        </div>
        {activeGame !== 'none' && (
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Back
          </button>
        )}
      </div>

      {activeGame === 'none' ? (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setActiveGame('match')} className="bg-blue-50/70 border border-blue-200 hover:bg-blue-100/60 p-4 rounded-2xl text-left transition-all">
            <span className="text-3xl">🧩</span>
            <h4 className="font-bold text-slate-900 text-sm mt-2">Memory Match</h4>
            <p className="text-xs text-slate-500">Pair matching cards</p>
          </button>

          <button onClick={startWhatChanged} className="bg-indigo-50/70 border border-indigo-200 hover:bg-indigo-100/60 p-4 rounded-2xl text-left transition-all">
            <span className="text-3xl">🔍</span>
            <h4 className="font-bold text-slate-900 text-sm mt-2">What Changed?</h4>
            <p className="text-xs text-slate-500">Spot modified item</p>
          </button>

          <button onClick={() => setActiveGame('tray')} className="bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100/60 p-4 rounded-2xl text-left transition-all">
            <span className="text-3xl">🍱</span>
            <h4 className="font-bold text-slate-900 text-sm mt-2">Memory Tray</h4>
            <p className="text-xs text-slate-500">Find missing object</p>
          </button>

          <button onClick={() => setActiveGame('routine')} className="bg-purple-50/70 border border-purple-200 hover:bg-purple-100/60 p-4 rounded-2xl text-left transition-all">
            <span className="text-3xl">🌅</span>
            <h4 className="font-bold text-slate-900 text-sm mt-2">Routine Recall</h4>
            <p className="text-xs text-slate-500">Sequence daily tasks</p>
          </button>

          <button onClick={() => setActiveGame('object')} className="col-span-2 bg-amber-50/70 border border-amber-200 hover:bg-amber-100/60 p-4 rounded-2xl text-left flex items-center justify-between transition-all">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">🎙️ Voice Object Recognition</h4>
              <p className="text-xs text-slate-500">Identify object using your voice</p>
            </div>
            <span className="text-3xl">👓</span>
          </button>
        </div>
      ) : gameDone ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
          <Trophy className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-slate-900">Activity Completed!</h3>
          <p className="text-xs text-slate-500">Result saved to Sarah's Caregiver Telemetry Dashboard.</p>
        </div>
      ) : activeGame === 'match' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <h4 className="font-bold text-slate-900 mb-3">Tap matching pairs:</h4>
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            {matchCards.map(c => (
              <button
                key={c.id}
                onClick={() => handleMatchClick(c.id)}
                className={`h-20 rounded-2xl text-3xl border-2 transition-all ${
                  selectedCards.includes(c.id) ? 'bg-blue-600 text-white border-blue-400' : 'bg-white border-slate-200 text-transparent shadow-sm'
                }`}
              >
                {selectedCards.includes(c.id) ? c.symbol : '❓'}
              </button>
            ))}
          </div>
        </div>
      ) : activeGame === 'changed' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          {showChangedPreview ? (
            <div>
              <h4 className="font-bold text-blue-600 mb-2">Remember these 4 items (4s preview):</h4>
              <div className="flex justify-around text-lg font-bold text-slate-800 my-4">
                {initialItems.map((item, i) => <span key={i}>{item}</span>)}
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-bold text-slate-900 mb-3">Which item changed in the list below?</h4>
              <div className="grid grid-cols-2 gap-2.5">
                {changedItems.map((item, i) => (
                  <button key={i} onClick={() => handleChangedSelect(item)} className="bg-white border border-slate-200 p-3 rounded-xl font-semibold text-slate-800 hover:border-blue-500">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeGame === 'tray' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <h4 className="font-bold text-slate-900 mb-2">Which object was removed from the tray?</h4>
          <p className="text-xs text-slate-500 mb-3">Remaining items: 👓 Glasses, ☕ Cup</p>
          <div className="grid grid-cols-3 gap-2">
            {['👓 Glasses', '🗝️ Key', '☕ Cup'].map((item, i) => (
              <button key={i} onClick={() => handleTraySelect(item)} className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-slate-800 hover:border-emerald-500">
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : activeGame === 'routine' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <h4 className="font-bold text-slate-900 mb-3">What time do you usually eat breakfast?</h4>
          <div className="space-y-2">
            <button onClick={() => handleRoutineSelect('morning')} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-left hover:border-purple-500">
              🌅 Morning (8:00 AM)
            </button>
            <button onClick={() => handleRoutineSelect('afternoon')} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-bold text-slate-800 text-left hover:border-purple-500">
              ☀️ Afternoon (1:00 PM)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <h4 className="font-bold text-slate-900 mb-2">Say the name of this object aloud:</h4>
          <div className="text-5xl my-4">👓</div>
          <button onClick={handleVoiceObjectSubmit} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md flex items-center justify-center gap-2 mx-auto">
            <Mic className="w-4 h-4" /> Say "Glasses"
          </button>
        </div>
      )}
    </div>
  );
};
