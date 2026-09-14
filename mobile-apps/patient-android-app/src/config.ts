export function getServerUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('cognicare_server_url');
    if (saved) return saved.replace(/\/$/, '');
  }
  // Global Public Cloudflare Tunnel URL (works across any Wi-Fi & 4G/5G mobile data)
  return 'https://spirituality-lace-rooms-used.trycloudflare.com';
}

export function setServerUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const cleanUrl = url.trim().replace(/\/$/, '');
    localStorage.setItem('cognicare_server_url', cleanUrl);
  }
}

export function getWsUrl(): string {
  const httpUrl = getServerUrl();
  return httpUrl.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
}
