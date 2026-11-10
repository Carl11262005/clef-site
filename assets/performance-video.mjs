// Decorative media: no source is attached until playback is appropriate.
export function initPerformanceVideo(panel, {doc = document, win = window} = {}) {
  const video = panel.querySelector('video');
  const poster = panel.querySelector('.performance-image');
  const clips = [{src: video.dataset.src, poster: video.poster}];
  if (video.dataset.nextSrc) clips.push({src: video.dataset.nextSrc, poster: video.dataset.nextPoster});
  let clipIndex = 0;
  let loadedIndex = -1;
  const button = doc.querySelector('[data-video-toggle]');
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let optedIn = false;
  let userPaused = false;
  let blocked = false;
  let failed = false;
  let pending = false;
  const otherPlayers = new Set();
  video.muted = true;
  button.hidden = false;

  const motionEnabled = () => !userPaused && !blocked && !failed
    && (optedIn || (!motion.matches && !win.navigator?.connection?.saveData));
  const shouldPlay = () => visible && !doc.hidden && !otherPlayers.size && motionEnabled();
  function showPlaying(playing) {
    panel.dataset.playing = String(playing);
    button.textContent = motionEnabled() ? 'Background Motion: On' : 'Background Motion: Off';
    button.setAttribute('aria-pressed', String(motionEnabled()));
  }
  function stop() {
    video.pause();
    showPlaying(false);
  }
  function reconcile() {
    if (!shouldPlay()) { stop(); return; }
    if (!video.paused || pending) return;
    if (loadedIndex !== clipIndex) {
      const clip = clips[clipIndex];
      showPlaying(false);
      panel.dataset.clip = String(clipIndex + 1);
      video.poster = clip.poster;
      if (poster) poster.src = clip.poster;
      video.src = clip.src;
      loadedIndex = clipIndex;
    }
    pending = true;
    Promise.resolve(video.play()).then(() => {
      pending = false;
      if (!shouldPlay()) stop();
    }).catch(() => {
      pending = false;
      // Scrolling or changing preferences may abort an in-flight play request.
      if (shouldPlay()) blocked = true;
      showPlaying(false);
    });
  }
  button.addEventListener('click', () => {
    if (motionEnabled()) userPaused = true;
    else { userPaused = false; blocked = false; optedIn = true; }
    reconcile();
  });
  video.addEventListener('playing', () => {
    if (shouldPlay()) showPlaying(true);
    else stop();
  });
  video.addEventListener('pause', () => showPlaying(false));
  video.addEventListener('ended', () => {
    clipIndex = (clipIndex + 1) % clips.length;
    reconcile();
  });
  video.addEventListener('error', () => {
    failed = true;
    stop();
    button.hidden = true;
  });
  motion.addEventListener('change', () => { optedIn = false; reconcile(); });
  doc.addEventListener('visibilitychange', reconcile);
  // Future user-initiated app video takes priority; no player is created here.
  doc.addEventListener('play', event => {
    if (event.target !== video && event.target.tagName === 'VIDEO') {
      otherPlayers.add(event.target); reconcile();
    }
  }, true);
  for (const name of ['pause', 'ended', 'error', 'emptied']) {
    doc.addEventListener(name, event => {
      if (otherPlayers.delete(event.target)) reconcile();
    }, true);
  }
  showPlaying(false);
  if (win.IntersectionObserver) {
    const observer = new win.IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .1;
      reconcile();
    }, {threshold: [0, .1]});
    observer.observe(panel);
  } else {
    // Without visibility tracking, keep the still until deliberately played.
    visible = true;
    userPaused = true;
  }
}
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-performance-video]').forEach(panel => initPerformanceVideo(panel));
}
