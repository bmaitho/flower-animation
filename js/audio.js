// public/js/audio.js
// Lightweight playlist player with Play/Pause, Prev/Next, Replay, Mute.
// Autoplay-friendly (respects browser policies), with keyboard shortcuts.
// Persists last track index + volume in localStorage.

(() => {
  // ===== CONFIG =====
  const PLAYLIST = [
    { src: "img/Pink Matter - Frank Ocean (youtube).mp3", title: "Pink Matter — Frank Ocean" },
   
    { src: "img/Brandy & Monica - The Boy Is Mine  Lyrics - Dark City Sounds (youtube).mp3",     title: "" },
    { src: "img/Mitski - My Love Mine All Mine - LatinHype (youtube).mp3",    title: "" },
    { src: "img/image.mp3",    title: "" },
    { src: "img/image.mp3",    title: "" },
    { src: "img/track5.mp3",                     title: "" },
  ];

  const START_VOLUME = Number(localStorage.getItem("ln_audio_vol") ?? 0.9);
  const START_INDEX  = Number(localStorage.getItem("ln_audio_idx") ?? 0);

  // ===== STATE =====
  let idx = isFinite(START_INDEX) ? (START_INDEX % PLAYLIST.length + PLAYLIST.length) % PLAYLIST.length : 0;
  const audio = new Audio();
  audio.preload = "auto";
  audio.loop = false; // we auto-advance instead of looping a single track
  audio.volume = Math.max(0, Math.min(1, START_VOLUME));
  let userPaused = false; // if true, we won't auto-resume on focus/interaction

  // ===== HELPERS =====
  const tryPlay = () => audio.play().catch(() => {});
  const resumeIfAllowed = () => (!userPaused && audio.paused ? tryPlay() : void 0);

  function loadTrack(i, { autoplay = true } = {}) {
    idx = (i % PLAYLIST.length + PLAYLIST.length) % PLAYLIST.length;
    localStorage.setItem("ln_audio_idx", String(idx));
    const track = PLAYLIST[idx];
    audio.src = track.src;
    audio.currentTime = 0;
    // Only attempt play if allowed
    if (autoplay && !userPaused) tryPlay();
    updateUI();
  }

  function nextTrack({ autoplay = true } = {}) {
    loadTrack(idx + 1, { autoplay });
  }
  function prevTrack({ autoplay = true } = {}) {
    // if near the beginning of the song, go to previous, else just restart
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      tryPlay();
    } else {
      loadTrack(idx - 1, { autoplay });
    }
  }

  // ===== UI =====
  let wrap, titleEl, playBtn, prevBtn, nextBtn, replayBtn, muteBtn;

  function buildControls() {
    const css = `
      #audio-ctl{
        position:fixed; right:16px; bottom:16px; z-index:99999;
        display:flex; gap:8px; align-items:center; flex-wrap:wrap;
        background: rgba(0,0,0,0.35); backdrop-filter: blur(6px);
        border-radius: 12px; padding: 8px 10px; user-select:none;
      }
      #audio-ctl button{
        border: 0; cursor: pointer; padding: 6px 10px; border-radius: 10px;
        background: rgba(255,255,255,0.88); font: 600 13px/1 system-ui, -apple-system, Segoe UI, Roboto;
      }
      #audio-ctl button:hover { background: rgba(255,255,255,0.98); }
      #audio-ctl .title{
        color:#fff; font: 600 12px/1 system-ui, -apple-system; margin-right: 4px;
        max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    wrap     = document.createElement("div"); wrap.id = "audio-ctl";
    titleEl  = document.createElement("span"); titleEl.className = "title";
    prevBtn  = document.createElement("button"); prevBtn.textContent = "⏮︎";
    playBtn  = document.createElement("button"); playBtn.textContent = "Play";
    nextBtn  = document.createElement("button"); nextBtn.textContent = "⏭︎";
    replayBtn= document.createElement("button"); replayBtn.textContent = "Replay";
    muteBtn  = document.createElement("button"); muteBtn.textContent = audio.muted ? "Unmute" : "Mute";

    prevBtn.title = "Previous (P)";
    nextBtn.title = "Next (N)";
    replayBtn.title = "Replay (R)";
    playBtn.title = "Play/Pause (Space)";
    muteBtn.title = "Mute/Unmute (M)";

    prevBtn.onclick = () => { userPaused = false; prevTrack({ autoplay:true }); };
    nextBtn.onclick = () => { userPaused = false; nextTrack({ autoplay:true }); };
    replayBtn.onclick = () => { audio.currentTime = 0; if (!userPaused) tryPlay(); updateUI(); };
    playBtn.onclick = () => {
      if (audio.paused) { userPaused = false; tryPlay(); }
      else { userPaused = true; audio.pause(); }
      updateUI();
    };
    muteBtn.onclick = () => { audio.muted = !audio.muted; updateUI(); };

    wrap.appendChild(titleEl);
    wrap.appendChild(prevBtn);
    wrap.appendChild(playBtn);
    wrap.appendChild(nextBtn);
    wrap.appendChild(replayBtn);
    wrap.appendChild(muteBtn);
    document.body.appendChild(wrap);

    // Keyboard shortcuts (ignore when typing in inputs)
    document.addEventListener("keydown", (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (/(INPUT|TEXTAREA|SELECT)/i.test(tag)) return;
      if (e.code === "Space") { e.preventDefault(); playBtn.click(); }
      else if (e.key === "n" || e.key === "N") nextBtn.click();
      else if (e.key === "p" || e.key === "P") prevBtn.click();
      else if (e.key === "r" || e.key === "R") replayBtn.click();
      else if (e.key === "m" || e.key === "M") muteBtn.click();
    });
  }

  function updateUI() {
    const track = PLAYLIST[idx];
    titleEl.textContent = track ? track.title : "Audio";
    playBtn.textContent = (!audio.paused && !audio.ended) ? "Pause" : "Play";
    muteBtn.textContent = audio.muted ? "Unmute" : "Mute";
  }

  // Reflect state changes
  ["play","pause","ended","volumechange","timeupdate"].forEach(evt => {
    audio.addEventListener(evt, () => {
      if (evt === "volumechange") {
        // persist volume (ignore muted toggle)
        if (!audio.muted) localStorage.setItem("ln_audio_vol", String(audio.volume));
      }
      updateUI();
    });
  });

  // Auto-advance when a song ends
  audio.addEventListener("ended", () => nextTrack({ autoplay: true }));

  // Try to autoplay politely
  const tryBoot = () => { tryPlay(); buildControls(); updateUI(); };
  window.addEventListener("load", tryBoot);

  // Nudge autoplay policies on interaction / focus
  ["click","touchstart"].forEach(evt => document.addEventListener(evt, resumeIfAllowed, {passive:true}));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) resumeIfAllowed(); });

  // Load initial track (respect stored index)
  loadTrack(idx, { autoplay: false });

  // Expose for debugging (optional)
  window._lnAudio = { audio, PLAYLIST, next: () => nextTrack({autoplay:true}), prev: () => prevTrack({autoplay:true}) };
})();
