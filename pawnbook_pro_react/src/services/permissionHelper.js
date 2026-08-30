import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export class PermissionHelper {
  /**
   * Prompts for all essential permissions (Location, Camera, Microphone) silently at app startup.
   */
  static async requestStartupPermissions() {
    console.log('Initiating automatic startup permissions prompt...');
    
    // 1. Location Request (Native-aware and 100% crash-proof)
    if (isNative) {
      try {
        const status = await Geolocation.checkPermissions();
        if (status.location === 'prompt') {
          await Geolocation.requestPermissions();
          console.log('Startup: Native location request executed.');
        }
      } catch (e) {
        console.error('Startup: Native location prompt failed:', e);
      }
    } else {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => console.log('Startup: Web location permission granted.'),
          (err) => console.log('Startup: Web location permission skipped or denied:', err.message),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
        );
      }
    }

    // 2. Silent Camera & Microphone Request (in one combined stream request)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          // Instantly close all tracks so the recording indicators disappear
          stream.getTracks().forEach(track => track.stop());
          console.log('Startup: Camera and Microphone permissions granted.');
        })
        .catch(err => {
          console.log('Startup: Camera and/or Microphone permission skipped or denied:', err.message);
        });
    }
  }

  /**
   * Queries the state of a specific device permission.
   * @param {string} name - The query identifier, e.g. 'camera', 'microphone', 'location'
   * @returns {Promise<'granted' | 'denied' | 'prompt'>}
   */
  static async getPermissionStatus(name) {
    if (name === 'location') {
      if (isNative) {
        try {
          const status = await Geolocation.checkPermissions();
          return status.location; // 'granted', 'denied', or 'prompt'
        } catch (e) {
          console.error('Failed checking native location permission:', e);
          return 'prompt';
        }
      } else {
        if (!navigator.permissions || !navigator.permissions.query) {
          return 'prompt';
        }
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          return status.state;
        } catch (e) {
          return 'prompt';
        }
      }
    }

    if (!navigator.permissions || !navigator.permissions.query) {
      return 'prompt';
    }

    try {
      let queryName = name;
      if (name === 'location') queryName = 'geolocation';
      
      const status = await navigator.permissions.query({ name: queryName });
      return status.state; // 'granted', 'denied', or 'prompt'
    } catch (e) {
      console.log(`Permission query failed for ${name}:`, e);
      return 'prompt';
    }
  }

  /**
   * Explicitly requests Camera permission.
   * @returns {Promise<'granted'>}
   */
  static async requestCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    }
    throw new Error('Camera device is not available or supported.');
  }

  /**
   * Explicitly requests Microphone permission.
   * @returns {Promise<'granted'>}
   */
  static async requestMicrophone() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    }
    throw new Error('Microphone device is not available or supported.');
  }

  /**
   * Explicitly requests Geolocation Location permission.
   * @returns {Promise<'granted'>}
   */
  static async requestLocation() {
    if (isNative) {
      const status = await Geolocation.requestPermissions();
      if (status.location === 'granted') {
        return 'granted';
      }
      throw new Error('Location permission denied by user.');
    } else {
      return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            () => resolve('granted'),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          reject(new Error('Geolocation services are not supported.'));
        }
      });
    }
  }
}
