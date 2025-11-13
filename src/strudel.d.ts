/**
 * Type declarations for @strudel/core
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

  export function note(value: string): Pattern<any>;
  export function s(value: string): Pattern<any>;
  export function stack(...patterns: Pattern<any>[]): Pattern<any>;
  export function seq(...values: string[]): Pattern<any>;

  export type { Pattern };
}
