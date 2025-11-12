// Global type declarations for the Chesse project

// Extend Window interface for webkit audio context (legacy Safari support)
interface Window {
  webkitAudioContext?: typeof AudioContext;
  DEBUG?: boolean;
}
