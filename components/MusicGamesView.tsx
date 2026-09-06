import React, { useState, useEffect } from 'react';
import { Music, Wind, Brain, Play, Pause, Volume2, Sparkles, Check, RefreshCw } from 'lucide-react';
import { PatientData } from '../types';

interface MusicGamesViewProps {
  patientData: PatientData;
  onSpeak: (text: string) => void;
}

export const MusicGamesView: React.FC<MusicGamesViewProps> = ({ patientData, onSpeak }) => {
  const [activeTab, setActiveTab] = useState<'music' | 'breathing' | 'trivia'>('breathing');

  // Breathing state
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Trivia state
  const [currentTriviaIdx, setCurrentTriviaIdx] = useState(0);
  const [selectedTriviaAnswer, setSelectedTriviaAnswer] = useState<number | null>(null);

  const triviaQuestions = [
    {
      question: 'Which flower is known for its fragrant scent and colorful garden petals in spring?',
      options: ['Rose', 'Pinecone', 'Seaweed'],
      correct: 0,
      encouragement: 'That is wonderful! Roses bring so much color to sunny garden walks.',
    },
    {
      question: 'What is the loyal golden dog in the family named?',
      options: ['Buddy', 'Max', 'Rocky'],
      correct: 0,
      encouragement: 'Exactly right! Buddy loves gentle head pats and afternoon naps.',
    },
    {
      question: 'In which season do we enjoy warm sunshine, picnics, and ripe garden tomatoes?',
      options: ['Summer', 'Winter', 'Blizzard'],
      correct: 0,
      encouragement: 'Spot on! Summer sunshine is warm and refreshing.',
    },
  ];

  // Guided breathing loop
  useEffect(() => {
    let interval: any;
    if (isBreathing) {
      const phases: ('Inhale' | 'Hold' | 'Exhale')[] = ['Inhale', 'Hold', 'Exhale'];
      let phaseIdx = 0;
      interval = setInterval(() => {
        phaseIdx = (phaseIdx + 1) % 3;
        setBreathPhase(phases[phaseIdx]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isBreathing]);

  const handleTriviaOption = (optionIdx: number) => {
    setSelectedTriviaAnswer(optionIdx);
    const q = triviaQuestions[currentTriviaIdx];
    if (optionIdx === q.correct) {
      onSpeak(`(tone: warm) Perfect! ${q.encouragement}`);
    } else {
      onSpeak(`(tone: gentle) That was a thoughtful guess! The right answer is ${q.options[q.correct]}.`);
    }
  };

  const nextQuestion = () => {
    setSelectedTriviaAnswer(null);
    setCurrentTriviaIdx((prev) => (prev + 1) % triviaQuestions.length);
  };

  return (
    <div id="page-music-games" className="flex flex-col h-full bg-stone-50 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 p-6 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Calm Mind & Activities</h1>
          <p className="text-sm text-slate-500 font-medium">Gentle relaxation, music, and uplifting memory games</p>
        </div>
      </div>

      {/* Segmented control tabs */}
      <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
        <div className="flex bg-stone-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('breathing')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'breathing' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>Calm Breathing</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'music' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Soothing Melodies</span>
          </button>

          <button
            onClick={() => setActiveTab('trivia')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'trivia' ? 'bg-white text-purple-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Memory Game</span>
          </button>
        </div>

        {/* Breathing View */}
        {activeTab === 'breathing' && (
          <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-black text-slate-800">Mindful Relaxation Breath</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Follow the expanding circle to slow down your breathing and relax your body.
            </p>

            <div className="my-10 relative flex items-center justify-center">
              <div
                className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 ${
                  isBreathing
                    ? breathPhase === 'Inhale'
                      ? 'scale-125 bg-emerald-100 ring-8 ring-emerald-300'
                      : breathPhase === 'Hold'
                      ? 'scale-115 bg-teal-100 ring-8 ring-teal-300'
                      : 'scale-90 bg-stone-100 ring-4 ring-stone-300'
                    : 'bg-emerald-50 ring-4 ring-emerald-100'
                }`}
              >
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-800 tracking-tight">
                    {isBreathing ? breathPhase : 'Ready'}
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    {isBreathing ? (breathPhase === 'Inhale' ? 'Breathe in slowly...' : breathPhase === 'Hold' ? 'Gently hold...' : 'Breathe out softly...') : 'Tap start below'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const next = !isBreathing;
                setIsBreathing(next);
                if (next) {
                  onSpeak(
                    '(tone: gentle) Let us breathe together calmly. (pause) Take a slow, peaceful breath in... (pause) and gently release.'
                  );
                }
              }}
              className={`px-8 py-3.5 rounded-2xl font-bold shadow-md transition active:scale-95 flex items-center space-x-2 ${
                isBreathing ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isBreathing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isBreathing ? 'Pause Breathing' : 'Start Breathing Exercise'}</span>
            </button>
          </div>
        )}

        {/* Music View */}
        {activeTab === 'music' && (
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <h2 className="text-xl font-black text-slate-800">Calming Soundscapes</h2>
            <p className="text-sm text-slate-500">Gentle acoustic instruments and nature atmospheres.</p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Morning Forest Birds', desc: 'Soft birdsong and pine breeze', prompt: '(tone: warm) Playing the gentle sounds of morning birds in the pine forest. Relax and listen.' },
                { title: 'Peaceful Acoustic Guitar', desc: 'Warm 1970s acoustic chords', prompt: '(tone: gentle) Playing peaceful acoustic guitar melodies from the good old days.' },
                { title: 'Ocean Waves at Sunset', desc: 'Rhythmic, relaxing coastal tide', prompt: '(tone: reassuring) Close your eyes and listen to the rhythmic ocean waves at sunset.' },
              ].map((song, i) => (
                <div key={i} className="p-4 bg-stone-50 hover:bg-blue-50 border border-stone-200 rounded-2xl flex items-center justify-between transition">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-600 text-white rounded-xl">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{song.title}</p>
                      <p className="text-xs text-slate-500">{song.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSpeak(song.prompt)}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trivia Memory View */}
        {activeTab === 'trivia' && (
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 uppercase bg-purple-100 px-3 py-1 rounded-full">
                Question {currentTriviaIdx + 1} of {triviaQuestions.length}
              </span>
              <button
                onClick={nextQuestion}
                className="flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Next Question</span>
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-800 leading-snug">
              {triviaQuestions[currentTriviaIdx].question}
            </h3>

            <div className="space-y-2.5">
              {triviaQuestions[currentTriviaIdx].options.map((opt, idx) => {
                const isSelected = selectedTriviaAnswer === idx;
                const isCorrect = idx === triviaQuestions[currentTriviaIdx].correct;

                return (
                  <button
                    key={idx}
                    onClick={() => handleTriviaOption(idx)}
                    className={`w-full p-4 rounded-2xl border text-left font-bold text-sm transition flex items-center justify-between ${
                      isSelected
                        ? isCorrect
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-stone-50 border-stone-200 text-slate-800 hover:bg-stone-100 hover:border-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && isCorrect && <Check className="w-5 h-5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
