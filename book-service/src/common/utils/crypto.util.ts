import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(String(process.env.ENCRYPTION_KEY || 'default_secret_key'))
  .digest('base64')
  .substring(0, 32);

function toAlphanumeric(buffer: Buffer): string {
  return buffer.toString('hex');
}

function fromAlphanumeric(hex: string): Buffer {
  return Buffer.from(hex, 'hex');
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const ivHex = toAlphanumeric(iv);
  const encryptedHex = toAlphanumeric(encrypted);

  return `${ivHex}${encryptedHex}`;
}

export function decrypt(encryptedText: string): string {
  const ivHex = encryptedText.substring(0, 32);
  const encryptedHex = encryptedText.substring(32);

  const iv = fromAlphanumeric(ivHex);
  const encrypted = fromAlphanumeric(encryptedHex);

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

export function encryptId(id: number): string {
  return encrypt(id.toString());
}

export function decryptId(encryptedId: string): number {
  const decrypted = decrypt(encryptedId);
  const id = parseInt(decrypted, 10);
  if (isNaN(id)) {
    throw new Error('Invalid encrypted ID');
  }
  return id;
}
