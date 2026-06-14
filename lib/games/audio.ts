let unlocked = false;

/** Call on first user pointer/touch so later playSound calls succeed. */
export function unlockAudio() {
  unlocked = true;
}

export function playSound(src: string, volume = 0.5) {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    void audio.play().catch(() => {
      /* autoplay blocked until user gesture — safe to ignore */
    });
  } catch {
    /* ignore */
  }
}

export function isAudioUnlocked() {
  return unlocked;
}

/** Play only after the user has interacted (avoids dev-overlay NotAllowedError). */
export function playGameSound(src: string, volume = 0.5) {
  if (!unlocked) return;
  playSound(src, volume);
}
