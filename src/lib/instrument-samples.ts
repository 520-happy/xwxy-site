import { ac, midiFreq } from "./audio";

export type Instrument = "piano" | "guitar-acoustic";
export interface InstrumentVoice {
  release: (seconds?: number) => void;
}
const SAMPLE_NOTES: Record<Instrument, Record<string, number>> = {
  piano: {
    C3: 48,
    Ds3: 51,
    Fs3: 54,
    A3: 57,
    C4: 60,
    Ds4: 63,
    Fs4: 66,
    A4: 69,
    C5: 72,
    Ds5: 75,
    Fs5: 78,
    A5: 81,
    C6: 84,
  },
  "guitar-acoustic": {
    E2: 40,
    A2: 45,
    E3: 52,
    D3: 50,
    G3: 55,
    B3: 59,
    E4: 64,
    A4: 69,
    C5: 72,
  },
};
const banks = new Map<Instrument, Map<number, AudioBuffer>>();
const pending = new Map<Instrument, Promise<boolean>>();

/** Samples live on this site's own origin. Failed downloads can be retried. */
export function loadInstrument(instrument: Instrument): Promise<boolean> {
  const existing = pending.get(instrument);
  if (existing) return existing;
  const c = ac();
  const bank = banks.get(instrument) ?? new Map<number, AudioBuffer>();
  banks.set(instrument, bank);
  const job = Promise.allSettled(
    Object.entries(SAMPLE_NOTES[instrument]).map(async ([name, midi]) => {
      if (bank.has(midi)) return;
      const response = await fetch(`/audio/${instrument}/${name}.mp3`, {
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`Sample ${response.status}`);
      bank.set(midi, await c.decodeAudioData(await response.arrayBuffer()));
    }),
  ).then(() => {
    pending.delete(instrument);
    return bank.size === Object.keys(SAMPLE_NOTES[instrument]).length;
  });
  pending.set(instrument, job);
  return job;
}

export function sampledVoice(
  instrument: Instrument,
  midi: number,
  velocity = 0.7,
  when?: number,
): InstrumentVoice {
  if (velocity <= 0) return { release() {} };
  const c = ac();
  const t = Math.max(c.currentTime, when ?? c.currentTime);
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  const v = Math.max(0.02, Math.min(1, velocity));
  filter.type = "lowpass";
  filter.frequency.value = 2200 + v * 10500;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(
    v * (instrument === "piano" ? 0.6 : 0.8),
    t + 0.006,
  );
  filter.connect(gain);
  gain.connect(c.destination);
  const bank = banks.get(instrument);
  let source: AudioBufferSourceNode | OscillatorNode;
  if (bank?.size) {
    const nearest = [...bank.keys()].reduce((a, b) =>
      Math.abs(b - midi) < Math.abs(a - midi) ? b : a,
    );
    const sample = c.createBufferSource();
    sample.buffer = bank.get(nearest)!;
    sample.playbackRate.value = 2 ** ((midi - nearest) / 12);
    source = sample;
  } else {
    const osc = c.createOscillator();
    osc.frequency.value = midiFreq(midi);
    osc.type = "triangle";
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    source = osc;
  }
  source.connect(filter);
  source.start(t);
  source.stop(t + 18);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  };
  let released = false;
  return {
    release(seconds = 0.16) {
      if (released) return;
      released = true;
      const now = c.currentTime;
      gain.gain.cancelAndHoldAtTime(now);
      gain.gain.linearRampToValueAtTime(0, now + seconds);
      try {
        source.stop(now + seconds + 0.02);
      } catch {
        /* already ended */
      }
    },
  };
}

export function instrumentReady(instrument: Instrument): boolean {
  return (
    (banks.get(instrument)?.size ?? 0) ===
    Object.keys(SAMPLE_NOTES[instrument]).length
  );
}
