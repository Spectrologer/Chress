/**
 * Type declarations for Strudel modules
 */

declare module '@strudel/core' {
  export interface Pattern<T> {
    note(): Pattern<T>;
    sound(sound: string): Pattern<T>;
    room(value: number): Pattern<T>;
    gain(value: number): Pattern<T>;
    lpf(frequency: number): Pattern<T>;
    slow(factor: number): Pattern<T>;
    struct(pattern: string): Pattern<T>;
    cpm(tempo: number): Pattern<T>;
    fast(factor: number): Pattern<T>;
  }

  export interface Scheduler {
    start(): void;
    stop(): void;
    setPattern(pattern: Pattern<any>): void;
  }

  export interface ReplOptions {
    defaultOutput?: (audioContext: AudioContext) => any;
    getTime?: () => number;
  }

  export interface ReplInstance {
    scheduler: Scheduler;
  }

  export function note(value: string): Pattern<any>;
  export function s(value: string): Pattern<any>;
  export function stack(...patterns: Pattern<any>[]): Pattern<any>;
  export function seq(...values: string[]): Pattern<any>;
  export function repl(options?: ReplOptions): ReplInstance;

  // Standalone effect functions
  export function gain(value: number): Pattern<any>;
  export function room(value: number): Pattern<any>;
  export function lpf(frequency: number): Pattern<any>;
  export function attack(value: number): Pattern<any>;
  export function decay(value: number): Pattern<any>;

  export type { Pattern };
}

declare module '@strudel/webaudio' {
  export function getAudioContext(): AudioContext;
  export function webaudioOutput(audioContext: AudioContext): any;
  export function initAudioOnFirstClick(): Promise<void>;
  export function samples(sampleMap: Record<string, string[]>, baseUrl?: string): Promise<void>;
}

declare module 'superdough' {
  export function registerSynthSounds(): Promise<void>;
}

declare module '@strudel/soundfonts' {
  export function registerSoundfonts(): Promise<void>;
}
