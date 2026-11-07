/**
 * Web Audio API synthesizer for classroom picker sound effects.
 * 100% self-contained, no external audio files needed.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.7;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Short crisp mechanical/digital tick for spinning names
   */
  public playTick(pitchMultiplier: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 540 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.18 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy catch
    }
  }

  /**
   * Tension drumroll / riser during the 2-3 second roll
   */
  public playRiser(durationSeconds: number = 2.5) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + durationSeconds);

      // Low pass filter to keep it pleasant in classroom
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + durationSeconds);

      gain.gain.setValueAtTime(0.02 * this.volume, now);
      gain.gain.linearRampToValueAtTime(0.14 * this.volume, now + durationSeconds - 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + durationSeconds + 0.05);
    } catch {
      // AudioContext policy catch
    }
  }

  /**
   * Grand celebratory victory chime & fanfare chords (C5, E5, G5, C6)
   */
  public playFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Bright major triumph chords
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.35, type: 'triangle' as OscillatorType }, // C5
        { freq: 659.25, time: 0.12, dur: 0.35, type: 'triangle' as OscillatorType }, // E5
        { freq: 783.99, time: 0.24, dur: 0.45, type: 'triangle' as OscillatorType }, // G5
        { freq: 1046.5, time: 0.36, dur: 1.2, type: 'sine' as OscillatorType }, // C6 high bell
        { freq: 1318.51, time: 0.44, dur: 1.0, type: 'sine' as OscillatorType }, // E6 sparkle
      ];

      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = n.type;
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        const startTime = now + n.time;
        const endTime = startTime + n.dur;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.24 * this.volume, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(endTime + 0.05);
      });
    } catch {
      // AudioContext policy catch
    }
  }

  /**
   * Friendly error / warning boop
   */
  public playWarning() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(200, now + 0.12);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // AudioContext policy catch
    }
  }
}

export const sound = new SoundEngine();

/**
 * Korean speech synthesis for winner announcement
 */
export function speakStudentWinner(studentNames: string[]) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    let text = '';
    if (studentNames.length === 1) {
      text = `축하합니다! 오늘의 발표자는 ${studentNames[0]} 학생입니다!`;
    } else {
      text = `축하합니다! 발표자는 ${studentNames.join(', ')} 학생입니다!`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    // Try finding a Korean voice
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.startsWith('ko'));
    if (koVoice) {
      utterance.voice = koVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // TTS ignore
  }
}
