import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Wind,
  Music,
  Check,
  RefreshCw,
  Award,
  Image as ImageIcon,
  Heart,
  Volume2,
  Mic,
  Play,
  Pause,
  AlertCircle,
  Clock,
  Gauge,
  Sliders,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Eye,
  Grid,
  Calendar,
  Search,
  Target,
} from 'lucide-react';
import { PatientData, Memory, FamilyMember, AssessmentResult, GameResult } from '../types';
import { useSTT } from '../hooks/useSTT';
import { t } from '../services/i18n';

interface CognitiveGamesViewProps {
  patientData: PatientData;
  onSpeak: (text: string, options?: any) => void;
  onSaveAssessment: (result: AssessmentResult) => void;
  currentSpeechRate: number;
  currentLanguage?: string;
}

export const CognitiveGamesView: React.FC<CognitiveGamesViewProps> = ({
  patientData,
  onSpeak,
  onSaveAssessment,
  currentSpeechRate,
  currentLanguage = 'en',
}) => {
  const [activeTab, setActiveTab] = useState<'memory-bank' | 'puzzles' | 'assessment' | 'relaxation'>('memory-bank');
  const [latestAssessment, setLatestAssessment] = useState<AssessmentResult | null>(
    patientData.speechSettings?.lastAssessment || null
  );

  // --- SHARED ADAPTIVE CALIBRATION ENGINE ---
  // Calculates score out of 100, determines cognitive level, and auto-tunes Kai's speech rate
  const handleGameComplete = (gameName: string, accuracy: number, timeSec: number) => {
    const rawScore = Math.round(accuracy * 100);
    const cognitiveScore = Math.max(30, Math.min(100, rawScore));

    let cognitiveLevel: 'High' | 'Mild Impairment' | 'Moderate Impairment' = 'High';
    let recommendedSpeechRate = 0.90;

    if (cognitiveScore < 55) {
      cognitiveLevel = 'Moderate Impairment';
      recommendedSpeechRate = 0.68;
    } else if (cognitiveScore < 80) {
      cognitiveLevel = 'Mild Impairment';
      recommendedSpeechRate = 0.78;
    } else {
      cognitiveLevel = 'High';
      recommendedSpeechRate = 0.90;
    }

    const result: AssessmentResult = {
      id: `game-${Date.now()}`,
      timestamp: Date.now(),
      cognitiveScore,
      cognitiveLevel,
      speechClarityScore: 90,
      speechImpairmentLevel: 'Clear',
      recommendedSpeechRate,
      notes: `${gameName} performance: ${cognitiveScore}% accuracy in ${timeSec.toFixed(1)}s. Kai speech rate calibrated to ${recommendedSpeechRate}x.`,
    };

    setLatestAssessment(result);
    onSaveAssessment(result);
  };

  // --- 1. MEMORY BANK QUIZ STATE ---
  const [memoryQuestions, setMemoryQuestions] = useState<any[]>([]);
  const [currentMemIdx, setCurrentMemIdx] = useState(0);
  const [selectedMemAnswer, setSelectedMemAnswer] = useState<number | null>(null);
  const [memScore, setMemScore] = useState(0);

  // Generate dynamic quiz from patient's memories and family members
  useEffect(() => {
    const questions: any[] = [];
    const memories = patientData.memories || [];
    const family = patientData.familyMembers || [];

    // Photo & Memory Title questions
    memories.forEach((mem) => {
      const otherMemories = memories.filter((m) => m.title !== mem.title);
      const wrongOptions = otherMemories.slice(0, 2).map((m) => m.title);
      while (wrongOptions.length < 2) {
        wrongOptions.push(wrongOptions.length === 0 ? 'Spring Picnic in the Park' : 'Family Birthday Celebration');
      }
      const options = [mem.title, ...wrongOptions].sort(() => 0.5 - Math.random());
      const correctIdx = options.indexOf(mem.title);

      questions.push({
        type: 'memory_photo',
        question: `Which memory story is associated with this photograph?`,
        image: mem.imagePlaceholderUrl,
        story: mem.descriptionForKai,
        options,
        correct: correctIdx,
        encouragement: `Wonderful job! This photo brings back the cherished memory: "${mem.title}".`,
      });
    });

    // Family Relationship questions
    family.forEach((member) => {
      const otherRelationships = ['Daughter', 'Wife', 'Son', 'Family Golden Retriever', 'Grandchild', 'Neighbor']
        .filter((r) => r !== member.relationship)
        .slice(0, 2);
      const options = [member.relationship, ...otherRelationships].sort(() => 0.5 - Math.random());
      const correctIdx = options.indexOf(member.relationship);

      questions.push({
        type: 'family',
        question: `Who is ${member.name} in your family?`,
        image: member.photoUrl,
        story: member.descriptionForKai,
        options,
        correct: correctIdx,
        encouragement: `That's right! ${member.name} is your beloved ${member.relationship}.`,
      });
    });

    setMemoryQuestions(questions.sort(() => 0.5 - Math.random()));
    setCurrentMemIdx(0);
    setSelectedMemAnswer(null);
    setMemScore(0);
  }, [patientData]);

  const handleMemAnswer = (idx: number) => {
    if (selectedMemAnswer !== null) return;
    setSelectedMemAnswer(idx);
    const q = memoryQuestions[currentMemIdx];
    if (idx === q.correct) {
      setMemScore((prev) => prev + 1);
      onSpeak(`(tone: warm) Wonderful! ${q.encouragement}`);
    } else {
      onSpeak(`(tone: gentle) That was a thoughtful guess! The right answer is ${q.options[q.correct]}.`);
    }
  };

  const nextMemQuestion = () => {
    setSelectedMemAnswer(null);
    setCurrentMemIdx((prev) => (prev + 1) % Math.max(1, memoryQuestions.length));
  };

  // --- 2. THE FIVE CORE COGNITIVE GAMES SUITE STATE ---
  const [selectedGame, setSelectedGame] = useState<'tray' | 'match' | 'changed' | 'routine' | 'object'>('tray');

  // GAME 1: MEMORY TRAY STATE
  const trayItemsBank = [
    { id: 'cup', name: 'Coffee Cup', icon: '☕' },
    { id: 'key', name: 'Brass Key', icon: '🔑' },
    { id: 'clock', name: 'Alarm Clock', icon: '⏰' },
    { id: 'radio', name: 'Vintage Radio', icon: '📻' },
    { id: 'flower', name: 'Rose Flower', icon: '🌸' },
    { id: 'book', name: 'Reading Book', icon: '📖' },
    { id: 'bottle', name: 'Water Bottle', icon: '🍼' },
    { id: 'apple', name: 'Fresh Apple', icon: '🍎' },
    { id: 'glasses', name: 'Reading Glasses', icon: '👓' },
    { id: 'teapot', name: 'Tea Kettle', icon: '🫖' },
  ];

  const [trayPhase, setTrayPhase] = useState<'memorize' | 'recall' | 'result'>('memorize');
  const [trayCountdown, setTrayCountdown] = useState(5);
  const [trayTargets, setTrayTargets] = useState<any[]>([]);
  const [trayChoices, setTrayChoices] = useState<any[]>([]);
  const [traySelected, setTraySelected] = useState<string[]>([]);
  const [trayStartTime, setTrayStartTime] = useState<number>(0);
  const [trayScore, setTrayScore] = useState<number | null>(null);

  const initMemoryTray = () => {
    const shuffled = [...trayItemsBank].sort(() => 0.5 - Math.random());
    const targets = shuffled.slice(0, 4);
    const distractors = shuffled.slice(4, 8);
    const choices = [...targets, ...distractors].sort(() => 0.5 - Math.random());

    setTrayTargets(targets);
    setTrayChoices(choices);
    setTraySelected([]);
    setTrayPhase('memorize');
    setTrayCountdown(5);
    setTrayStartTime(Date.now());
    setTrayScore(null);

    onSpeak('(tone: warm) Welcome to Memory Tray! Look closely at these 4 items on the tray. Remember them well!');
  };

  useEffect(() => {
    let timer: any;
    if (trayPhase === 'memorize' && selectedGame === 'tray') {
      if (trayCountdown > 0) {
        timer = setTimeout(() => setTrayCountdown((prev) => prev - 1), 1000);
      } else {
        setTrayPhase('recall');
        onSpeak('(tone: gentle) Time is up! Now select which 4 items were placed on the tray.');
      }
    }
    return () => clearTimeout(timer);
  }, [trayPhase, trayCountdown, selectedGame]);

  const toggleTrayItemSelect = (id: string) => {
    if (trayPhase !== 'recall') return;
    if (traySelected.includes(id)) {
      setTraySelected((prev) => prev.filter((i) => i !== id));
    } else {
      if (traySelected.length >= trayTargets.length) return;
      setTraySelected((prev) => [...prev, id]);
    }
  };

  const submitTrayRecall = () => {
    const targetIds = trayTargets.map((t) => t.id);
    const correctCount = traySelected.filter((id) => targetIds.includes(id)).length;
    const accuracy = correctCount / trayTargets.length;
    const timeTaken = (Date.now() - trayStartTime) / 1000;

    setTrayScore(correctCount);
    setTrayPhase('result');
    handleGameComplete('Memory Tray', accuracy, timeTaken);

    if (accuracy === 1) {
      onSpeak('(tone: warm) Splendid memory! You recalled all 4 items on the tray perfectly!');
    } else {
      onSpeak(`(tone: gentle) Wonderful effort! You recalled ${correctCount} out of 4 items correctly.`);
    }
  };

  // GAME 2: MEMORY MATCH STATE
  const matchIcons = ['🌸', '☀️', '🐶', '🎵', '🍃', '❤️'];
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [matchFlipsCount, setMatchFlipsCount] = useState<number>(0);
  const [matchStartTime, setMatchStartTime] = useState<number>(0);

  const initCards = () => {
    const deck = [...matchIcons, ...matchIcons]
      .sort(() => 0.5 - Math.random())
      .map((icon, id) => ({ id, icon }));
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMatchFlipsCount(0);
    setMatchStartTime(Date.now());
    onSpeak('(tone: warm) Welcome to Memory Match! Tap two cards at a time to find matching pairs.');
  };

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    setMatchFlipsCount((prev) => prev + 1);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        const newMatched = [...matched, first, second];
        setMatched(newMatched);
        setFlipped([]);
        onSpeak('(tone: warm) Splendid pair match!');

        if (newMatched.length === cards.length) {
          const timeTaken = (Date.now() - matchStartTime) / 1000;
          const accuracy = Math.max(0.3, Math.min(1.0, (cards.length / 2) / Math.max(1, matchFlipsCount)));
          handleGameComplete('Memory Match', accuracy, timeTaken);
          onSpeak('(tone: warm) All pattern pairs matched! Outstanding focus and concentration!');
        }
      } else {
        setTimeout(() => setFlipped([]), 1200);
      }
    }
  };

  // GAME 3: WHAT CHANGED? STATE
  const changeScenesBank = [
    {
      title: 'Cozy Morning Table Scene',
      initial: [
        { id: 'cup', name: 'Coffee Cup', icon: '☕' },
        { id: 'book', name: 'Reading Book', icon: '📖' },
        { id: 'flower', name: 'Rose Flower', icon: '🌸' },
        { id: 'glasses', name: 'Reading Glasses', icon: '👓' },
      ],
      changed: [
        { id: 'cup', name: 'Coffee Cup', icon: '☕' },
        { id: 'book', name: 'Reading Book', icon: '📖' },
        { id: 'apple', name: 'Fresh Apple', icon: '🍎' },
        { id: 'glasses', name: 'Reading Glasses', icon: '👓' },
      ],
      targetName: 'Rose Flower Vase',
      replacementName: 'Fresh Apple',
      options: ['Rose Flower Vase', 'Reading Book', 'Coffee Cup', 'Reading Glasses'],
      correctIdx: 0,
    },
    {
      title: 'Living Room Shelf Scene',
      initial: [
        { id: 'radio', name: 'Vintage Radio', icon: '📻' },
        { id: 'clock', name: 'Alarm Clock', icon: '⏰' },
        { id: 'candle', name: 'Scented Candle', icon: '🕯️' },
        { id: 'key', name: 'Brass Key', icon: '🔑' },
      ],
      changed: [
        { id: 'radio', name: 'Vintage Radio', icon: '📻' },
        { id: 'clock', name: 'Alarm Clock', icon: '⏰' },
        { id: 'candle', name: 'Scented Candle', icon: '🕯️' },
        { id: 'teapot', name: 'Tea Kettle', icon: '🫖' },
      ],
      targetName: 'Brass Key',
      replacementName: 'Tea Kettle',
      options: ['Brass Key', 'Vintage Radio', 'Alarm Clock', 'Scented Candle'],
      correctIdx: 0,
    },
  ];

  const [changeSceneIdx, setChangeSceneIdx] = useState(0);
  const [changePhase, setChangePhase] = useState<'observe' | 'changed' | 'result'>('observe');
  const [changeCountdown, setChangeCountdown] = useState(6);
  const [selectedChangeAnswer, setSelectedChangeAnswer] = useState<number | null>(null);
  const [changeStartTime, setChangeStartTime] = useState<number>(0);

  const initWhatChanged = () => {
    setChangeSceneIdx((prev) => (prev + 1) % changeScenesBank.length);
    setChangePhase('observe');
    setChangeCountdown(6);
    setSelectedChangeAnswer(null);
    setChangeStartTime(Date.now());
    onSpeak('(tone: gentle) Observe this scene carefully. In a few seconds, one item will change!');
  };

  useEffect(() => {
    let timer: any;
    if (changePhase === 'observe' && selectedGame === 'changed') {
      if (changeCountdown > 0) {
        timer = setTimeout(() => setChangeCountdown((prev) => prev - 1), 1000);
      } else {
        setChangePhase('changed');
        onSpeak('(tone: gentle) Look at the updated scene! Which item was changed or removed?');
      }
    }
    return () => clearTimeout(timer);
  }, [changePhase, changeCountdown, selectedGame]);

  const handleSelectChangeAnswer = (idx: number) => {
    if (selectedChangeAnswer !== null) return;
    setSelectedChangeAnswer(idx);
    setChangePhase('result');
    const scene = changeScenesBank[changeSceneIdx];
    const isCorrect = idx === scene.correctIdx;
    const accuracy = isCorrect ? 1.0 : 0.4;
    const timeTaken = (Date.now() - changeStartTime) / 1000;

    handleGameComplete('What Changed?', accuracy, timeTaken);

    if (isCorrect) {
      onSpeak(`(tone: warm) Excellent observation! The ${scene.targetName} was replaced by ${scene.replacementName}.`);
    } else {
      onSpeak(`(tone: gentle) Thoughtful guess! The item that changed was the ${scene.targetName}.`);
    }
  };

  // GAME 4: DAILY ROUTINE RECALL STATE
  const masterRoutineList = [
    { id: '1', title: 'Wake up in the morning', time: '7:00 AM', icon: '🌅' },
    { id: '2', title: 'Brush teeth & wash up', time: '7:30 AM', icon: '🪥' },
    { id: '3', title: 'Enjoy breakfast & tea', time: '8:15 AM', icon: '🍳' },
    { id: '4', title: 'Take morning medicine', time: '9:00 AM', icon: '💊' },
  ];

  const [scrambledRoutine, setScrambledRoutine] = useState<any[]>([]);
  const [selectedRoutineSeq, setSelectedRoutineSeq] = useState<string[]>([]);
  const [routinePhase, setRoutinePhase] = useState<'ordering' | 'result'>('ordering');
  const [routineStartTime, setRoutineStartTime] = useState<number>(0);
  const [routineScore, setRoutineScore] = useState<number | null>(null);

  const initDailyRoutine = () => {
    const shuffled = [...masterRoutineList].sort(() => 0.5 - Math.random());
    setScrambledRoutine(shuffled);
    setSelectedRoutineSeq([]);
    setRoutinePhase('ordering');
    setRoutineStartTime(Date.now());
    setRoutineScore(null);
    onSpeak('(tone: warm) Let us organize your daily routine activities in chronological order from morning to afternoon.');
  };

  const handleRoutineStepTap = (id: string) => {
    if (routinePhase !== 'ordering') return;
    if (selectedRoutineSeq.includes(id)) {
      setSelectedRoutineSeq((prev) => prev.filter((i) => i !== id));
    } else {
      const nextSeq = [...selectedRoutineSeq, id];
      setSelectedRoutineSeq(nextSeq);

      if (nextSeq.length === masterRoutineList.length) {
        let correctInPlace = 0;
        nextSeq.forEach((itemId, pos) => {
          if (itemId === masterRoutineList[pos].id) {
            correctInPlace++;
          }
        });

        const accuracy = correctInPlace / masterRoutineList.length;
        const timeTaken = (Date.now() - routineStartTime) / 1000;

        setRoutineScore(correctInPlace);
        setRoutinePhase('result');
        handleGameComplete('Daily Routine Recall', accuracy, timeTaken);

        if (accuracy === 1) {
          onSpeak('(tone: warm) Perfect routine sequence! Your memory for daily habits is strong and sharp.');
        } else {
          onSpeak(`(tone: gentle) Wonderful effort! You placed ${correctInPlace} out of 4 steps in perfect chronological order.`);
        }
      }
    }
  };

  // GAME 5: OBJECT RECOGNITION STATE
  const objectBank = [
    {
      id: 'radio',
      name: 'Vintage Radio',
      icon: '📻',
      image: 'https://images.unsplash.com/photo-1543599538-a6c4f6cc5c05?w=600&auto=format&fit=crop&q=80',
      options: ['Vintage Radio', 'Gramophone', 'Television'],
      correctIdx: 0,
      speechTrigger: 'radio',
    },
    {
      id: 'teapot',
      name: 'Tea Kettle',
      icon: '🫖',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      options: ['Tea Kettle', 'Frying Pan', 'Water Jug'],
      correctIdx: 0,
      speechTrigger: 'kettle',
    },
    {
      id: 'glasses',
      name: 'Reading Glasses',
      icon: '👓',
      image: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop&q=80',
      options: ['Reading Glasses', 'Sun Hat', 'Wristwatch'],
      correctIdx: 0,
      speechTrigger: 'glasses',
    },
    {
      id: 'flower',
      name: 'Lotus Flower',
      icon: '🪷',
      image: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=600&auto=format&fit=crop&q=80',
      options: ['Lotus Flower', 'Sunflower', 'Red Rose'],
      correctIdx: 0,
      speechTrigger: 'flower',
    },
  ];

  const [objIdx, setObjIdx] = useState(0);
  const [selectedObjAnswer, setSelectedObjAnswer] = useState<number | null>(null);
  const [objPhase, setObjPhase] = useState<'question' | 'result'>('question');
  const [objStartTime, setObjStartTime] = useState<number>(0);

  const initObjectRecognition = () => {
    setObjIdx((prev) => (prev + 1) % objectBank.length);
    setSelectedObjAnswer(null);
    setObjPhase('question');
    setObjStartTime(Date.now());
    onSpeak(`(tone: cheerful) Take a look at this item! Can you tell me what object this is?`);
  };

  const handleSelectObjectAnswer = (idx: number) => {
    if (selectedObjAnswer !== null) return;
    setSelectedObjAnswer(idx);
    setObjPhase('result');
    const item = objectBank[objIdx];
    const isCorrect = idx === item.correctIdx;
    const accuracy = isCorrect ? 1.0 : 0.4;
    const timeTaken = (Date.now() - objStartTime) / 1000;

    handleGameComplete('Object Recognition', accuracy, timeTaken);

    if (isCorrect) {
      onSpeak(`(tone: warm) Perfect recognition! That is indeed a ${item.name}.`);
    } else {
      onSpeak(`(tone: gentle) Good attempt! This object is a ${item.name}.`);
    }
  };

  // STT for Object Recognition Voice Input
  const { isListening: isObjListening, startListening: startObjListening, stopListening: stopObjListening, interimTranscript: objTranscript } = useSTT({
    onFinalTranscript: (final) => {
      if (selectedGame === 'object' && objPhase === 'question') {
        const item = objectBank[objIdx];
        if (final.toLowerCase().includes(item.speechTrigger.toLowerCase()) || final.toLowerCase().includes(item.name.toLowerCase())) {
          handleSelectObjectAnswer(item.correctIdx);
        } else {
          handleSelectObjectAnswer(1);
        }
      }
    },
  });

  // Switch game handler
  const handleGameSelect = (game: 'tray' | 'match' | 'changed' | 'routine' | 'object') => {
    setSelectedGame(game);
    if (game === 'tray') initMemoryTray();
    else if (game === 'match') initCards();
    else if (game === 'changed') initWhatChanged();
    else if (game === 'routine') initDailyRoutine();
    else if (game === 'object') initObjectRecognition();
  };

  // Initialize selected game on mount of puzzles tab
  useEffect(() => {
    if (activeTab === 'puzzles') {
      initMemoryTray();
    }
  }, [activeTab]);

  // --- 3. CLINICAL COGNITIVE & SPEECH ASSESSMENT BATTERY ---
  const [assessStep, setAssessStep] = useState<number>(0);
  const [assessAnswers, setAssessAnswers] = useState<{
    orientation?: number;
    recall?: number;
    naming?: number;
    speechClarityText?: string;
  }>({});

  const [speechTestText, setSpeechTestText] = useState('');
  const targetSentence = "The warm afternoon sun makes the garden roses bloom beautifully.";

  const { isListening, startListening, stopListening, interimTranscript } = useSTT({
    onFinalTranscript: (final) => {
      setSpeechTestText(final);
    },
  });

  const runAssessmentCalculation = () => {
    const { orientation = 0, recall = 0, naming = 0 } = assessAnswers;

    const rawCognitive = Math.round(((orientation + recall + naming) / 3) * 100);
    const cognitiveScore = Math.max(30, Math.min(100, rawCognitive));

    let cognitiveLevel: 'High' | 'Mild Impairment' | 'Moderate Impairment' = 'High';
    if (cognitiveScore < 60) {
      cognitiveLevel = 'Moderate Impairment';
    } else if (cognitiveScore < 82) {
      cognitiveLevel = 'Mild Impairment';
    }

    let speechClarityScore = 90;
    if (speechTestText) {
      const wordsTarget = targetSentence.toLowerCase().split(' ');
      const wordsSaid = speechTestText.toLowerCase().split(' ');
      const matchedWords = wordsTarget.filter((w) => wordsSaid.includes(w)).length;
      speechClarityScore = Math.round((matchedWords / wordsTarget.length) * 100);
    }

    let speechImpairmentLevel: 'Clear' | 'Mild Hesitation' | 'Moderate Impairment' = 'Clear';
    if (speechClarityScore < 55) {
      speechImpairmentLevel = 'Moderate Impairment';
    } else if (speechClarityScore < 80) {
      speechImpairmentLevel = 'Mild Hesitation';
    }

    let recommendedSpeechRate = 0.90;
    if (cognitiveLevel === 'Moderate Impairment' || speechImpairmentLevel === 'Moderate Impairment') {
      recommendedSpeechRate = 0.65;
    } else if (cognitiveLevel === 'Mild Impairment' || speechImpairmentLevel === 'Mild Hesitation') {
      recommendedSpeechRate = 0.75;
    }

    const result: AssessmentResult = {
      id: `asm-${Date.now()}`,
      timestamp: Date.now(),
      cognitiveScore,
      cognitiveLevel,
      speechClarityScore,
      speechImpairmentLevel,
      recommendedSpeechRate,
      notes: `Screening completed. Cognitive Score: ${cognitiveScore} (${cognitiveLevel}), Speech Clarity: ${speechClarityScore}%. Recommended Kai speed: ${recommendedSpeechRate}x.`,
    };

    setLatestAssessment(result);
    onSaveAssessment(result);
  };

  // --- 4. RELAXATION STATE ---
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
    let interval: any;
    if (isBreathing) {
      interval = setInterval(() => {
        setBreathPhase((prev) => (prev === 'Inhale' ? 'Hold' : prev === 'Hold' ? 'Exhale' : 'Inhale'));
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isBreathing]);

  return (
    <div id="page-cognitive-games" className="flex flex-col h-full bg-stone-50 pb-20 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-white border-b border-stone-200 p-5 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <span>{t('gamesMenuTitle', currentLanguage)}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">{t('gamesMenuSubtitle', currentLanguage)}</p>
        </div>

        {/* Current Dynamic Voice Speed & Cognitive Level Badge */}
        <div className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
          <Gauge className="w-4 h-4 text-purple-700" />
          <div className="text-right">
            <span className="text-[10px] text-purple-600 block uppercase font-bold tracking-wider">{t('kaiSpeed', currentLanguage)}</span>
            <span className="text-xs font-black text-purple-900">{currentSpeechRate.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="p-5 max-w-2xl mx-auto w-full space-y-5">
        <div className="grid grid-cols-4 bg-stone-200 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('memory-bank')}
            className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
              activeTab === 'memory-bank' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 mb-0.5" />
            <span>{t('memoryQuiz', currentLanguage)}</span>
          </button>

          <button
            onClick={() => setActiveTab('puzzles')}
            className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
              activeTab === 'puzzles' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-4 h-4 mb-0.5" />
            <span>{t('mindPuzzles', currentLanguage)}</span>
          </button>

          <button
            onClick={() => setActiveTab('assessment')}
            className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
              activeTab === 'assessment' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 mb-0.5" />
            <span>{t('voiceTest', currentLanguage)}</span>
          </button>

          <button
            onClick={() => setActiveTab('relaxation')}
            className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
              activeTab === 'relaxation' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="w-4 h-4 mb-0.5" />
            <span>{t('calmMusic', currentLanguage)}</span>
          </button>
        </div>

        {/* TAB 1: DYNAMIC MEMORY BANK QUIZ */}
        {activeTab === 'memory-bank' && (
          <div className="space-y-4">
            {memoryQuestions.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl text-center border border-stone-200">
                <p className="text-slate-500 font-semibold text-sm">No memory items found in Memory Bank.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <span className="text-xs font-bold text-rose-700 uppercase bg-rose-100 px-3 py-1 rounded-full">
                    Memory Question {currentMemIdx + 1} of {memoryQuestions.length}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700 bg-stone-100 px-3 py-1 rounded-full">
                    Score: {memScore}
                  </span>
                </div>

                <div className="space-y-3">
                  {memoryQuestions[currentMemIdx].image && (
                    <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                      <img
                        src={memoryQuestions[currentMemIdx].image}
                        alt="Memory Quiz visual"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                  )}

                  <h3 className="text-lg font-black text-slate-800 leading-snug">
                    {memoryQuestions[currentMemIdx].question}
                  </h3>
                </div>

                <div className="space-y-2.5 pt-2">
                  {memoryQuestions[currentMemIdx].options.map((opt: string, idx: number) => {
                    const isSelected = selectedMemAnswer === idx;
                    const isCorrect = idx === memoryQuestions[currentMemIdx].correct;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleMemAnswer(idx)}
                        disabled={selectedMemAnswer !== null}
                        className={`w-full p-4 rounded-2xl border text-left font-bold text-sm transition flex items-center justify-between ${
                          isSelected
                            ? isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm'
                              : 'bg-amber-50 border-amber-300 text-amber-900'
                            : selectedMemAnswer !== null && isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-stone-50 border-stone-200 text-slate-800 hover:bg-stone-100'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {selectedMemAnswer !== null && (
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => onSpeak(`(tone: warm) ${memoryQuestions[currentMemIdx].story}`)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Hear Story Details</span>
                    </button>

                    <button
                      onClick={nextMemQuestion}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow transition flex items-center space-x-1.5"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MIND PUZZLES — THE FIVE CORE COGNITIVE GAMES */}
        {activeTab === 'puzzles' && (
          <div className="space-y-5">
            {/* 5-Game Selection Menu */}
            <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between space-x-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'tray', label: 'Memory Tray', icon: '☕' },
                { id: 'match', label: 'Memory Match', icon: '🃏' },
                { id: 'changed', label: 'What Changed?', icon: '🔍' },
                { id: 'routine', label: 'Daily Routine', icon: '📅' },
                { id: 'object', label: 'Object Recognition', icon: '📻' },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGameSelect(g.id as any)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 ${
                    selectedGame === g.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                  }`}
                >
                  <span>{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>

            {/* GAME 1 — MEMORY TRAY */}
            {selectedGame === 'tray' && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                      <span>☕</span>
                      <span>Memory Tray (Visual Recall)</span>
                    </h2>
                    <p className="text-xs text-slate-500">Memorize the 4 tray items, then identify them when hidden</p>
                  </div>
                  <button
                    onClick={initMemoryTray}
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-stone-100"
                    title="Restart Game"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Memorize Phase */}
                {trayPhase === 'memorize' && (
                  <div className="space-y-4 text-center animate-fade-in">
                    <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full font-bold text-xs">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Memorize items: {trayCountdown}s remaining</span>
                    </div>

                    <div className="p-6 bg-gradient-to-b from-amber-50 to-stone-100 border-2 border-amber-200 rounded-3xl shadow-inner grid grid-cols-4 gap-4 max-w-md mx-auto">
                      {trayTargets.map((item) => (
                        <div key={item.id} className="p-4 bg-white rounded-2xl shadow border border-amber-100 text-center space-y-1 transform hover:scale-105 transition">
                          <span className="text-4xl block">{item.icon}</span>
                          <span className="text-[11px] font-bold text-slate-800 block">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recall Phase */}
                {trayPhase === 'recall' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="text-center">
                      <p className="text-sm font-extrabold text-slate-800">
                        Select the 4 items that were on the tray ({traySelected.length}/4 chosen):
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                      {trayChoices.map((item) => {
                        const isSelected = traySelected.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleTrayItemSelect(item.id)}
                            className={`p-3 rounded-2xl text-center border font-bold text-xs transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-95'
                                : 'bg-stone-50 border-stone-200 text-slate-800 hover:bg-stone-100'
                            }`}
                          >
                            <span className="text-3xl block mb-1">{item.icon}</span>
                            <span className="truncate block text-[10px]">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {traySelected.length === trayTargets.length && (
                      <button
                        onClick={submitTrayRecall}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs shadow-md transition"
                      >
                        Check Memory Recall
                      </button>
                    )}
                  </div>
                )}

                {/* Result Phase */}
                {trayPhase === 'result' && trayScore !== null && (
                  <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-3xl text-center space-y-3 animate-fade-in">
                    <p className="font-black text-emerald-900 text-base">🎉 Tray Recall Complete!</p>
                    <p className="text-xs text-emerald-800 font-bold">
                      You remembered {trayScore} out of 4 items correctly!
                    </p>
                    <button
                      onClick={initMemoryTray}
                      className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow hover:bg-emerald-700 transition"
                    >
                      Play Another Tray Round
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* GAME 2 — MEMORY MATCH */}
            {selectedGame === 'match' && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                      <span>🃏</span>
                      <span>Memory Match (Pairs Grid)</span>
                    </h2>
                    <p className="text-xs text-slate-500">Tap cards to uncover matching pairs and train concentration</p>
                  </div>
                  <button
                    onClick={initCards}
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-stone-100"
                    title="Restart Game"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                  {cards.map((card, idx) => {
                    const isFlipped = flipped.includes(idx) || matched.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleCardClick(idx)}
                        className={`h-20 rounded-2xl text-2xl flex items-center justify-center font-bold transition-all duration-300 shadow-sm ${
                          isFlipped
                            ? 'bg-blue-50 border-2 border-blue-400 rotate-0'
                            : 'bg-slate-800 border-2 border-slate-700 text-transparent hover:bg-slate-700'
                        }`}
                      >
                        {isFlipped ? card.icon : '❓'}
                      </button>
                    );
                  })}
                </div>

                {matched.length === cards.length && cards.length > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2">
                    <p className="font-black text-emerald-900 text-base">🎉 All Pattern Pairs Matched!</p>
                    <p className="text-xs text-emerald-700">Excellent spatial memory and concentration.</p>
                    <button
                      onClick={initCards}
                      className="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow hover:bg-emerald-700"
                    >
                      Play Another Round
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* GAME 3 — WHAT CHANGED? */}
            {selectedGame === 'changed' && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                      <span>🔍</span>
                      <span>What Changed? (Attention Spotter)</span>
                    </h2>
                    <p className="text-xs text-slate-500">Observe scene changes and spot what disappeared or changed</p>
                  </div>
                  <button
                    onClick={initWhatChanged}
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-stone-100"
                    title="Next Scene"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Stage 1: Observe Scene */}
                {changePhase === 'observe' && (
                  <div className="space-y-4 text-center animate-fade-in">
                    <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full font-bold text-xs">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Observe Original Scene: {changeCountdown}s</span>
                    </div>

                    <div className="p-6 bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-xl grid grid-cols-4 gap-4 max-w-md mx-auto">
                      {changeScenesBank[changeSceneIdx].initial.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-800 rounded-2xl text-center space-y-1 border border-slate-700">
                          <span className="text-4xl block">{item.icon}</span>
                          <span className="text-[10px] font-bold text-slate-200 block">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage 2: Changed Scene & Question */}
                {(changePhase === 'changed' || changePhase === 'result') && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full inline-block">
                        Updated Scene
                      </p>
                    </div>

                    <div className="p-6 bg-slate-900 border-4 border-indigo-600 rounded-3xl shadow-xl grid grid-cols-4 gap-4 max-w-md mx-auto">
                      {changeScenesBank[changeSceneIdx].changed.map((item) => (
                        <div key={item.id} className="p-4 bg-slate-800 rounded-2xl text-center space-y-1 border border-indigo-500/50">
                          <span className="text-4xl block">{item.icon}</span>
                          <span className="text-[10px] font-bold text-slate-200 block">{item.name}</span>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-800 text-center">
                      Which item was changed or replaced from the original scene?
                    </h3>

                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                      {changeScenesBank[changeSceneIdx].options.map((opt, idx) => {
                        const isSelected = selectedChangeAnswer === idx;
                        const isCorrect = idx === changeScenesBank[changeSceneIdx].correctIdx;

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectChangeAnswer(idx)}
                            disabled={selectedChangeAnswer !== null}
                            className={`p-4 rounded-2xl border text-left font-bold text-xs transition ${
                              isSelected
                                ? isCorrect
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow'
                                  : 'bg-amber-50 border-amber-300 text-amber-900'
                                : selectedChangeAnswer !== null && isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                : 'bg-stone-50 border-stone-200 text-slate-800 hover:bg-stone-100'
                            }`}
                          >
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedChangeAnswer !== null && (
                      <button
                        onClick={initWhatChanged}
                        className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs shadow transition mt-2"
                      >
                        Try Next Scene Challenge
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* GAME 4 — DAILY ROUTINE RECALL */}
            {selectedGame === 'routine' && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                      <span>📅</span>
                      <span>Daily Routine Recall</span>
                    </h2>
                    <p className="text-xs text-slate-500">Arrange daily steps in chronological order from morning to afternoon</p>
                  </div>
                  <button
                    onClick={initDailyRoutine}
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-stone-100"
                    title="Restart Routine"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 max-w-md mx-auto">
                  <p className="text-xs font-bold text-slate-700">
                    Tap the cards below in correct chronological order:
                  </p>

                  <div className="space-y-2">
                    {scrambledRoutine.map((item) => {
                      const orderIndex = selectedRoutineSeq.indexOf(item.id);
                      const isPicked = orderIndex !== -1;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleRoutineStepTap(item.id)}
                          className={`w-full p-4 rounded-2xl border flex items-center justify-between font-bold text-xs transition ${
                            isPicked
                              ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-slate-800 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{item.icon}</span>
                            <div className="text-left">
                              <span className="block font-bold text-sm">{item.title}</span>
                              <span className="block text-[10px] text-slate-500">{item.time}</span>
                            </div>
                          </div>

                          {isPicked && (
                            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs">
                              {orderIndex + 1}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {routinePhase === 'result' && routineScore !== null && (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2 animate-fade-in mt-3">
                      <p className="font-black text-emerald-900 text-base">🎉 Routine Recall Complete!</p>
                      <p className="text-xs text-emerald-800 font-bold">
                        You placed {routineScore} out of 4 steps in perfect chronological order!
                      </p>
                      <button
                        onClick={initDailyRoutine}
                        className="bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow hover:bg-emerald-700"
                      >
                        Try Another Routine Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GAME 5 — OBJECT RECOGNITION */}
            {selectedGame === 'object' && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
                <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                      <span>📻</span>
                      <span>Object Recognition (Visual & Voice)</span>
                    </h2>
                    <p className="text-xs text-slate-500">Identify the familiar object by tapping choices or speaking answer</p>
                  </div>
                  <button
                    onClick={initObjectRecognition}
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-stone-100"
                    title="Next Item"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 max-w-md mx-auto text-center">
                  <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100 border border-stone-200 relative shadow-inner">
                    <img
                      src={objectBank[objIdx].image}
                      alt={objectBank[objIdx].name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-2xl shadow">
                      {objectBank[objIdx].icon}
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-800">What object is shown in this picture?</h3>

                  {/* Voice Input Option */}
                  <div className="pt-1 pb-2">
                    <button
                      onClick={isObjListening ? stopObjListening : startObjListening}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-bold shadow transition inline-flex items-center space-x-2 ${
                        isObjListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      <span>{isObjListening ? 'Listening... Speak object name' : 'Speak Answer via Microphone'}</span>
                    </button>

                    {objTranscript && (
                      <p className="text-xs text-slate-600 bg-purple-50 p-2 rounded-xl font-mono mt-2">
                        Speech Heard: "{objTranscript}"
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {objectBank[objIdx].options.map((opt, idx) => {
                      const isSelected = selectedObjAnswer === idx;
                      const isCorrect = idx === objectBank[objIdx].correctIdx;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectObjectAnswer(idx)}
                          disabled={selectedObjAnswer !== null}
                          className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition ${
                            isSelected
                              ? isCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow'
                                : 'bg-amber-50 border-amber-300 text-amber-900'
                              : selectedObjAnswer !== null && isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-stone-50 border-stone-200 text-slate-800 hover:bg-stone-100'
                          }`}
                        >
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedObjAnswer !== null && (
                    <button
                      onClick={initObjectRecognition}
                      className="w-full bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs shadow transition mt-2"
                    >
                      Next Recognition Item
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLINICAL COGNITIVE & SPEECH ASSESSMENT BATTERY */}
        {activeTab === 'assessment' && (
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-lg font-black text-slate-800 flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <span>Cognitive Level & Speech Impairment Screening</span>
              </h2>
              <p className="text-xs text-slate-500">
                Research-backed clinical battery to measure recall, clarity, and automatically adapt Kai's voice speed.
              </p>
            </div>

            {assessStep === 0 && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-800">Quick 3-Minute Assessment</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Includes general orientation questions, short memory recall, and a spoken sentence repetition test.
                  Kai's voice rate will calibrate automatically based on your results.
                </p>

                {latestAssessment && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-left space-y-1 text-xs">
                    <p className="font-bold text-purple-900">Latest Recorded Assessment:</p>
                    <p className="text-purple-800">
                      Cognitive Level: <span className="font-extrabold">{latestAssessment.cognitiveLevel} ({latestAssessment.cognitiveScore}/100)</span>
                    </p>
                    <p className="text-purple-800">
                      Speech Impairment: <span className="font-extrabold">{latestAssessment.speechImpairmentLevel}</span>
                    </p>
                    <p className="text-purple-800">
                      Auto-Tuned Speed: <span className="font-extrabold">{latestAssessment.recommendedSpeechRate}x</span>
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setAssessStep(1)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition text-sm"
                >
                  Start Assessment Battery
                </button>
              </div>
            )}

            {/* STEP 1: Orientation */}
            {assessStep === 1 && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  Step 1 of 3: General Orientation
                </span>
                <h3 className="text-base font-black text-slate-800">What season are we enjoying right now?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Summer', 'Spring', 'Autumn / Fall', 'Winter'].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setAssessAnswers((prev) => ({ ...prev, orientation: i === 0 ? 1 : 0.6 }));
                        setAssessStep(2);
                      }}
                      className="p-3.5 bg-stone-50 hover:bg-purple-50 border border-stone-200 rounded-xl font-bold text-sm text-slate-800 transition"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Memory Recall */}
            {assessStep === 2 && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  Step 2 of 3: Visual & Word Recall
                </span>
                <h3 className="text-base font-black text-slate-800">
                  Remember these 3 key words: <span className="text-purple-700 font-extrabold">ROSE, SUNSHINE, BUDDY</span>.
                </h3>
                <p className="text-xs text-slate-500">Which of the following items was included in the 3 key words?</p>
                <div className="grid grid-cols-2 gap-3">
                  {['BUDDY (Golden Retriever)', 'MARBLE (Toy)', 'ANCHOR (Ship)', 'COMPASS (Map)'].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setAssessAnswers((prev) => ({ ...prev, recall: i === 0 ? 1 : 0.4 }));
                        setAssessStep(3);
                      }}
                      className="p-3.5 bg-stone-50 hover:bg-purple-50 border border-stone-200 rounded-xl font-bold text-sm text-slate-800 transition"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Speech Impairment & Clarity Repetition */}
            {assessStep === 3 && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  Step 3 of 3: Speech Impairment & Clarity Screen
                </span>
                <h3 className="text-base font-black text-slate-800">
                  Please speak the following sentence out loud:
                </h3>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-purple-900 font-bold text-sm leading-relaxed text-center">
                  "{targetSentence}"
                </div>

                <div className="text-center space-y-3 pt-2">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`px-6 py-3 rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 mx-auto ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isListening ? 'Listening to your speech...' : 'Tap to Start Speech Recitation'}</span>
                  </button>

                  {(interimTranscript || speechTestText) && (
                    <p className="text-xs text-slate-600 bg-stone-100 p-3 rounded-xl font-mono">
                      Recorded Speech: "{speechTestText || interimTranscript}"
                    </p>
                  )}
                </div>

                <button
                  onClick={runAssessmentCalculation}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-2xl text-xs shadow transition mt-3"
                >
                  Complete Assessment & Calculate Voice Speed
                </button>
              </div>
            )}

            {/* STEP 4: Results & Speed Calibration Display */}
            {assessStep === 4 && latestAssessment && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center border-b border-purple-100 pb-3">
                    <span className="font-extrabold text-purple-900 text-base">Assessment Results</span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-200 px-3 py-1 rounded-full">
                      Auto-Calibrated
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center pt-1">
                    <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-purple-100">
                      <p className="text-[11px] text-slate-500 font-bold uppercase">Cognitive Score</p>
                      <p className="text-xl font-black text-purple-900">{latestAssessment.cognitiveScore}/100</p>
                      <span className="text-[10px] font-bold text-purple-700">{latestAssessment.cognitiveLevel}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-purple-100">
                      <p className="text-[11px] text-slate-500 font-bold uppercase">Speech Clarity</p>
                      <p className="text-xl font-black text-purple-900">{latestAssessment.speechClarityScore}%</p>
                      <span className="text-[10px] font-bold text-purple-700">{latestAssessment.speechImpairmentLevel}</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-purple-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Kai Voice Speed Calibrated</p>
                      <p className="text-[11px] text-slate-500">Optimized cadence for effortless listening</p>
                    </div>
                    <span className="text-base font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-xl">
                      {latestAssessment.recommendedSpeechRate}x
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      onSpeak(
                        `(tone: warm) Testing Kai voice speed at ${latestAssessment.recommendedSpeechRate}x. Everything feels peaceful and calm.`
                      )
                    }
                    className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-700 transition shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Listen to Kai's Adjusted Voice</span>
                  </button>
                </div>

                <button
                  onClick={() => setAssessStep(0)}
                  className="w-full bg-stone-100 text-slate-700 font-bold py-2.5 rounded-xl text-xs hover:bg-stone-200 transition"
                >
                  Return to Assessment Overview
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CALM MUSIC & BREATHING */}
        {activeTab === 'relaxation' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm text-center flex flex-col items-center">
              <h2 className="text-lg font-black text-slate-800">Mindful Relaxation Breath</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Follow the expanding circle to slow down your breathing and relax your body.
              </p>

              <div className="my-8 relative flex items-center justify-center">
                <div
                  className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-1000 ${
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
                    <p className="text-xl font-black text-emerald-800 tracking-tight">
                      {isBreathing ? breathPhase : 'Ready'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      {isBreathing
                        ? breathPhase === 'Inhale'
                          ? 'Breathe in slowly...'
                          : breathPhase === 'Hold'
                          ? 'Gently hold...'
                          : 'Breathe out softly...'
                        : 'Tap start below'}
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
                className={`px-6 py-3 rounded-2xl font-bold text-xs shadow-md transition active:scale-95 flex items-center space-x-2 ${
                  isBreathing ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isBreathing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isBreathing ? 'Pause Breathing' : 'Start Guided Breathing'}</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-3">
              <h3 className="text-base font-black text-slate-800">Calming Soundscapes</h3>
              {[
                { title: 'Morning Forest Birds', desc: 'Soft birdsong and pine breeze', prompt: '(tone: warm) Playing the gentle sounds of morning birds in the pine forest.' },
                { title: 'Peaceful Acoustic Guitar', desc: 'Warm 1970s acoustic chords', prompt: '(tone: gentle) Playing peaceful acoustic guitar melodies.' },
                { title: 'Ocean Waves at Sunset', desc: 'Rhythmic, relaxing coastal tide', prompt: '(tone: reassuring) Close your eyes and listen to the rhythmic ocean waves at sunset.' },
              ].map((song, i) => (
                <div key={i} className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{song.title}</p>
                      <p className="text-[11px] text-slate-500">{song.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSpeak(song.prompt)}
                    className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
