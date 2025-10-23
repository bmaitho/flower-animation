// js/audio.js
// Autoplay-friendly audio with Play/Pause + Replay controls, no onload clobber.

(() => {
    // --- CONFIG ---
    const AUDIO_URL = "img/Floricienta.mp3"; // <- keep your URL
    const START_VOLUME = 0.9;
  
    // --- STATE ---
    const myAudio = new Audio(AUDIO_URL);
    myAudio.loop = true;
    myAudio.preload = "auto";
    myAudio.volume = START_VOLUME;
  
    // Track whether the user explicitly paused; if true, we won't auto-resume
    let userPaused = false;
  
    // --- HELPERS ---
    const tryPlay = () => myAudio.play().catch(() => {});
    const resumeIfAllowed = () => {
      if (!userPaused && myAudio.paused) tryPlay();
    };
  
    // --- BOOTSTRAP (non-destructive) ---
    window.addEventListener("load", () => {
      // Attempt autoplay but don't throw if blocked
      tryPlay();
      buildControls();
      updateUI();
    });
  
    // Nudge autoplay policies
    ["click", "touchstart"].forEach(evt =>
      document.addEventListener(evt, () => {
        resumeIfAllowed();
      })
    );
  
    // Resume on tab focus, but only if the user didn't manually pause
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) resumeIfAllowed();
    });
  
    // --- UI CONTROLS (injected, no HTML edits needed) ---
    let ctrlWrap, toggleBtn, replayBtn, muteBtn, statusSpan;
  
    function buildControls() {
      // Inject minimal styles so we don't touch your CSS files
      const css = `
        #audio-ctl{
          position:fixed; right:16px; bottom:16px; z-index:99999;
          display:flex; gap:8px; align-items:center;
          background: rgba(0,0,0,0.35); backdrop-filter: blur(6px);
          border-radius: 10px; padding: 8px 10px; user-select:none;
        }
        #audio-ctl button{
          border: none; outline: none; cursor: pointer;
          padding: 6px 10px; border-radius: 8px;
          background: rgba(255,255,255,0.85);
          font: 500 13px/1 system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans";
        }
        #audio-ctl button:hover{ background: rgba(255,255,255,0.95); }
        #audio-ctl .stat{ color: #fff; font: 600 12px/1 system-ui, -apple-system; margin-right: 4px; }
      `;
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
  
      ctrlWrap = document.createElement("div");
      ctrlWrap.id = "audio-ctl";
      statusSpan = document.createElement("span");
      statusSpan.className = "stat";
      statusSpan.textContent = "Audio";
  
      toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.setAttribute("aria-label", "Play or Pause");
      toggleBtn.addEventListener("click", () => {
        if (myAudio.paused) {
          userPaused = false;
          tryPlay();
        } else {
          userPaused = true;
          myAudio.pause();
        }
        updateUI();
      });
  
      replayBtn = document.createElement("button");
      replayBtn.type = "button";
      replayBtn.textContent = "Replay";
      replayBtn.setAttribute("aria-label", "Replay from start");
      replayBtn.addEventListener("click", () => {
        myAudio.currentTime = 0;
        if (!userPaused) tryPlay();
        updateUI();
      });
  
      muteBtn = document.createElement("button");
      muteBtn.type = "button";
      muteBtn.setAttribute("aria-label", "Mute or Unmute");
      muteBtn.addEventListener("click", () => {
        myAudio.muted = !myAudio.muted;
        updateUI();
      });
  
      ctrlWrap.appendChild(statusSpan);
      ctrlWrap.appendChild(toggleBtn);
      ctrlWrap.appendChild(replayBtn);
      ctrlWrap.appendChild(muteBtn);
      document.body.appendChild(ctrlWrap);
  
      // Keyboard UX: Space = toggle, R = replay, M = mute
      document.addEventListener("keydown", (e) => {
        const tag = (e.target && e.target.tagName) || "";
        if (/(INPUT|TEXTAREA|SELECT)/i.test(tag)) return;
        if (e.code === "Space") {
          e.preventDefault();
          toggleBtn.click();
        } else if (e.key === "r" || e.key === "R") {
          replayBtn.click();
        } else if (e.key === "m" || e.key === "M") {
          muteBtn.click();
        }
      });
    }
  
    function updateUI() {
      const playing = !myAudio.paused && !myAudio.ended;
      statusSpan.textContent = playing ? "Playing" : (userPaused ? "Paused" : "Idle");
      toggleBtn.textContent = playing ? "Pause" : "Play";
      muteBtn.textContent = myAudio.muted ? "Unmute" : "Mute";
    }
  
    // Reflect state changes on the UI
    ["play", "pause", "ended", "volumechange", "timeupdate"].forEach(evt =>
      myAudio.addEventListener(evt, updateUI)
    );
  
    // Expose globally only if you need it elsewhere
    window.myAudio = myAudio;
  })();