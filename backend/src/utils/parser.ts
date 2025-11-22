import UAParser from 'ua-parser-js';
import { BrowserInfo } from '../types';

export function parseBrowserInfo(userAgent: string): BrowserInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browserName: result.browser.name || null,
    browserVersion: result.browser.version || null,
    osName: result.os.name || null,
    osVersion: result.os.version || null,
    deviceType: result.device.type || 'desktop',
  };
}

export default parseBrowserInfo;
