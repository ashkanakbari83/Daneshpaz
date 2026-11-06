/**
 * Timer-finished alert: three beeps plus vibration. Browsers only allow sound
 * after a user gesture, so call prepareAudio() from the «شروع تایمر» click.
 * Limitation: nothing can ring if the browser is closed (needs push, later phase).
 */
let audioContext = null;

export function prepareAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext = audioContext || new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume();
  } catch {
    /* audio unavailable */
  }
}

export function playAlarm() {
  try {
    if (audioContext) {
      const start = audioContext.currentTime;
      [0, 0.35, 0.7].forEach((offset) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.4, start + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.28);
        osc.connect(gain).connect(audioContext.destination);
        osc.start(start + offset);
        osc.stop(start + offset + 0.3);
      });
    }
  } catch {
    /* ignore */
  }
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {
    /* ignore */
  }
}
