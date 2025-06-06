export interface IDatabaseConfig {
  uri: string;
  dbName: string;
  options?: {
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTimeMS?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    connectTimeoutMS?: number;
    retryWrites?: boolean;
    retryReads?: boolean;
  };
}

export interface IDatabaseProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionState(): string;
}

export interface IDatabaseHealth {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  uptime: number;
  connections: {
    current: number;
    available: number;
  };
}
