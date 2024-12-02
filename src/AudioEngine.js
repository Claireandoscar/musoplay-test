// AudioEngine.js - Enhanced version
class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.buffers = new Map();
    this.initialized = false;
    this.activeSources = new Set();
    this.loadingPromises = new Map();
    this.preloadComplete = false;
  }

  async init() {
    try {
      if (this.initialized && this.audioContext?.state === 'running') {
        return true;
      }

      // Force audio context creation even in silent mode
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext({
        // This enables WebAudio to work in iOS silent mode
        sinkId: 'default',
        latencyHint: 'interactive'
      });

      // Enable audio processing
      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume();
      }

      // Setup audio processing chain
      this.masterGain = this.audioContext.createGain();
      this.compressor = this.audioContext.createDynamicsCompressor();
      
      // Configure compressor for better mobile audio
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      
      // Connect audio chain
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.audioContext.destination);

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('AudioEngine initialization failed:', error);
      return false;
    }
  }

  async preloadGameAudio(gameNumber) {
    if (this.preloadComplete) return true;

    try {
      // Initialize audio context first
      await this.init();

      // Load piano notes (1-8)
      const notePromises = Array.from({ length: 8 }, (_, i) => 
        this.loadSound(`/assets/audio/n${i + 1}.mp3`, `n${i + 1}`)
      );

      // Load UI sounds
      const uiSoundPromises = [
        this.loadSound('/assets/audio/ui-sounds/wrong-note.mp3', 'wrong'),
        this.loadSound('/assets/audio/ui-sounds/bar-failed.mp3', 'fail'),
        this.loadSound('/assets/audio/ui-sounds/bar-complete.mp3', 'complete'),
        this.loadSound('/assets/audio/ui-sounds/note-flip.mp3', 'flip')
      ];

      // Load game-specific melodies
      const response = await fetch(`/assets/audio/testMelodies/game${gameNumber}/current.json`);
      const data = await response.json();
      
      const melodyPromises = data.melodyParts.map((path, index) => 
        this.loadSound(path, `melody${index}`)
      );

      // Load full tune
      const fullTunePromise = this.loadSound(data.fullTune, 'fullTune');

      // Wait for all audio to load
      await Promise.all([
        ...notePromises,
        ...uiSoundPromises,
        ...melodyPromises,
        fullTunePromise
      ]);

      this.preloadComplete = true;
      return true;
    } catch (error) {
      console.error('Failed to preload game audio:', error);
      return false;
    }
  }

  async loadSound(url, id) {
    // Check if already loading this sound
    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id);
    }

    // Check if already loaded
    if (this.buffers.has(id)) {
      return this.buffers.get(id);
    }

    const loadPromise = (async () => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers.set(id, audioBuffer);
        return audioBuffer;
      } catch (error) {
        console.error(`Failed to load sound ${id}:`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(id);
      }
    })();

    this.loadingPromises.set(id, loadPromise);
    return loadPromise;
  }

  playSound(id, time = 0) {
    if (!this.initialized || !this.audioContext || !this.buffers.has(id)) {
      return null;
    }

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers.get(id);
      
      const noteGain = this.audioContext.createGain();
      noteGain.gain.value = 0.8; // Slightly reduced volume for better mixing

      source.connect(noteGain);
      noteGain.connect(this.masterGain);

      const startTime = this.audioContext.currentTime + time;
      source.start(startTime);
      
      this.activeSources.add(source);
      
      source.onended = () => {
        this.activeSources.delete(source);
        source.disconnect();
        noteGain.disconnect();
      };
      
      return source;
    } catch (error) {
      console.error(`Error playing sound ${id}:`, error);
      return null;
    }
  }

  stopAllSounds() {
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
}

export const audioEngine = new AudioEngine();