import type { Request } from 'express';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  platform: string;
  browser: string;
  deviceType: string;
}

export function getDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = getClientIp(req);

  return {
    userAgent,
    ip,
    platform: detectPlatform(userAgent),
    browser: detectBrowser(userAgent),
    deviceType: detectDeviceType(userAgent),
  };
}

export function getDeviceInfoString(req: Request): string {
  const info = getDeviceInfo(req);
  return `${info.deviceType}|${info.platform}|${info.browser}|${info.ip}`;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp as string;
  }

  return req.ip || req.socket.remoteAddress || 'Unknown';
}

function detectPlatform(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';

  return 'Unknown';
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera';

  return 'Unknown';
}

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('mobile')) return 'Mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';

  return 'Desktop';
}
