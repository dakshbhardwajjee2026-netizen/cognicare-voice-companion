import React, { useState } from 'react';
import { Header } from './Header';
import { KaiControls } from './KaiControls';
import { ConversationHistory } from './ConversationHistory';
import { AlertBanner } from './AlertBanner';
import { MemoryImageViewer } from './MemoryImageViewer';
import { PatientData, ChatMessage, Memory, AlertPayload } from '../types';

interface CompanionDisplayProps {
  patientData: PatientData;
  history: ChatMessage[];
  isListening: boolean;
  isUserSpeaking: boolean;
  isSpeaking: boolean;
  isKaiThinking: boolean;
  isMuted: boolean;
  interimTranscript: string;
  micVolume?: number;
  errorMessage?: string | null;
  hasMicPermission?: boolean | null;
  activeAlert: AlertPayload | null;
  activeMemoryModal: Memory | null;
  onToggleListening: () => void;
  onToggleMute: () => void;
  onSendPrompt: (text: string) => void;
  onReplayAudio: (text: string) => void;
  onDismissAlert: () => void;
  onCloseMemoryModal: () => void;
  onOpenCaregiverPortal: () => void;
  onRequestPermission?: () => void;
  currentLanguage?: string;
  onChangeLanguage?: (langId: string) => void;
  isSleepMode?: boolean;
  sleepTimeRemaining?: number;
  onPutKaiToSleep?: (minutes: number) => void;
  onWakeUpKai?: () => void;
}

export const CompanionDisplay: React.FC<CompanionDisplayProps> = ({
  patientData,
  history,
  isListening,
  isUserSpeaking,
  isSpeaking,
  isKaiThinking,
  isMuted,
  interimTranscript,
  micVolume = 0,
  errorMessage,
  hasMicPermission,
  activeAlert,
  activeMemoryModal,
  onToggleListening,
  onToggleMute,
  onSendPrompt,
  onReplayAudio,
  onDismissAlert,
  onCloseMemoryModal,
  onOpenCaregiverPortal,
  onRequestPermission,
  currentLanguage = 'en',
  onChangeLanguage,
  isSleepMode,
  sleepTimeRemaining,
  onPutKaiToSleep,
  onWakeUpKai,
}) => {
  const patientName = patientData?.profile?.name || 'David';

  return (
    <div id="page-companion-display" className="flex flex-col h-full bg-[#F5F2EB] relative overflow-hidden">
      {/* Top Header with clock, safety status, and language selector */}
      <Header
        patientName={patientName}
        isListening={isListening}
        currentLanguage={currentLanguage}
        onChangeLanguage={onChangeLanguage}
      />

      {/* Proactive Alert Banner (Schedule / Location / Caregiver Voice Note) */}
      <AlertBanner
        alert={activeAlert}
        onClose={onDismissAlert}
        onPlaySpeech={activeAlert ? () => onReplayAudio(activeAlert.speech) : undefined}
      />

      {/* Main Conversation Stream */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <ConversationHistory history={history} onReplayAudio={onReplayAudio} />
      </div>

      {/* Memory Image Modal Pop-up */}
      <MemoryImageViewer
        memory={activeMemoryModal}
        onClose={onCloseMemoryModal}
        onSpeakDescription={onReplayAudio}
      />

      {/* Interactive Kai Voice Panel (Orb, Microphone status, Quick Prompts, Mute, Type) */}
      <KaiControls
        isListening={isListening}
        isUserSpeaking={isUserSpeaking}
        isSpeaking={isSpeaking}
        isKaiThinking={isKaiThinking}
        isMuted={isMuted}
        interimTranscript={interimTranscript}
        micVolume={micVolume}
        errorMessage={errorMessage}
        hasMicPermission={hasMicPermission}
        proactiveContext={activeAlert}
        onToggleListening={onToggleListening}
        onToggleMute={onToggleMute}
        onSendTextPrompt={onSendPrompt}
        onQuickPrompt={onSendPrompt}
        onRequestPermission={onRequestPermission}
        isSleepMode={isSleepMode}
        sleepTimeRemaining={sleepTimeRemaining}
        onPutKaiToSleep={onPutKaiToSleep}
        onWakeUpKai={onWakeUpKai}
      />
    </div>
  );
};
