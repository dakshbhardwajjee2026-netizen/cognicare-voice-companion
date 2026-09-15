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
  const lastMemoryRecallTimeRef = useRef<number>(Date.now() - 30000); // Allow memory recall shortly after start
  const memoryIndexRef = useRef<number>(0);

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
        const noteMsg = (unplayedNote as any).message || (unplayedNote as any).text || 'Sending you lots of love and looking forward to seeing you soon!';
        const alert: AlertPayload = {
          type: 'voiceNote',
          text: `Voice message from ${unplayedNote.senderName || 'your caregiver'}`,
          speech: `(tone: gentle) ${patientName}, here is a warm voice message from ${unplayedNote.senderName || 'your caregiver'}: (pause) "${noteMsg}"`,
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
        return;
      }

      // 3. Proactive Memory Recalling / Cognitive Reminiscence
      const memories = patientData.memories || [];
      if (memories.length > 0) {
        const timeSinceLastRecall = Date.now() - lastMemoryRecallTimeRef.current;
        // Trigger proactive memory recall every 50 seconds during session
        if (timeSinceLastRecall >= 50000 && !activeAlert) {
          lastMemoryRecallTimeRef.current = Date.now();
          const mem = memories[memoryIndexRef.current % memories.length];
          memoryIndexRef.current += 1;

          const alert: AlertPayload = {
            type: 'memory',
            text: `Cherished Memory: ${mem.title}`,
            speech: `(tone: warm) ${patientName}, look at this wonderful memory: ${mem.title}. (pause) ${mem.descriptionForKai}. Does this bring back happy thoughts?`,
            memory: mem,
          };
          setActiveAlert(alert);
          options.onTriggerAlert?.(alert);
        }
      }
    };

    // Run check every 10 seconds
    const interval = setInterval(checkProactiveConditions, 10000);
    // Also run initial check after short delay
    const initTimer = setTimeout(checkProactiveConditions, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(initTimer);
    };
  }, [patientData, activeAlert, options]);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return {
    activeAlert,
    dismissAlert,
    setActiveAlert,
  };
};
