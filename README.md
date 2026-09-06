# 🌸 CogniCare Companion: AI-Powered Elderly Voice & Cognitive Care Platform

**CogniCare Companion** is an empathetic, AI-driven voice companion and cognitive health platform specifically engineered for elderly individuals and patients living with mild-to-moderate dementia, Alzheimer's disease, or memory loss. Built with Google Gemini 2.5, Web Speech API, and real-time spatial awareness, CogniCare bridges the gap between patient comfort and caregiver peace of mind through adaptive, hands-free interaction.

---

### 🌟 Key Capabilities & Architectural Pillars

- **🎙️ Hands-Free Always-Listening Voice Companion (Kai)**: Eliminates confusing buttons and tap-to-speak interfaces. Kai listens continuously, automatically pausing recognition during voice playback to prevent echo loops. Includes a **Restful Sleep Mode** with auto-wake countdown timers and proactive **15-minute quiet check-ins** (*"Are you feeling comfortable and alright?"*).

- **🌐 Caregiver Cultural & Regional Personalization**: Supports customizable ethnic backgrounds, regional dialects, daily customs, and respectful honorific titles (e.g., *Kaka, Ji, Uncle, Dada, Aaji, Beta*). Kai adapts tone and language seamlessly across English, Hindi, Gujarati, Marathi, Bengali, Tamil, Telugu, and more.

- **🗺️ Real-Time GPS Surroundings Engine**: Uses OpenStreetMap reverse geocoding to provide orientation reassurance. When patients ask *"Where am I right now?"*, Kai responds with localized street names, nearby parks, and familiar landmarks to soothe anxiety.

- **🎮 5 Interactive Core Cognitive Games**: Features a suite of research-backed games (*Memory Tray*, *Memory Match*, *What Changed?*, *Daily Routine Recall*, and *Object Recognition with Voice Input*). An integrated **Adaptive AI Engine** measures accuracy and response speed to dynamically calibrate Kai's speech rate (0.68x to 0.90x) and sentence complexity in real time.

- **🛡️ Caregiver Dashboard & Safety Portal**: Empowers family caregivers with safe-zone geofence monitoring, audio voice note messaging, autobiographical memory bank curation, and clinical cognitive trend tracking.

---

### 🛠️ Tech Stack & Architecture
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **AI & Speech**: Gemini 2.5 Flash, Web Speech STT & SpeechSynthesis TTS with Prosody Parsing
- **Backend & Geolocation**: Node.js, Express, OpenStreetMap Nominatim Geocoding API

---

### 💻 Quick Start & Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure API Keys**:
   Set `GEMINI_API_KEY` in `.env.local` to your Google Gemini API key.
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

