import { useState, useEffect, useRef } from 'react';
import { PatientData, AlertPayload } from '../types';

interface UseProactiveOptions {
  onTriggerAlert?: (alert: AlertPayload) => void;
}

export const useProactiveSystem = (
  patientData: PatientData | null,
  options: UseProactiveOptions = {}
) => {
  const [activeAlert, setActiveAlert] = useState<AlertPayload | null>(null);
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!patientData) return;

    const checkProactiveConditions = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const patientName = patientData.profile?.name || 'David';

      // 1. Check for unplayed voice note
      const unplayedNote = (patientData.voiceNotes || []).find((n) => !n.played);
      if (unplayedNote && !notifiedEventsRef.current.has(`note-${unplayedNote.id}`)) {
        notifiedEventsRef.current.add(`note-${unplayedNote.id}`);
        const alert: AlertPayload = {
          type: 'voiceNote',
          text: `New voice message received from ${unplayedNote.senderName || 'your caregiver'}.`,
          speech: `(tone: gentle) ${patientName}, you have a warm voice message waiting from ${unplayedNote.senderName || 'your caregiver'}. Would you like me to play it for you?`,
        };
        setActiveAlert(alert);
        options.onTriggerAlert?.(alert);
        return;
      }

      // 2. Check for matching schedule time
      const matchingSchedule = (patientData.schedule || []).find(
        (event) => event.time === currentTimeStr
      );

      if (
        matchingSchedule &&
        !notifiedEventsRef.current.has(`sched-${matchingSchedule.time}-${now.toDateString()}`)
      ) {
        notifiedEventsRef.current.add(`sched-${matchingSchedule.time}-${now.toDateString()}`);
        const alert: AlertPayload = {
          type: 'schedule',
          text: `Scheduled Task: ${matchingSchedule.task}`,
          speech: `(tone: reassuring) ${patientName}, it is now ${matchingSchedule.time}. ${matchingSchedule.message || matchingSchedule.task}. (pause) ${matchingSchedule.instructions || ''}`,
        };
        setActiveAlert(alert);
        options.onTriggerAlert?.(alert);
      }
    };

    // Run check every 15 seconds
    const interval = setInterval(checkProactiveConditions, 15000);
    // Also run initial check
    checkProactiveConditions();

    return () => clearInterval(interval);
  }, [patientData, options]);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return {
    activeAlert,
    dismissAlert,
    setActiveAlert,
  };
};
