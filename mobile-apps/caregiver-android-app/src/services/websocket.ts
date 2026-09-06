import { PatientTelemetry, CaregiverRequest, VoiceMessage } from '../types';

type Listener = (event: string, data: any) => void;

class CaregiverWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Listener[] = [];
  private isConnected = false;

  constructor() {
    this.connect();
  }

  public connect() {
    try {
      this.socket = new WebSocket('ws://localhost:3001');

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('[Caregiver WS] Connected to backend');
        this.send('REGISTER_ROLE', { role: 'caregiver' });
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.notifyListeners(parsed.event, parsed.data);
        } catch (err) {
          console.error('[Caregiver WS] Parse error:', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log('[Caregiver WS] Disconnected. Reconnecting in 3s...');
        setTimeout(() => this.connect(), 3000);
      };
    } catch (err) {
      console.error('[Caregiver WS] Connection error:', err);
    }
  }

  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(event: string, data: any) {
    this.listeners.forEach(l => l(event, data));
  }

  public send(event: string, data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    }
  }

  public sendCallSignal(type: 'offer' | 'answer' | 'end' | 'reject', payload?: any) {
    this.send('CALL_SIGNAL', {
      callId: 'call_' + Date.now(),
      caller: 'caregiver',
      recipient: 'patient',
      type,
      payload
    });
  }
}

export const caregiverWsClient = new CaregiverWebSocketClient();
