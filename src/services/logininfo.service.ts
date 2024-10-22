import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import * as UAParser from 'ua-parser-js';
import axios from 'axios';

// ! not tested. may not work well
@Injectable()
export class UserLoginInfoService {
  private readonly ipInfoUrl = 'https://ipinfo.io';

  async extractLoginInfo(req: Request): Promise<{
    ip: string;
    location: string;
    deviceType: string;
    username: string;
    loginTime: string;
  }> {
    // Get IP address from request
    const ip = this.getIpAddress(req);

    // Get location using IP address
    const location = await this.getLocationFromIp(ip);

    // Get device type
    const deviceType = this.getDeviceType(req);

    const username =
      (req.user as any).firstname + ' ' + (req.user as any).lastname;

    const loginTime = new Date().toLocaleString() + '(UTC)';

    return {
      ip,
      location,
      deviceType,
      username,
      loginTime,
    };
  }

  // Helper method to get IP address
  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : req.socket.remoteAddress;
    return ip || 'Unknown IP';
  }

  // Helper method to get location from IP address
  private async getLocationFromIp(ip: string): Promise<string> {
    try {
      const response = await axios.get(`${this.ipInfoUrl}/${ip}/json`);
      const { city, region, country } = response.data;
      return `${city}, ${region}, ${country}`;
    } catch (error) {
      console.error('Error fetching location data:', error);
      return 'Unknown Location';
    }
  }

  // Helper method to get device type
  private getDeviceType(req: Request): string {
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    return device.type
      ? `${device.type} (${parser.getOS().name})`
      : `Desktop (${parser.getOS().name})`;
  }
}
