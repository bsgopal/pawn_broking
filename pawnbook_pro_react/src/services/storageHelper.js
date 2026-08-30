import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const WEB_PREFIX = 'pawnbook_file_';

export class StorageHelper {
  /**
   * Writes a JSON file natively on Android or saves to localStorage on web.
   * @param {string} filename - The file name, e.g. 'loans.json'
   * @param {any} data - The data object to stringify and store
   */
  static async writeFile(filename, data) {
    const jsonString = JSON.stringify(data, null, 2);
    
    if (isNative) {
      try {
        await Filesystem.writeFile({
          path: `data/${filename}`,
          data: jsonString,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
          recursive: true, // Auto-creates 'data' directory if not exists
        });
      } catch (e) {
        console.error(`Failed to write native file: ${filename}`, e);
      }
    } else {
      try {
        localStorage.setItem(`${WEB_PREFIX}${filename.replace('.json', '')}`, jsonString);
      } catch (e) {
        console.error(`Failed to write web local storage: ${filename}`, e);
      }
    }
  }

  /**
   * Reads a JSON file natively on Android or fetches from localStorage on web.
   * @param {string} filename - The file name, e.g. 'loans.json'
   * @returns {Promise<any|null>} Parsed JSON content or null if not found
   */
  static async readFile(filename) {
    if (isNative) {
      try {
        const result = await Filesystem.readFile({
          path: `data/${filename}`,
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        });
        
        // Handle both raw string and blob data formats if needed
        let rawData = result.data;
        if (typeof rawData !== 'string') {
          rawData = await rawData.text();
        }
        return JSON.parse(rawData);
      } catch (e) {
        // File does not exist yet
        return null;
      }
    } else {
      try {
        const webKey = `${WEB_PREFIX}${filename.replace('.json', '')}`;
        const rawData = localStorage.getItem(webKey);
        return rawData ? JSON.parse(rawData) : null;
      } catch (e) {
        console.error(`Failed to read web local storage: ${filename}`, e);
        return null;
      }
    }
  }
}
