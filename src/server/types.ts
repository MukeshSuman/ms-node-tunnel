export interface TunnelInfo {
  subdomain: string;
  targetUrl: string;
  clientWs?: WebSocket;
}

export interface TunnelConfig {
  subdomain: string;
  localPort: number;
  serverHost: string;
}

export interface RegisterResponse {
  message: string;
  connectUrl: string;
}