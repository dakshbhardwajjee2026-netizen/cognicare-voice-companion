import { Memory, ScheduleEvent, FamilyMember, VoiceNote, PatientData } from './types';

export const DEFAULT_MEMORIES: Memory[] = [
  {
    title: 'Our Wedding Day',
    descriptionForKai: "This was David and Maria's wedding day in the spring of 1978 under the grand oak tree at Rosewood Gardens. Maria wore a lace gown with wildflowers, and David could not stop smiling.",
    imageToGenerate: 'A warm, slightly faded color photograph from the 1970s of a happy couple in wedding attire, smiling under a large oak tree.',
    imagePlaceholderUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: "Sarah's First Bike Ride",
    descriptionForKai: "This was the special sunny afternoon when David taught his daughter Sarah how to ride her little red bicycle at Pine Lake Park. She was so proud when he let go of the seat.",
    imageToGenerate: 'A sunny, candid photo from the 1980s of a father running proudly beside his young daughter on a small red bicycle with training wheels.',
    imagePlaceholderUrl: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Bringing Buddy Home',
    descriptionForKai: "This is the day the family brought Buddy home as an 8-week-old golden retriever puppy. He fell fast asleep in David's lap on the drive back from the farm.",
    imageToGenerate: "A close-up, heartwarming photo of a small, fluffy golden retriever puppy sleeping peacefully in a person's lap.",
    imagePlaceholderUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Summer Garden Harvest',
    descriptionForKai: 'David loved tending to his heirloom tomatoes and sweet basil every July. The whole kitchen would smell like fresh summer herbs and homemade marinara sauce.',
    imageToGenerate: 'A warm sunlit garden with red ripe tomatoes on the vine and fresh green herbs in wooden baskets.',
    imagePlaceholderUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=800&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_SCHEDULE: ScheduleEvent[] = [
  {
    time: '09:00',
    task: 'Morning Blue Medication',
    instructions: 'Take the blue heart pill with a tall glass of cool water after breakfast.',
    message: 'Good morning, David. It is time for your morning medication with a fresh glass of water.',
  },
  {
    time: '11:30',
    task: 'Gentle Garden Stroll',
    instructions: 'Step outside to breathe the fresh air and check on the rose bushes.',
    message: 'David, the sun is shining warmly. Would you like to step outside for a gentle breath of fresh air?',
  },
  {
    time: '14:00',
    task: 'Sarah Calling & Visiting',
    instructions: 'Sarah will be stopping by with afternoon tea and cookies.',
    message: 'David, how wonderful! Sarah will be arriving shortly at two o\'clock for afternoon tea.',
  },
  {
    time: '18:30',
    task: 'Evening Dinner & Chamomile Tea',
    instructions: 'Enjoy a warm soup and relaxing chamomile tea before resting.',
    message: 'Time to wind down the evening with a soothing warm cup of tea, David.',
  },
];

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  {
    name: 'Sarah Miller',
    relationship: 'Daughter',
    descriptionForKai: 'Sarah is your loving eldest daughter. She is a teacher, has your warm smile, and visits every Tuesday and Saturday.',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Maria Miller',
    relationship: 'Wife',
    descriptionForKai: 'Maria is your devoted wife of 46 years. You met at the community library in 1976 and share a lifelong love of jazz and gardening.',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Michael Miller',
    relationship: 'Son',
    descriptionForKai: 'Michael is your son who lives in Seattle. He is an architect and always calls every Sunday morning at 10 AM.',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Buddy',
    relationship: 'Family Golden Retriever',
    descriptionForKai: 'Buddy is your gentle 7-year-old golden retriever who loves resting his head on your feet while you read.',
    photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&auto=format&fit=crop&q=80',
  },
];

export const DEFAULT_VOICE_NOTES: VoiceNote[] = [
  {
    id: 'vn-1',
    audioData: '',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    played: false,
    senderName: 'Sarah (Daughter)',
  },
];

export const DEMO_PATIENT: PatientData = {
  id: 'CGN-DEMO1',
  profile: {
    name: 'David Miller',
    email: 'sarah.miller@caregiver.org',
  },
  memories: DEFAULT_MEMORIES,
  schedule: DEFAULT_SCHEDULE,
  familyMembers: DEFAULT_FAMILY_MEMBERS,
  voiceNotes: DEFAULT_VOICE_NOTES,
  settings: {
    homeCoordinates: { lat: 37.7749, lng: -122.4194 },
    safeZoneRadius: 250,
  },
  speechSettings: {
    speechRate: 0.85,
    autoAdjustSpeech: true,
    lastAssessment: {
      id: 'asm-1',
      timestamp: Date.now() - 86400000 * 2,
      cognitiveScore: 88,
      cognitiveLevel: 'High',
      speechClarityScore: 92,
      speechImpairmentLevel: 'Clear',
      recommendedSpeechRate: 0.88,
      notes: 'Initial clinical screening completed smoothly. Good recall & speech articulation.',
    },
    assessmentHistory: [
      {
        id: 'asm-1',
        timestamp: Date.now() - 86400000 * 2,
        cognitiveScore: 88,
        cognitiveLevel: 'High',
        speechClarityScore: 92,
        speechImpairmentLevel: 'Clear',
        recommendedSpeechRate: 0.88,
        notes: 'Initial clinical screening completed smoothly. Good recall & speech articulation.',
      },
    ],
  },
  culturalProfile: {
    ethnicBackground: 'Gujarati / Western Indian',
    honorificTitle: 'Kaka',
    comfortsAndCustoms: 'Enjoys warm Masala Chai at 4 PM, morning bhajan music, and afternoon garden walks.',
    preferredLanguageNotes: 'Use respectful Indian honorifics like Kaka or Ji, speak with warm family tone.',
  },
};
