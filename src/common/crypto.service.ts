import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM encryption for OAuth tokens at rest. Tokens are long-lived secrets
 * that grant access to a user's health data, so they must never be stored in
 * plaintext. Output format: `ivHex:authTagHex:cipherHex`.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hex = config.get<string>('tokenEncryptionKey') ?? '';
    this.key = Buffer.from(hex, 'hex');
  }

  encrypt(plaintext: string): string {
    if (this.key.length !== 32) {
      throw new InternalServerErrorException(
        'TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars). Generate: openssl rand -hex 32',
      );
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
  }

  decrypt(payload: string): string {
    const [ivHex, tagHex, dataHex] = payload.split(':');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }
}
