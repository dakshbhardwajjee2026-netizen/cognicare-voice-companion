import React, { useState } from 'react';
import { Phone, PhoneOff, Mic, Play, CheckCircle2, User, Heart, Sparkles } from 'lucide-react';
import { FamilyMember, VoiceNote, PatientData } from '../types';
import { t } from '../services/i18n';

interface CallFamilyViewProps {
  patientData: PatientData;
  onSpeak: (text: string) => void;
  onMarkVoiceNotePlayed: (noteId: string) => void;
  currentLanguage?: string;
}

export const CallFamilyView: React.FC<CallFamilyViewProps> = ({
  patientData,
  onSpeak,
  onMarkVoiceNotePlayed,
  currentLanguage = 'en',
}) => {
  const [activeCallWith, setActiveCallWith] = useState<FamilyMember | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const familyMembers = patientData.familyMembers || [];
  const voiceNotes = patientData.voiceNotes || [];
  const patientName = patientData.profile?.name || 'David';

  React.useEffect(() => {
    let timer: any;
    if (activeCallWith) {
      setCallDuration(0);
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeCallWith]);

  const handleStartCall = (member: FamilyMember) => {
    setActiveCallWith(member);
    onSpeak(
      `(tone: warm) Connecting you with your beloved ${member.relationship}, ${member.name}. (pause) Hello ${patientName}! It is so wonderful to hear your voice.`
    );
  };

  const handleEndCall = () => {
    if (activeCallWith) {
      onSpeak(`(tone: gentle) Call with ${activeCallWith.name} concluded. They sent you lots of love.`);
    }
    setActiveCallWith(null);
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div id="page-call-family" className="flex flex-col h-full bg-stone-50 pb-20 overflow-y-auto">
      {/* Active Call Modal Overlay */}
      {activeCallWith && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-white animate-fade-in">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-400 shadow-2xl mb-6 ring-8 ring-emerald-500/30 animate-pulse">
            <img
              src={activeCallWith.photoUrl}
              alt={activeCallWith.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <h2 className="text-3xl font-black">{activeCallWith.name}</h2>
          <p className="text-emerald-300 font-semibold text-lg mt-1">{activeCallWith.relationship}</p>
          <p className="text-slate-300 font-mono text-xl mt-4 bg-white/10 px-4 py-1.5 rounded-full">
            {formatCallTime(callDuration)}
          </p>

          <p className="text-center text-slate-300 max-w-sm mt-6 text-sm">
            {activeCallWith.descriptionForKai}
          </p>

          <div className="mt-12">
            <button
              onClick={handleEndCall}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-4 rounded-full font-bold shadow-xl active:scale-95 transition"
            >
              <PhoneOff className="w-6 h-6" />
              <span>End Call</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-stone-200 p-6 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('navFamily', currentLanguage)}</h1>
          <p className="text-sm text-slate-500 font-medium">{patientName}</p>
        </div>
        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold">
          <Heart className="w-4 h-4 fill-current text-emerald-500" />
          <span>{t('navFamily', currentLanguage)}</span>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto w-full space-y-8">
        {/* Caregiver Voice Notes Section */}
        {voiceNotes.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm">
            <h2 className="text-base font-black text-slate-800 flex items-center space-x-2 mb-4">
              <Mic className="w-5 h-5 text-emerald-600" />
              <span>Caregiver Voice Messages</span>
            </h2>

            <div className="space-y-3">
              {voiceNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between ${
                    note.played ? 'bg-stone-50 border-stone-200' : 'bg-emerald-50 border-emerald-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${note.played ? 'bg-stone-200 text-stone-600' : 'bg-emerald-600 text-white'}`}>
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        Voice Message from {note.senderName || 'Caregiver'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {note.played ? 'Listened' : 'New Message'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onMarkVoiceNotePlayed(note.id);
                      const spokenMsg = note.message || `Hi ${patientName}, just calling to let you know we love you so much and are thinking of you. Have a wonderful day!`;
                      onSpeak(
                        `(tone: gentle) Playing voice message from ${note.senderName || 'your caregiver'}: (pause) "${spokenMsg}"`
                      );
                    }}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Audio</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Family Cards Grid */}
        <div>
          <h2 className="text-base font-bold text-slate-600 uppercase tracking-wider mb-4">Direct Family Contacts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {familyMembers.map((member, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition flex items-center space-x-4"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-stone-200">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                <div className="flex-grow">
                  <h3 className="font-black text-slate-900 text-lg leading-tight">{member.name}</h3>
                  <p className="text-xs font-semibold text-emerald-700">{member.relationship}</p>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{member.descriptionForKai}</p>
                </div>

                <button
                  onClick={() => handleStartCall(member)}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md active:scale-95 transition flex-shrink-0"
                  title={`Call ${member.name}`}
                  aria-label={`Call ${member.name}`}
                >
                  <Phone className="w-5 h-5 fill-current" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
