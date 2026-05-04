const audio = new Audio('/title-theme.mp3');
audio.loop   = true;
audio.volume = 0.6;

// Try to start playback immediately (works if browser allows autoplay)
audio.play().catch(() => {});

// Module-level fallback: play on the very first user interaction.
// Runs once, then removes itself. Survives component unmounts.
function startOnInteraction() {
  playTitleTheme();
  document.removeEventListener('click',      startOnInteraction);
  document.removeEventListener('touchstart', startOnInteraction);
  document.removeEventListener('keydown',    startOnInteraction);
}
document.addEventListener('click',      startOnInteraction);
document.addEventListener('touchstart', startOnInteraction);
document.addEventListener('keydown',    startOnInteraction);

export function playTitleTheme() {
  audio.volume = 0.6;   // always reset — fadeOut sets it to 0
  if (audio.paused) audio.play().catch(() => {});
}

export function fadeOutTitleTheme(duration = 1500) {
  const steps    = 30;
  const interval = duration / steps;
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
