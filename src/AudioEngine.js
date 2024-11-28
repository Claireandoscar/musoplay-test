// Create this as AudioEngine.js in your src directory
export class AudioEngine {
    constructor() {
      this.audioContext = null;
      this.buffers = new Map();
      this.initialized = false;
    }
  
    async init() {
      if (this.initialized) return;
  
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
  
      // Resume audio context on iOS/Safari
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
  
      // Pre-load all note buffers (1-8)
      await Promise.all(
        Array.from({ length: 8 }, (_, i) => this.loadSound(`/assets/audio/n${i + 1}.mp3`, `note${i + 1}`))
      );
  
      // Load UI sounds
      await Promise.all([
        this.loadSound('/assets/audio/ui-sounds/wrong-note.mp3', 'wrongNote'),
        this.loadSound('/assets/audio/ui-sounds/bar-complete.mp3', 'barComplete'),
        this.loadSound('/assets/audio/ui-sounds/bar-failed.mp3', 'barFailed')
      ]);
  
      this.initialized = true;
    }
  
    async loadSound(url, id) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers.set(id, audioBuffer);
      } catch (error) {
        console.error(`Failed to load sound ${id}:`, error);
      }
    }
  
    playSound(id, time = 0) {
      if (!this.initialized || !this.buffers.has(id)) return;
  
      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers.get(id);
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0; // Adjust volume if needed
  
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
  
      // Start playback with minimal latency
      const startTime = this.audioContext.currentTime + time;
      source.start(startTime);
  
      return source;
    }
  
    playNote(noteNumber) {
      return this.playSound(`note${noteNumber}`);
    }
  
    playWrongNote() {
      return this.playSound('wrongNote');
    }
  
    playBarComplete() {
      return this.playSound('barComplete');
    }
  
    playBarFailed() {
      return this.playSound('barFailed');
    }
  }
  
  export const audioEngine = new AudioEngine();