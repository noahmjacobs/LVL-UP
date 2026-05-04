const audio = new Audio('/title-theme.mp3');
audio.loop   = true;
audio.volume = 0.6;

// Once fadeOutTitleTheme() is called, we never auto-restart the music.
let musicStopped = false;

// Try to start playback immediately (works if browser allows autoplay)
audio.play().catch(() => {});

// Module-level fallback: play on the very first user interaction.
// Skipped if music has been deliberately stopped. Removes itself after firing.
function startOnInteraction() {
  document.removeEventListener('click',      startOnInteraction);
  document.removeEventListener('touchstart', startOnInteraction);
  document.removeEventListener('keydown',    startOnInteraction);
  if (!musicStopped) playTitleTheme();
}
document.addEventListener('click',      startOnInteraction);
document.addEventListener('touchstart', startOnInteraction);
document.addEventListener('keydown',    startOnInteraction);

export function playTitleTheme() {
  musicStopped = false;
  audio.volume = 0.6;   // always reset — fadeOut sets it to 0
  if (audio.paused) audio.play().catch(() => {});
}

export function fadeOutTitleTheme(duration = 1500) {
  musicStopped = true;  // prevent any auto-restart after this point
  const steps     = 30;
  const interval  = duration / steps;
  const decrement = audio.volume / steps;
  const fade = setInterval(() => {
    if (audio.volume > decrement) {
      audio.volume -= decrement;
    } else {
      audio.volume = 0;
      audio.pause();
      audio.currentTime = 0;
      clearInterval(fade);
    }
  }, interval);
}
