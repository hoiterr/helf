export interface WhoopConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  webhookSecret: string;
}

export interface AppConfig {
  env: string;
  port: number;
  appBaseUrl: string;
  tokenEncryptionKey: string;
  whoop: WhoopConfig;
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY ?? '',
  whoop: {
    clientId: process.env.WHOOP_CLIENT_ID ?? '',
    clientSecret: process.env.WHOOP_CLIENT_SECRET ?? '',
    redirectUri: process.env.WHOOP_REDIRECT_URI ?? '',
    webhookSecret: process.env.WHOOP_WEBHOOK_SECRET ?? '',
  },
});
