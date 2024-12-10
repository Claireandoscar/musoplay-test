export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.buffers = new Map();
    this.initialized = false;
    this.activeSources = new Set();
    this._hasUserGesture = false;
    this.currentGame = null;
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
    // Bind the method to the class instance
    this.stopAllSounds = this.stopAllSounds.bind(this);

    document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
            console.log('Page hidden - stopping all audio');
            // Use the bound method
            this.stopAllSounds();

            if (this.audioContext?.state === 'running') {
                try {
                    await this.audioContext.suspend();
                } catch (e) {
                    console.error('Error suspending context:', e);
                }
            }
        } else {
            console.log('Page visible - resuming audio');
            try {
                if (!this.audioContext) {
                    await this.init();
                } else if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                    if (!await this.verifyBuffers()) {
                        await this.init();
                    }
                }
                this.initialized = true;
                console.log('Audio context resumed successfully');
            } catch (e) {
                console.error('Error resuming audio context:', e);
                try {
                    await this.init();
                } catch (reinitError) {
                    console.error('Failed to reinitialize audio:', reinitError);
                }
            }
        }
    });

    // Use arrow functions to maintain 'this' context
    window.addEventListener('pagehide', () => {
        this.stopAllSounds();
    });

    window.addEventListener('pageshow', async () => {
        try {
            if (this.audioContext?.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            console.error('Error resuming on pageshow:', error);
        }
    });

    window.addEventListener('blur', () => {
        this.stopAllSounds();
    });

    window.addEventListener('focus', async () => {
        try {
            if (this.audioContext?.state === 'suspended') {
                await this.audioContext.resume();
            }
        } catch (error) {
            console.error('Error resuming on focus:', error);
        }
    });
}

// Make sure the stopAllSounds method is defined like this
stopAllSounds() {
    console.log('Stopping all sounds');
    if (this.activeSources) {
        this.activeSources.forEach(source => {
            try {
                source.stop(0);
                source.disconnect();
            } catch (e) {
                console.error('Error stopping source:', e);
            }
        });
        this.activeSources.clear();
    }
    
    if (this.audioContext) {
        this.audioContext.suspend().catch(e => 
            console.error('Error suspending context:', e)
        );
    }
}

  async init() {
    console.log('Starting AudioEngine initialization...');
    try {
      if (this.initialized && this.audioContext?.state === 'running') {
        console.log('AudioEngine already initialized and running');
        return true;
      }

      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        console.log('AudioContext created:', this.audioContext.state);
      }

      if (this.audioContext.state !== 'running') {
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

  async loadSound(url, id, gameNumber = null) {
    try {
      if (!this.audioContext) {
        await this.init();
      }

      // Only check game transitions for melody sounds when gameNumber is provided
      if (gameNumber && id.startsWith('melody') && this.currentGame !== gameNumber) {
        this.clearMelodies();
        this.currentGame = gameNumber;
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

  clearMelodies() {
    // Clear only melody buffers, keep UI sounds and piano notes
    for (const [key] of this.buffers) {
      if (key.startsWith('melody')) {
        this.buffers.delete(key);
      }
    }
    console.log('Cleared melody buffers');
  }

    // Add the new method here
    async verifyBuffers() {
      // Check if basic buffers are loaded
      for (let i = 1; i <= 8; i++) {
        if (!this.buffers.has(`n${i}`)) {
          return false;
        }
      }
      return true;
    }

    playSound(id, time = 0, onComplete = null) {
      if (!this.initialized || !this.audioContext || !this.buffers.has(id)) {
          console.error(`Cannot play sound ${id}: Engine not initialized or buffer not found`);
          return null;
      }
  
      try {
          if (document.hidden) {
              console.log('Page is hidden, not playing sound');
              return null;
          }
  
          const source = this.audioContext.createBufferSource();
          source.buffer = this.buffers.get(id);
          
          const gainNode = this.audioContext.createGain();
          gainNode.gain.value = 1.0;
  
          source.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
  
          const startTime = this.audioContext.currentTime + time;
          source.start(startTime);
          
          this.activeSources.add(source);
          
          source.onended = () => {
              this.activeSources.delete(source);
              source.disconnect();
              gainNode.disconnect();
              if (onComplete && typeof onComplete === 'function') {
                  onComplete();
              }
          };
          
          return source;
      } catch (error) {
          console.error(`Error playing sound ${id}:`, error);
          return null;
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