const audio = new Audio('/title-theme.mp3');
audio.loop = true;
audio.volume = 0.6;

export function playTitleTheme() {
  if (audio.paused) audio.play().catch(() => {});
}

export function fadeOutTitleTheme(duration = 1500) {
  const steps = 30;
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
