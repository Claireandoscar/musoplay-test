export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.buffers = new Map();
    this.initialized = false;
    this.activeSources = new Set();
    this.loadingPromises = new Map();
    this.setupVisibilityHandler();
  }

  setupVisibilityHandler() {
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        console.log('Page hidden - stopping all audio');
        // Immediately stop all sources
        this.activeSources.forEach(source => {
          try {
            source.stop(0);
            source.disconnect();
          } catch (e) {
            console.log('Error stopping source:', e);
          }
        });
        this.activeSources.clear();

        // Suspend audio context
        if (this.audioContext) {
          this.audioContext.suspend().catch(e => console.log('Error suspending context:', e));
        }
      } else {
        // Page is becoming visible again
        console.log('Page visible - resuming audio context');
        if (this.audioContext?.state === 'suspended') {
          try {
            await this.audioContext.resume();
            this.initialized = true;
            console.log('Audio context resumed successfully');
          } catch (e) {
            console.log('Error resuming audio context:', e);
            // Try to reinitialize if resume fails
            await this.init();
          }
        }
      }
    });

    // Additional handlers for mobile
    window.addEventListener('pagehide', () => {
      this.stopAllSounds();
    });

    window.addEventListener('blur', () => {
      this.stopAllSounds();
    });
  }

  stopAllSounds() {
    console.log('Stopping all sounds');
    if (this.audioContext) {
      // Stop all sources immediately
      this.activeSources.forEach(source => {
        try {
          source.stop(0);
          source.disconnect();
        } catch (e) {
          console.log('Error stopping source:', e);
        }
      });
      this.activeSources.clear();
      
      // Suspend the audio context
      this.audioContext.suspend().catch(e => console.log('Error suspending context:', e));
    }
  }

  async init() {
    console.log('Starting AudioEngine initialization...');
    try {
      if (this.initialized) {
        console.log('AudioEngine already initialized');
        return true;
      }

      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        console.log('AudioContext created:', this.audioContext.state);
      }

      if (this.audioContext.state === 'suspended') {
        console.log('Attempting to resume suspended audio context...');
        await this.audioContext.resume();
        console.log('Audio context resumed:', this.audioContext.state);
      }

      this.initialized = true;
      console.log('AudioEngine initialization complete');
      return true;

    } catch (error) {
      console.error('AudioEngine initialization failed:', error);
      return false;
    }
  }

  async preloadSounds(urls) {
    if (!this.initialized) {
      await this.init();
    }

    const results = {
      loaded: [],
      failed: []
    };

    try {
      const loadPromises = urls.map(async ({ url, id }) => {
        try {
          // Check if already loaded
          if (this.buffers.has(id)) {
            results.loaded.push(id);
            return;
          }

          // Check if already loading
          if (this.loadingPromises.has(id)) {
            await this.loadingPromises.get(id);
            results.loaded.push(id);
            return;
          }

          // Create new loading promise
          const loadPromise = this.loadSound(url, id);
          this.loadingPromises.set(id, loadPromise);

          await loadPromise;
          results.loaded.push(id);
        } catch (error) {
          console.error(`Failed to preload sound ${id}:`, error);
          results.failed.push(id);
        } finally {
          this.loadingPromises.delete(id);
        }
      });

      await Promise.all(loadPromises);
      return results;
    } catch (error) {
      console.error('Error in preloadSounds:', error);
      throw error;
    }
  }

  async loadSound(url, id) {
    try {
      if (!this.audioContext) {
        await this.init();
      }

      // Return existing buffer if already loaded
      if (this.buffers.has(id)) {
        return this.buffers.get(id);
      }

      // Return existing promise if already loading
      if (this.loadingPromises.has(id)) {
        return this.loadingPromises.get(id);
      }

      console.log(`Loading sound: ${id} from ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers.set(id, audioBuffer);
      console.log(`Sound loaded successfully: ${id}`);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load sound ${id}:`, error);
      throw error;
    }
  }

  playSound(id, time = 0) {
    if (!this.initialized || !this.audioContext || !this.buffers.has(id)) {
      console.error(`Cannot play sound ${id}: Engine not initialized or buffer not found`);
      return;
    }

    try {
      if (document.hidden) {
        console.log('Page is hidden, not playing sound');
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers.get(id);
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const startTime = this.audioContext.currentTime + time;
      source.start(startTime);
      
      // Add to active sources
      this.activeSources.add(source);
      
      // Remove from active sources when done
      source.onended = () => {
        this.activeSources.delete(source);
        source.disconnect();
      };
      
      console.log(`Sound ${id} started playing`);
      return source;
    } catch (error) {
      console.error(`Error playing sound ${id}:`, error);
    }
  }

  playNote(noteNumber) {
    console.log(`Playing note: ${noteNumber}`);
    return this.playSound(`n${noteNumber}`);
  }

  isPlaying() {
    return this.activeSources.size > 0;
  }
}

export const audioEngine = new AudioEngine();