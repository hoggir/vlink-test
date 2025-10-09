import * as crypto from 'crypto';

export function generateReferenceNumber(): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:T.]/g, '')
    .substring(0, 14);

  const random = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `CHK-${timestamp}-${random}`;
}

export function isValidReferenceNumber(ref: string): boolean {
  const pattern = /^CHK-\d{14}-[A-F0-9]{6}$/;
  return pattern.test(ref);
}
