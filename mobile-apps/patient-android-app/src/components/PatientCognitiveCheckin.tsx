import React, { useState } from 'react';
import { BrainCircuit, Award, Check, Sparkles, RefreshCw } from 'lucide-react';

interface PatientCognitiveCheckinProps {
  onScoreSubmit: (gameId: string, title: string, score: number) => void;
}

export const PatientCognitiveCheckin: React.FC<PatientCognitiveCheckinProps> = ({
  onScoreSubmit,
}) => {
  const [activeGame, setActiveGame] = useState<'match' | 'routine' | 'none'>('none');
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [routineAnswer, setRoutineAnswer] = useState<string | null>(null);
  const [gameFinished, setGameFinished] = useState(false);

  // Memory Match cards
  const cards = [
    { id: 1, symbol: '🍎', label: 'Apple' },
    { id: 2, symbol: '🌸', label: 'Flower' },
    { id: 3, symbol: '🍎', label: 'Apple' },
    { id: 4, symbol: '🌸', label: 'Flower' }
  ];

  const handleCardClick = (id: number) => {
    if (selectedCards.includes(id) || selectedCards.length >= 2) return;
    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const c1 = cards.find(c => c.id === newSelected[0]);
      const c2 = cards.find(c => c.id === newSelected[1]);
      if (c1 && c2 && c1.symbol === c2.symbol) {
        setTimeout(() => {
          setGameFinished(true);
          onScoreSubmit('mem_match', 'Memory Match', 100);
        }, 600);
      } else {
        setTimeout(() => {
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const handleRoutineSelect = (answer: string) => {
    setRoutineAnswer(answer);
    setGameFinished(true);
    const score = answer === 'morning' ? 100 : 60;
    onScoreSubmit('routine_recall', 'Daily Routine Recall', score);
  };

  const resetGame = () => {
    setActiveGame('none');
    setSelectedCards([]);
    setRoutineAnswer(null);
    setGameFinished(false);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-lg">
          <BrainCircuit className="w-6 h-6 text-indigo-400" />
          <span>Brain Fitness Activities</span>
        </div>
        {activeGame !== 'none' && (
          <button
            onClick={resetGame}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Back
          </button>
        )}
      </div>

      {activeGame === 'none' ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveGame('match')}
            className="bg-indigo-950/70 border border-indigo-500/40 hover:bg-indigo-900/80 active:scale-95 p-4 rounded-2xl text-left flex flex-col justify-between min-h-[120px] shadow-md transition-all"
          >
            <span className="text-3xl">🧩</span>
            <div>
              <h4 className="font-bold text-white text-base">Memory Match</h4>
              <p className="text-xs text-indigo-300 mt-0.5">Find matching pairs</p>
            </div>
          </button>

          <button
            onClick={() => setActiveGame('routine')}
            className="bg-purple-950/70 border border-purple-500/40 hover:bg-purple-900/80 active:scale-95 p-4 rounded-2xl text-left flex flex-col justify-between min-h-[120px] shadow-md transition-all"
          >
            <span className="text-3xl">🌅</span>
            <div>
              <h4 className="font-bold text-white text-base">Routine Recall</h4>
              <p className="text-xs text-purple-300 mt-0.5">Daily time awareness</p>
            </div>
          </button>
        </div>
      ) : activeGame === 'match' ? (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 text-center">
          <h4 className="font-bold text-white mb-3">Tap two matching symbols:</h4>
          {gameFinished ? (
            <div className="py-4 space-y-2">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
              <p className="text-lg font-bold text-emerald-400">Great Job! Score: 100/100</p>
              <p className="text-xs text-slate-300">Results saved for Sarah's report.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              {cards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCardClick(c.id)}
                  className={`h-24 rounded-2xl text-4xl flex items-center justify-center border-2 transition-all ${
                    selectedCards.includes(c.id)
                      ? 'bg-indigo-600 border-indigo-400 text-white scale-105'
                      : 'bg-slate-800 border-slate-700 text-transparent hover:border-slate-500'
                  }`}
                >
                  {selectedCards.includes(c.id) ? c.symbol : '❓'}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 text-center">
          <h4 className="font-bold text-white mb-3">What time of day is it right now?</h4>
          {gameFinished ? (
            <div className="py-4 space-y-2">
              <Award className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
              <p className="text-lg font-bold text-emerald-400">Activity Saved! Perfect!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                onClick={() => handleRoutineSelect('morning')}
                className="w-full bg-slate-800 hover:bg-purple-900/60 border border-slate-700 p-3 rounded-xl font-bold text-slate-100 text-base text-left flex items-center gap-3"
              >
                <span>🌅</span> Morning (Breakfast time)
              </button>
              <button
                onClick={() => handleRoutineSelect('afternoon')}
                className="w-full bg-slate-800 hover:bg-purple-900/60 border border-slate-700 p-3 rounded-xl font-bold text-slate-100 text-base text-left flex items-center gap-3"
              >
                <span>☀️</span> Afternoon (Lunch time)
              </button>
              <button
                onClick={() => handleRoutineSelect('night')}
                className="w-full bg-slate-800 hover:bg-purple-900/60 border border-slate-700 p-3 rounded-xl font-bold text-slate-100 text-base text-left flex items-center gap-3"
              >
                <span>🌙</span> Night (Bed time)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
