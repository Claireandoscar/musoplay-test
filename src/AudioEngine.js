export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.buffers = new Map();
    this.initialized = false;
  }

  async init() {
    console.log('Starting AudioEngine initialization...');
    try {
      if (this.initialized) {
        console.log('AudioEngine already initialized');
        return;
      }

      // Create AudioContext only if it doesn't exist
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        console.log('AudioContext created:', this.audioContext.state);
      }

      // Ensure audio context is resumed
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

  async loadSound(url, id) {
    try {
      // Ensure AudioContext exists before loading sounds
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
      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers.get(id);
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const startTime = this.audioContext.currentTime + time;
      source.start(startTime);
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
}

export const audioEngine = new AudioEngine();