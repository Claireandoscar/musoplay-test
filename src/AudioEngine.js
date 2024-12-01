export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.buffers = new Map();
    this.initialized = false;
    this.activeSources = new Set();
    this._hasUserGesture = false;
    this.setupVisibilityHandler();
    this.setupUserGestureTracking();
  }
  
  setupUserGestureTracking() {
    const userGestureEvents = ['touchstart', 'touchend', 'click', 'keydown'];
    const handler = () => {
      this._hasUserGesture = true;
      userGestureEvents.forEach(event => {
        document.removeEventListener(event, handler);
      });
    };
    userGestureEvents.forEach(event => {
      document.addEventListener(event, handler);
    });
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
        // Don't reinitialize if already running
        if (this.initialized && this.audioContext?.state === 'running') {
            console.log('AudioEngine already initialized and running');
            return true;
        }

        // Create context if it doesn't exist
        if (!this.audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            
            // Check if running on iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (isIOS) {
                // iOS-specific options
                this.audioContext = new AudioContext();
            } else {
                // Android and other platforms
                this.audioContext = new AudioContext({
                    latencyHint: 'interactive',
                    sampleRate: 44100
                });
            }
            console.log('AudioContext created:', this.audioContext.state);
        }

        // Force resume context - iOS specific handling
        if (this.audioContext.state !== 'running') {
            console.log('Attempting to resume suspended audio context...');
            // iOS requires user interaction
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            if (isIOS) {
                // On iOS, we need to be more aggressive about resuming
                await this.audioContext.resume();
            } else {
                // For other platforms, check gesture
                if (!this._hasUserGesture) {
                    console.log('Waiting for user gesture before resuming audio...');
                    return false;
                }
                await this.audioContext.resume();
                await new Promise(resolve => setTimeout(resolve, 50));
            }
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
  async loadSound(url, id) {
    try {
      if (!this.audioContext) {
        await this.init();
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

        // Check if running on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        // Check audio context state
        if (this.audioContext.state !== 'running') {
            console.log('Audio context not running, attempting to resume...');
            this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffers.get(id);
        
        const gainNode = this.audioContext.createGain();
        // Different gain values for iOS vs Android
        gainNode.gain.value = isIOS ? 1.0 : 0.9;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Different timing approach for iOS
        const startTime = this.audioContext.currentTime + (isIOS ? 0 : (time || 0.01));
        source.start(startTime);
        
        this.activeSources.add(source);
        
        source.onended = () => {
            this.activeSources.delete(source);
            source.disconnect();
            gainNode.disconnect();
        };

        // iOS specific error checking
        if (isIOS && this.audioContext.state !== 'running') {
            console.log('iOS audio context not running after play attempt');
            this.audioContext.resume().catch(e => console.log('Error resuming iOS context:', e));
        }
        
        return source;
    } catch (error) {
        console.error(`Error playing sound ${id}:`, error);
        // Attempt recovery on iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
            try {
                this.audioContext.resume();
            } catch (e) {
                console.error('iOS recovery attempt failed:', e);
            }
        }
    }
}
  async recoverAudio() {
    if (!this._hasUserGesture) {
      console.log('Waiting for user gesture before recovery...');
      return false;
    }
    
    try {
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for Android
      }
      
      if (!this.initialized) {
        await this.init();
      }
      
      return true;
    } catch (error) {
      console.error('Audio recovery failed:', error);
      return false;
    }
  }

  playNote(noteNumber) {
    console.log(`Playing note: ${noteNumber}`);
    return this.playSound(`n${noteNumber}`);
  }

  // Method to check if any sounds are currently playing
  isPlaying() {
    return this.activeSources.size > 0;
  }
}

export const audioEngine = new AudioEngine();