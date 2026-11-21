/* =========================================================
   来自星星的一封信 · lqnhwx1314
   Vanilla JS · no dependencies
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (min, max) => Math.random() * (max - min) + min;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /* -------------------------------------------------------
     Letter content
     {{...}} = pink highlight. Paragraph breaks are intentional.
     ------------------------------------------------------- */
  const LETTER = [
    { lead: true, text: '亲爱的云小娜小姐' },
    {
      text: '哦不对，或许应该称你为{{小馋猫小姐}}，当你读到这封信的时候请不妨看看你旁边那位先生，他可能此时已经紧张的说不出话了，所以可以的话请你抱抱他，表示你对他的肯定。'
    },
    {
      text: '我有很多想对你说的话，但篇幅有限，我想告诉你我对你的喜欢不止一星半点，它虽然并不盛大也不炽热，但它足够温暖也足够明亮，我想通过这种特殊的方式来告诉你，亲爱的楼俏娜小姐，{{我喜欢你！}}你可以{{做我女朋友嘛~}}我想永远永远永远和你在一起，哪怕我比较笨，会惹你生气，但我会用我的方式去喜欢你，去照顾你，去陪伴你。'
    },
    {
      text: '你之前问我现在你有多少分了，我回答的是{{99分}}，你想知道为什么一直都是99分吗，因为我希望最后的一分我们彼此可以用余生来填充，世界上没有完美的人，也没有完美的伴侣，但{{喜欢可抵万难}}，所以我希望我们彼此相互坚定，相互理解，相互包容，这样我们就可以无限趋近于完美啦～。'
    },
    {
      text: '数学里面有一个词叫做{{有且仅有}}，当下具体而又生动，是因为在我身边{{有且仅有一个你}}❤️'
    },
    {
      text: '当你很生气的时候不妨多给他一点点时间，或者告诉他该怎么哄你。有时候直来直去的喜欢比不清不楚的猜测要幸福的多的多的多。你家哥哥可能确实猜不出来呢，所以答应我，以后{{不要让我猜来猜去}}了好嘛（看向你的旁边，会有一双期待的大眼睛看着你嘻嘻）'
    },
    {
      text: '好啦～看到这里会不会感动的想哭呢，哼哼，放心好了，伟大的何文鑫小哥哥已经完美想到了这一点，所以请你再次看向你的旁边。不要哭了捏，希望来上海的第一年是{{我们的开始，也是我们的归宿}}。'
    },
    { closing: true, text: '喜欢你❤' }
  ];

  const state = {
    started: false,
    scene: 'gate',
    typing: false,
    token: 0,
    letterDone: false,
    userScrolled: false,
    catTimers: [],
    toastTimer: null,
    typingStartTimer: null
  };

  /* -------------------------------------------------------
     Elements
     ------------------------------------------------------- */
  const gate = $('#gate');
  const startBtn = $('#startBtn');
  const envelope = $('#envelope');
  const openBtn = $('#openBtn');
  const scenes = $$('.scene');
  const letterScroll = $('#letterScroll');
  const letterTopbar = $('.letter-topbar');
  const skipBtn = $('#skipBtn');
  const paper = $('#paper');
  const letterBody = $('#letterBody');
  const letterActions = $('#letterActions');
  const rejectBtn = $('#rejectBtn');
  const acceptBtn = $('#acceptBtn');
  const catPop = $('#catPop');
  const catBubbleText = $('.cat-bubble strong');
  const finalScroll = $('#finalScroll');
  const photoItems = $$('.photo-item');
  const lightbox = $('#lightbox');
  const lightboxBackdrop = $('#lightboxBackdrop');
  const lightboxImg = $('#lightboxImg');
  const lightboxCaption = $('#lightboxCaption');
  const lightboxCount = $('#lightboxCount');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');
  const moreLoveBtn = $('#moreLoveBtn');
  const rereadBtn = $('#rereadBtn');
  const heartLayer = $('#heartLayer');
  const toast = $('#toast');

  const musicDock = $('#musicDock');
  const musicFab = $('#musicFab');
  const musicPanel = $('#musicPanel');
  const playBtn = $('#playBtn');
  const volumeInput = $('#volume');
  const volumeOut = $('#volumeOut');
  const sfxBtn = $('#sfxBtn');
  const bgmFile = $('#bgmFile');
  const musicHint = $('#musicHint');
  const bgm = $('#bgm');

  /* -------------------------------------------------------
     Tiny synthesized sound kit (Web Audio)
     ------------------------------------------------------- */
  const Sound = (() => {
    let ac = null;
    let master = null;
    let enabled = true;
    let lastTick = 0;

    function unlock() {
      if (ac) {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        return ac;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ac = new AC();
      } catch (err) {
        return null;
      }
      master = ac.createGain();
      master.gain.value = 0.5;
      master.connect(ac.destination);
      return ac;
    }

    function ctxOrNull() {
      if (!enabled) return null;
      return unlock();
    }

    function tone(freq, dur, opts = {}) {
      const c = ctxOrNull();
      if (!c) return;
      const { type = 'sine', gain = 0.1, when = 0, freqEnd = null, filter = null } = opts;
      const t0 = c.currentTime + when;
      const osc = c.createOscillator();
      const amp = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      }
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.014);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      let tail = osc;
      if (filter) {
        const bq = c.createBiquadFilter();
        bq.type = filter.type || 'lowpass';
        bq.frequency.setValueAtTime(filter.freq || 1200, t0);
        bq.Q.value = filter.q == null ? 0.9 : filter.q;
        tail.connect(bq);
        bq.connect(amp);
      } else {
        tail.connect(amp);
      }
      amp.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    }

    function noise(dur = 0.3, opts = {}) {
      const c = ctxOrNull();
      if (!c) return;
      const { gain = 0.05, when = 0, from = 400, to = 2000, q = 0.8, type = 'bandpass' } = opts;
      const t0 = c.currentTime + when;
      const frames = Math.max(1, Math.floor(c.sampleRate * dur));
      const buffer = c.createBuffer(1, frames, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;

      const src = c.createBufferSource();
      src.buffer = buffer;
      const bq = c.createBiquadFilter();
      bq.type = type;
      bq.Q.value = q;
      bq.frequency.setValueAtTime(Math.max(20, from), t0);
      bq.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
      const amp = c.createGain();
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      src.connect(bq);
      bq.connect(amp);
      amp.connect(master);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    }

    return {
      unlock,
      get enabled() {
        return enabled;
      },
      setEnabled(value) {
        enabled = Boolean(value);
        if (enabled) {
          unlock();
          this.tap();
        }
      },
      tap() {
        tone(880, 0.05, { type: 'triangle', gain: 0.022 });
      },
      pop() {
        tone(300, 0.16, { type: 'sine', gain: 0.16, freqEnd: 880 });
        noise(0.07, { gain: 0.05, from: 900, to: 2800 });
        tone(1180, 0.1, { type: 'triangle', gain: 0.03, when: 0.06 });
      },
      open() {
        noise(0.55, { gain: 0.075, from: 280, to: 2400, q: 0.7 });
        tone(180, 0.5, { type: 'triangle', gain: 0.035, freqEnd: 82 });
      },
      chime() {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          tone(freq, 1.15, { type: 'triangle', gain: 0.052, when: i * 0.075 });
        });
      },
      tick() {
        const now = performance.now();
        if (now - lastTick < 48) return;
        lastTick = now;
        tone(1380, 0.022, { type: 'square', gain: 0.011 });
      },
      meow() {
        tone(820, 0.24, { type: 'sawtooth', gain: 0.045, freqEnd: 420, filter: { type: 'lowpass', freq: 1500 } });
        tone(1180, 0.16, { type: 'sine', gain: 0.035, freqEnd: 700, when: 0.06 });
        tone(520, 0.24, { type: 'triangle', gain: 0.04, freqEnd: 780, when: 0.19 });
      },
      fanfare() {
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
          tone(freq, 0.95, { type: 'triangle', gain: 0.05, when: i * 0.085 });
        });
        noise(0.5, { gain: 0.028, from: 1200, to: 4200 });
      }
    };
  })();

  /* -------------------------------------------------------
     Background music
     ------------------------------------------------------- */
  const BGM_VOLUME_KEY = 'lqnhwx-bgm-volume';
  const SFX_KEY = 'lqnhwx-sfx-on';
  let bgmVolume = clamp(parseFloat(window.localStorage.getItem(BGM_VOLUME_KEY) || '0.6'), 0, 1);
  let bgmFailed = false;
  let bgmPlaying = false;
  let bgmObjectUrl = null;
  let fadeFrame = null;

  if (Number.isNaN(bgmVolume)) bgmVolume = 0.6;
  if (window.localStorage.getItem(SFX_KEY) === 'off') {
    Sound.setEnabled(false);
  }

  function setVolumeUI(value) {
    const percent = Math.round(value * 100);
    volumeInput.value = String(percent);
    volumeOut.textContent = String(percent);
  }

  function cancelFade() {
    if (fadeFrame) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
  }

  function fadeBgm(target, duration = 1200) {
    cancelFade();
    const start = bgm.volume;
    const from = performance.now();
    const step = (now) => {
      const progress = clamp((now - from) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      bgm.volume = clamp(start + (target - start) * eased, 0, 1);
      if (progress < 1) {
        fadeFrame = requestAnimationFrame(step);
      } else {
        fadeFrame = null;
        bgm.volume = clamp(target, 0, 1);
      }
    };
    fadeFrame = requestAnimationFrame(step);
  }

  function updatePlayUI(playing) {
    bgmPlaying = playing;
    musicDock.classList.toggle('is-playing', playing);
    musicDock.classList.toggle('is-paused', !playing);
    playBtn.textContent = playing ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
  }

  function showMusicMissing() {
    musicHint.textContent = 'BGM 无法播放：请确认是普通的 mp3 / m4a / wav（网易云 NCM 等加密格式不能直接播），或点「本机音乐」选一首。';
    musicHint.classList.add('is-error');
  }

  function playBgm({ fade = false } = {}) {
    if (bgmFailed) {
      updatePlayUI(false);
      showMusicMissing();
      return;
    }
    if (fade) {
      cancelFade();
      bgm.volume = 0;
    }
    let promise = null;
    try {
      promise = bgm.play();
    } catch (error) {
      updatePlayUI(false);
      return;
    }
    if (!promise || typeof promise.then !== 'function') {
      updatePlayUI(true);
      return;
    }
    promise
      .then(() => {
        updatePlayUI(true);
        if (fade) fadeBgm(bgmVolume, 1700);
        else bgm.volume = bgmVolume;
        musicHint.classList.remove('is-error');
      })
      .catch(() => {
        updatePlayUI(false);
        if (bgmFailed) showMusicMissing();
      });
  }

  function pauseBgm() {
    cancelFade();
    bgm.pause();
    updatePlayUI(false);
  }

  function tryAutoplayBgm() {
    if (bgmFailed) return;
    bgm.volume = bgmVolume;
    bgm.currentTime = 0;
    let promise = null;
    try {
      promise = bgm.play();
    } catch (error) {
      updatePlayUI(false);
      return;
    }
    if (!promise || typeof promise.then !== 'function') return;
    promise
      .then(() => updatePlayUI(true))
      .catch(() => {
        updatePlayUI(false);
        if (bgmFailed) showMusicMissing();
      });
  }

  bgm.volume = bgmVolume;
  setVolumeUI(bgmVolume);

  bgm.addEventListener('error', () => {
    bgmFailed = true;
    updatePlayUI(false);
    showMusicMissing();
  });

  bgm.addEventListener('canplay', () => {
    bgmFailed = false;
    musicHint.classList.remove('is-error');
    if (!bgmObjectUrl) {
      musicHint.textContent = '音乐已就绪 · 左上角 ♪ 可随时暂停或调音量';
    }
  });

  if (bgm.error) {
    bgmFailed = true;
    showMusicMissing();
  } else if (bgm.readyState >= 3 && !bgmObjectUrl) {
    musicHint.textContent = '音乐已就绪 · 左上角 ♪ 可随时暂停或调音量';
  }

  playBtn.addEventListener('click', () => {
    if (bgmPlaying) {
      pauseBgm();
    } else {
      playBgm({ fade: false });
    }
  });

  volumeInput.addEventListener('input', () => {
    const value = clamp(parseInt(volumeInput.value, 10) / 100, 0, 1);
    bgmVolume = value;
    setVolumeUI(value);
    window.localStorage.setItem(BGM_VOLUME_KEY, String(value));
    cancelFade();
    bgm.volume = value;
  });

  sfxBtn.addEventListener('click', () => {
    const next = !Sound.enabled;
    Sound.setEnabled(next);
    sfxBtn.setAttribute('aria-pressed', String(next));
    sfxBtn.textContent = next ? '音效 · 开' : '音效 · 关';
    window.localStorage.setItem(SFX_KEY, next ? 'on' : 'off');
  });

  if (!Sound.enabled) {
    sfxBtn.setAttribute('aria-pressed', 'false');
    sfxBtn.textContent = '音效 · 关';
  }

  bgmFile.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (bgmObjectUrl) URL.revokeObjectURL(bgmObjectUrl);
    bgmObjectUrl = URL.createObjectURL(file);
    bgmFailed = false;
    bgm.src = bgmObjectUrl;
    bgm.load();
    updatePlayUI(false);
    musicHint.textContent = `已换成本机音乐：${file.name}（刷新页面后需重新选择）`;
    musicHint.classList.remove('is-error');
    playBgm({ fade: true });
    showToast('换成这首歌啦 ♪');
  });

  function openMusicPanel() {
    musicDock.classList.add('is-open');
    musicFab.setAttribute('aria-expanded', 'true');
    musicPanel.setAttribute('aria-hidden', 'false');
  }

  function closeMusicPanel() {
    musicDock.classList.remove('is-open');
    musicFab.setAttribute('aria-expanded', 'false');
    musicPanel.setAttribute('aria-hidden', 'true');
  }

  musicFab.addEventListener('click', () => {
    if (musicDock.classList.contains('is-open')) closeMusicPanel();
    else openMusicPanel();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!musicDock.classList.contains('is-open')) return;
    if (!musicDock.contains(event.target)) closeMusicPanel();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMusicPanel();
  });

  /* -------------------------------------------------------
     Scene management
     ------------------------------------------------------- */
  function stopTyping() {
    state.token += 1;
    state.typing = false;
    clearTimeout(state.typingStartTimer);
  }

  function setScene(name) {
    if (name !== 'letter') {
      stopTyping();
      state.catTimers.forEach((timer) => clearTimeout(timer));
      state.catTimers = [];
      catPop.hidden = true;
      catPop.classList.remove('is-visible', 'is-out');
    }
    if (name !== 'final') {
      stopFireworks();
      if (!lightbox.hidden) closeLightbox();
    }
    state.scene = name;

    scenes.forEach((scene) => {
      const active = scene.dataset.scene === name;
      scene.classList.toggle('is-active', active);
      scene.setAttribute('aria-hidden', String(!active));
      if (active) {
        scene.removeAttribute('inert');
      } else {
        scene.setAttribute('inert', '');
      }
    });

    document.body.dataset.scene = name;

    if (name === 'letter') {
      state.userScrolled = false;
    }
  }

  /* -------------------------------------------------------
     Gate
     ------------------------------------------------------- */
  function startExperience() {
    if (state.started) return;
    state.started = true;

    Sound.unlock();
    Sound.tap();
    // 封面淡出后，信封刚好探出来时再响“啵”的一声，画面和音效对上
    window.setTimeout(() => Sound.pop(), 280);
    navigator.vibrate && navigator.vibrate(14);

    document.body.classList.remove('is-locked');
    document.body.classList.add('is-started');
    gate.classList.add('is-leaving');
    window.setTimeout(() => {
      gate.hidden = true;
    }, 360);

    setScene('envelope');
    if (bgm.paused) {
      playBgm({ fade: true });
      // 有些浏览器第一次 play() 会被吞掉，手势结束后补一次
      window.setTimeout(() => {
        if (bgm.paused && !bgmFailed && bgm.currentTime < 0.05) playBgm({ fade: true });
      }, 420);
    }
  }

  startBtn.addEventListener('click', startExperience);
  gate.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    startExperience();
  });

  /* -------------------------------------------------------
     Envelope
     ------------------------------------------------------- */
  openBtn.addEventListener('click', () => {
    if (openBtn.disabled) return;
    openBtn.disabled = true;
    Sound.open();
    envelope.classList.add('is-open');
    navigator.vibrate && navigator.vibrate([10, 28, 10]);

    window.setTimeout(() => Sound.chime(), 420);
    window.setTimeout(() => {
      setScene('hello');
    }, 1020);
  });

  $$('.hello-choice').forEach((button) => {
    button.addEventListener('click', () => {
      Sound.chime();
      navigator.vibrate && navigator.vibrate(10);
      setScene('letter');
      startLetter(false);
    });
  });

  /* -------------------------------------------------------
     Letter typing
     ------------------------------------------------------- */
  function parseSegments(text) {
    const segments = [];
    const pattern = /\{\{(.+?)\}\}/g;
    let lastIndex = 0;
    let match = pattern.exec(text);
    while (match) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), highlight: false });
      }
      segments.push({ text: match[1], highlight: true });
      lastIndex = pattern.lastIndex;
      match = pattern.exec(text);
    }
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), highlight: false });
    }
    return segments;
  }

  function buildLetter() {
    const fragment = document.createDocumentFragment();

    LETTER.forEach((paragraph) => {
      const p = document.createElement('p');
      p.className = 'letter-p letter-p--pending';
      if (paragraph.lead) p.classList.add('letter-p--lead');
      if (paragraph.closing) p.classList.add('letter-p--closing');

      parseSegments(paragraph.text).forEach((segment) => {
        Array.from(segment.text).forEach((char) => {
          const span = document.createElement('span');
          span.className = 'ch' + (segment.highlight ? ' is-hl' : '');
          span.textContent = char;
          p.appendChild(span);
        });
      });

      fragment.appendChild(p);
    });

    letterBody.replaceChildren(fragment);
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function isPunctuation(char) {
    return /[\s，。！？、；：~～…—❤♡]/.test(char);
  }

  function scrollToActive(element) {
    if (state.userScrolled || reduceMotion) return;
    const box = letterScroll.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const limit = box.bottom - 108;
    if (rect.bottom > limit) {
      letterScroll.scrollTop += rect.bottom - limit + 18;
    }
  }

  async function typeLetter() {
    const token = ++state.token;
    state.typing = true;
    state.letterDone = false;
    state.userScrolled = false;

    buildLetter();
    paper.classList.remove('is-done');
    letterActions.classList.remove('is-visible');
    letterActions.setAttribute('aria-hidden', 'true');
    letterActions.setAttribute('inert', '');
    letterTopbar.classList.remove('is-hidden');
    skipBtn.hidden = false;
    letterScroll.scrollTop = 0;

    await sleep(420);
    if (token !== state.token) return;

    const paragraphs = Array.from(letterBody.children);

    for (const paragraph of paragraphs) {
      if (token !== state.token) return;
      paragraph.classList.remove('letter-p--pending');
      paragraph.classList.add('is-current');
      scrollToActive(paragraph);

      const chars = Array.from(paragraph.querySelectorAll('.ch'));
      let count = 0;
      let cursorChar = null;

      for (const char of chars) {
        if (token !== state.token) return;
        char.classList.add('is-on');
        if (cursorChar) cursorChar.classList.remove('is-cursor');
        char.classList.add('is-cursor');
        cursorChar = char;
        count += 1;

        if (!isPunctuation(char.textContent) && count % 5 === 0) {
          Sound.tick();
        }
        if (count % 10 === 0) scrollToActive(paragraph);

        if (!reduceMotion) await sleep(30);
      }

      if (cursorChar) cursorChar.classList.remove('is-cursor');
      paragraph.classList.remove('is-current');
      scrollToActive(paragraph);

      if (!reduceMotion) await sleep(300);
    }

    if (token !== state.token) return;
    finishLetter(true);
  }

  function finishLetter(withSound = false) {
    state.token += 1;
    state.typing = false;
    state.letterDone = true;
    clearTimeout(state.typingStartTimer);

    if (!letterBody.children.length) buildLetter();

    letterBody.querySelectorAll('.ch').forEach((char) => {
      char.classList.add('is-on');
      char.classList.remove('is-cursor');
    });
    letterBody.querySelectorAll('.letter-p').forEach((p) => {
      p.classList.remove('is-current', 'letter-p--pending');
    });

    paper.classList.add('is-done');
    skipBtn.hidden = true;
    letterTopbar.classList.add('is-hidden');
    letterTopbar.setAttribute('aria-hidden', 'true');
    letterActions.classList.add('is-visible');
    letterActions.setAttribute('aria-hidden', 'false');
    letterActions.removeAttribute('inert');

    if (withSound) Sound.chime();
  }

  function startLetter(instant) {
    stopTyping();
    setScene('letter');
    state.letterDone = false;
    state.typing = false;
    state.userScrolled = false;
    letterScroll.scrollTop = 0;
    letterTopbar.classList.remove('is-hidden');
    letterTopbar.removeAttribute('aria-hidden');
    letterActions.classList.remove('is-visible');
    letterActions.setAttribute('aria-hidden', 'true');
    letterActions.setAttribute('inert', '');

    if (instant || reduceMotion) {
      buildLetter();
      requestAnimationFrame(() => finishLetter(false));
      return;
    }

    state.typingStartTimer = window.setTimeout(() => {
      if (state.scene === 'letter' && !state.letterDone) typeLetter();
    }, 720);
  }

  skipBtn.addEventListener('click', () => {
    if (!state.letterDone) {
      Sound.chime();
      finishLetter(true);
    }
  });

  paper.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    if (!state.letterDone) {
      Sound.chime();
      finishLetter(true);
    }
  });

  letterScroll.addEventListener('touchmove', () => {
    state.userScrolled = true;
  }, { passive: true });

  letterScroll.addEventListener('wheel', () => {
    state.userScrolled = true;
  }, { passive: true });

  /* -------------------------------------------------------
     Cat easter egg
     ------------------------------------------------------- */
  const CAT_LINES = [
    '不要拒绝我嘛~~~',
    '再点也没有用哦～',
    '喵呜……考虑一下下嘛',
    '你看我这么可爱，忍心吗？',
    '答应他嘛，答应他嘛～'
  ];
  let lastCatLine = -1;
  let catLineBag = [];

  function nextCatLine() {
    if (!catLineBag.length) {
      catLineBag = CAT_LINES.map((_, index) => index);
      for (let i = catLineBag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [catLineBag[i], catLineBag[j]] = [catLineBag[j], catLineBag[i]];
      }
      const first = catLineBag[catLineBag.length - 1];
      if (first === lastCatLine && catLineBag.length > 1) {
        catLineBag[catLineBag.length - 1] = catLineBag[0];
        catLineBag[0] = first;
      }
    }
    const index = catLineBag.pop();
    lastCatLine = index;
    return CAT_LINES[index];
  }

  function clearCatTimers() {
    state.catTimers.forEach((timer) => clearTimeout(timer));
    state.catTimers = [];
  }

  function showCat() {
    Sound.meow();
    navigator.vibrate && navigator.vibrate(22);
    catBubbleText.textContent = nextCatLine();

    clearCatTimers();
    catPop.hidden = false;
    catPop.classList.remove('is-out');
    catPop.classList.remove('is-visible');
    void catPop.offsetWidth;
    catPop.classList.add('is-visible');

    state.catTimers.push(window.setTimeout(() => {
      catPop.classList.add('is-out');
      state.catTimers.push(window.setTimeout(() => {
        catPop.hidden = true;
        catPop.classList.remove('is-visible', 'is-out');
      }, 460));
    }, 2100));
  }

  rejectBtn.addEventListener('click', showCat);

  /* -------------------------------------------------------
     Accept + final scene
     ------------------------------------------------------- */
  acceptBtn.addEventListener('click', () => {
    if (state.scene !== 'letter') return;
    Sound.fanfare();
    navigator.vibrate && navigator.vibrate([14, 38, 14, 38, 26]);
    finishLetter(false);
    heartRain(32);
    setScene('final');
    startFireworks();
    finalScroll.scrollTop = 0;
    window.setTimeout(() => heartRain(12), 800);
  });

  moreLoveBtn.addEventListener('click', () => {
    Sound.chime();
    heartRain(18);
    const lines = ['心动值 +1 ♡', '已经装不下啦 ♡', '1314 ♡', '再靠近一点点 ♡'];
    showToast(lines[Math.floor(Math.random() * lines.length)]);
  });

  rereadBtn.addEventListener('click', () => {
    stopFireworks();
    Sound.open();
    startLetter(true);
    window.setTimeout(() => {
      if (state.scene === 'letter') letterScroll.scrollTop = 0;
    }, 80);
  });

  /* -------------------------------------------------------
     Hearts + toast
     ------------------------------------------------------- */
  const HEART_COLORS = ['#f2688c', '#ef8ba6', '#e8a1b6', '#d9a45f', '#c9a7e8', '#ff9db6'];

  function heartRain(count = 24) {
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
      const heart = document.createElement('span');
      heart.className = 'heart-bit';
      heart.textContent = Math.random() < 0.82 ? '❤' : '♡';
      heart.style.left = `${rand(0, 100)}vw`;
      heart.style.fontSize = `${rand(10, 27)}px`;
      heart.style.color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
      heart.style.animationDuration = `${rand(2.6, 5.2)}s`;
      heart.style.animationDelay = `${rand(0, 0.75)}s`;
      heart.style.setProperty('--drift', `${rand(-80, 80)}px`);
      heart.style.setProperty('--spin', `${rand(-110, 110)}deg`);
      fragment.appendChild(heart);
      window.setTimeout(() => heart.remove(), 6400);
    }

    heartLayer.appendChild(fragment);
  }

  function showToast(message, duration = 2400) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, duration);
  }

  /* -------------------------------------------------------
     Photo wall + lightbox
     ------------------------------------------------------- */
  let lightboxIndex = 0;
  let lightboxReturnFocus = null;
  let lightboxCloseTimer = null;
  let swipeStartX = null;

  function updateLightboxMedia() {
    const item = photoItems[lightboxIndex];
    const img = item.querySelector('img');
    lightboxImg.src = img.getAttribute('src');
    lightboxImg.alt = img.getAttribute('alt') || '';
    lightboxCaption.textContent = item.dataset.caption || '';
    lightboxCount.textContent = `${lightboxIndex + 1} / ${photoItems.length}`;
  }

  function openLightbox(index, trigger) {
    if (!photoItems.length) return;
    lightboxIndex = (index + photoItems.length) % photoItems.length;
    updateLightboxMedia();
    lightboxReturnFocus = trigger || document.activeElement;
    clearTimeout(lightboxCloseTimer);
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    requestAnimationFrame(() => {
      lightbox.classList.add('is-open');
      lightboxClose.focus({ preventScroll: true });
    });
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    clearTimeout(lightboxCloseTimer);
    lightboxCloseTimer = window.setTimeout(() => {
      lightbox.hidden = true;
      lightboxImg.removeAttribute('src');
      if (lightboxReturnFocus && typeof lightboxReturnFocus.focus === 'function') {
        lightboxReturnFocus.focus({ preventScroll: true });
      }
    }, 270);
  }

  function stepLightbox(delta) {
    if (lightbox.hidden) return;
    lightboxIndex = (lightboxIndex + delta + photoItems.length) % photoItems.length;
    updateLightboxMedia();
  }

  photoItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index, item));
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(index, item);
      }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxBackdrop.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => stepLightbox(-1));
  lightboxNext.addEventListener('click', () => stepLightbox(1));

  lightbox.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) swipeStartX = event.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (event) => {
    if (swipeStartX === null) return;
    const dx = event.changedTouches[0].clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(dx) > 46) stepLightbox(dx > 0 ? -1 : 1);
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    else if (event.key === 'ArrowLeft') stepLightbox(-1);
    else if (event.key === 'ArrowRight') stepLightbox(1);
  });

  /* -------------------------------------------------------
     Ambient stars + hearts
     ------------------------------------------------------- */
  const canvas = $('#fxCanvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  let particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let ambientFrame = null;
  let ambientRunning = false;
  const STAR_COLORS = ['#e8b96a', '#f2688c', '#f7d9a0', '#d9c7ff', '#fff7ea'];

  function drawHeart(context, x, y, size, rotation, alpha, color) {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, size * 0.34);
    context.bezierCurveTo(-size * 0.6, -size * 0.08, -size * 0.42, -size * 0.72, 0, -size * 0.32);
    context.bezierCurveTo(size * 0.42, -size * 0.72, size * 0.6, -size * 0.08, 0, size * 0.34);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawStar(context, x, y, size, rotation, alpha, color) {
    const core = size * 0.2;
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, -size);
    context.quadraticCurveTo(core, -core, size, 0);
    context.quadraticCurveTo(core, core, 0, size);
    context.quadraticCurveTo(-core, core, -size, 0);
    context.quadraticCurveTo(-core, -core, 0, -size);
    context.closePath();
    context.fill();
    context.restore();
  }

  function buildParticles() {
    const count = clamp(Math.round((width * height) / 15000), 16, 42);
    particles = [];

    for (let i = 0; i < count; i += 1) {
      const roll = Math.random();
      const type = roll < 0.56 ? 'star' : roll < 0.84 ? 'heart' : 'dot';
      particles.push({
        x: rand(0, width),
        y: rand(0, height),
        size: type === 'star' ? rand(3.5, 11) : type === 'heart' ? rand(5, 15) : rand(1.6, 3.6),
        speed: rand(0.08, 0.34),
        sway: rand(0.25, 0.9),
        phase: rand(0, Math.PI * 2),
        twinkle: rand(0, Math.PI * 2),
        twinkleSpeed: rand(0.012, 0.032),
        alpha: type === 'star' ? rand(0.24, 0.62) : rand(0.08, 0.32),
        rotation: rand(-0.5, 0.5),
        spin: rand(-0.0025, 0.0025),
        type,
        color: type === 'star'
          ? STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
          : type === 'heart'
            ? (Math.random() > 0.5 ? '#f2688c' : '#d9a45f')
            : '#c9a7e8'
      });
    }
  }

  function paintAmbient(animate = true) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      const floatX = Math.sin(particle.phase) * 6 * particle.sway;
      const twinkle = 0.72 + Math.sin(particle.twinkle) * 0.28;
      const alpha = particle.type === 'star' ? particle.alpha * twinkle : particle.alpha;

      if (particle.type === 'star') {
        drawStar(
          ctx,
          particle.x + floatX,
          particle.y,
          particle.size,
          particle.rotation,
          alpha,
          particle.color
        );
      } else if (particle.type === 'heart') {
        drawHeart(
          ctx,
          particle.x + floatX,
          particle.y,
          particle.size,
          particle.rotation,
          alpha,
          particle.color
        );
      } else {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x + floatX, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (!animate) return;

      particle.y -= particle.speed;
      particle.phase += 0.0045;
      particle.twinkle += particle.twinkleSpeed;
      particle.rotation += particle.spin;

      if (particle.y < -40) {
        particle.y = height + rand(20, 90);
        particle.x = rand(0, width);
      }
    });

    if (animate) ambientFrame = requestAnimationFrame(() => paintAmbient(true));
  }

  function resizeAmbient() {
    if (!canvas || !ctx) return;
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
    if (!ambientRunning) {
      ambientRunning = true;
      paintAmbient(!reduceMotion);
    }
  }

  if (canvas && ctx) {
    resizeAmbient();
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        cancelAnimationFrame(ambientFrame);
        ambientRunning = false;
        resizeAmbient();
      }, 180);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(ambientFrame);
        ambientRunning = false;
      } else if (!ambientRunning) {
        ambientRunning = true;
        paintAmbient(!reduceMotion);
      }
    });
  }

  /* -------------------------------------------------------
     Final-page fireworks
     ------------------------------------------------------- */
  const fireworksCanvas = $('#fireworksCanvas');
  const fwCtx = fireworksCanvas && fireworksCanvas.getContext ? fireworksCanvas.getContext('2d') : null;
  const FW_COLORS = ['#ff5c8a', '#ffd166', '#f2688c', '#c084fc', '#fff4d6', '#ff9db6'];
  let fwW = 0;
  let fwH = 0;
  let fwDpr = 1;
  let fwRockets = [];
  let fwSparks = [];
  let fwFlashes = [];
  let fwFrame = null;
  let fwActive = false;
  let fwLast = 0;
  let fwNextSpawn = 0;

  function resizeFireworks() {
    if (!fireworksCanvas || !fwCtx) return;
    fwW = window.innerWidth;
    fwH = window.innerHeight;
    fwDpr = Math.min(window.devicePixelRatio || 1, 2);
    fireworksCanvas.width = Math.round(fwW * fwDpr);
    fireworksCanvas.height = Math.round(fwH * fwDpr);
    fwCtx.setTransform(fwDpr, 0, 0, fwDpr, 0, 0);
  }

  function spawnRocket() {
    const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
    fwRockets.push({
      x: rand(fwW * 0.18, fwW * 0.82),
      y: fwH + 10,
      vx: rand(-0.4, 0.4),
      vy: rand(-13.5, -9.5),
      targetY: rand(fwH * 0.16, fwH * 0.42),
      color
    });
  }

  function burstFirework(x, y, color) {
    const count = 68 + Math.floor(Math.random() * 30);
    fwFlashes.push({ x, y, life: 12, maxLife: 12, color, radius: rand(44, 78) });
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.4, 6.2);
      const life = rand(70, 120);
      fwSparks.push({
        x,
        y,
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.35,
        life,
        maxLife: life,
        size: rand(1.3, 3),
        color: Math.random() < 0.3 ? '#fff8e8' : color
      });
    }
    if (fwSparks.length > 760) fwSparks.splice(0, fwSparks.length - 760);
  }

  function fwLoop(now) {
    if (!fwActive || !fwCtx) return;
    if (!fwLast) fwLast = now;
    const dt = Math.min((now - fwLast) / 16.6667, 2.4);
    fwLast = now;
    fwCtx.clearRect(0, 0, fwW, fwH);
    fwCtx.globalCompositeOperation = 'lighter';
    fwCtx.lineCap = 'round';

    if (now >= fwNextSpawn) {
      spawnRocket();
      if (Math.random() < 0.48) spawnRocket();
      fwNextSpawn = now + rand(760, 1450);
    }

    for (let i = fwFlashes.length - 1; i >= 0; i -= 1) {
      const flash = fwFlashes[i];
      flash.life -= dt;
      if (flash.life <= 0) {
        fwFlashes.splice(i, 1);
        continue;
      }
      const progress = flash.life / flash.maxLife;
      const radius = flash.radius * (1.35 - progress * 0.35);
      const gradient = fwCtx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, radius);
      gradient.addColorStop(0, flash.color);
      gradient.addColorStop(0.35, flash.color);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      fwCtx.globalAlpha = progress * 0.22;
      fwCtx.fillStyle = gradient;
      fwCtx.beginPath();
      fwCtx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
      fwCtx.fill();
    }

    for (let i = fwRockets.length - 1; i >= 0; i -= 1) {
      const rocket = fwRockets[i];
      const prevX = rocket.x;
      const prevY = rocket.y;
      rocket.x += rocket.vx * dt;
      rocket.y += rocket.vy * dt;
      rocket.vy += 0.13 * dt;

      fwCtx.globalAlpha = 0.85;
      fwCtx.strokeStyle = rocket.color;
      fwCtx.lineWidth = 1.6;
      fwCtx.beginPath();
      fwCtx.moveTo(prevX, prevY);
      fwCtx.lineTo(rocket.x, rocket.y);
      fwCtx.stroke();

      if (rocket.y <= rocket.targetY || rocket.vy >= -1.1) {
        burstFirework(rocket.x, rocket.y, rocket.color);
        fwRockets.splice(i, 1);
      }
    }

    for (let i = fwSparks.length - 1; i >= 0; i -= 1) {
      const spark = fwSparks[i];
      spark.px = spark.x;
      spark.py = spark.y;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= Math.pow(0.985, dt);
      spark.vy = spark.vy * Math.pow(0.985, dt) + 0.045 * dt;
      spark.life -= dt;

      if (spark.life <= 0) {
        fwSparks.splice(i, 1);
        continue;
      }

      const alpha = clamp(spark.life / spark.maxLife, 0, 1) * 0.9;
      fwCtx.globalAlpha = alpha;
      fwCtx.strokeStyle = spark.color;
      fwCtx.lineWidth = spark.size;
      fwCtx.beginPath();
      fwCtx.moveTo(spark.px, spark.py);
      fwCtx.lineTo(spark.x, spark.y);
      fwCtx.stroke();

      fwCtx.globalAlpha = alpha * 0.18;
      fwCtx.fillStyle = spark.color;
      fwCtx.beginPath();
      fwCtx.arc(spark.x, spark.y, spark.size * 4.2, 0, Math.PI * 2);
      fwCtx.fill();
    }

    fwCtx.globalAlpha = 1;
    fwCtx.globalCompositeOperation = 'source-over';
    fwFrame = requestAnimationFrame(fwLoop);
  }

  function startFireworks() {
    if (!fireworksCanvas || !fwCtx || reduceMotion) return;
    if (fwActive) return;
    resizeFireworks();
    fwRockets = [];
    fwSparks = [];
    fwFlashes = [];
    fwLast = 0;
    fwNextSpawn = 0;
    fwActive = true;
    fwFrame = requestAnimationFrame(fwLoop);
  }

  function stopFireworks() {
    fwActive = false;
    if (fwFrame) cancelAnimationFrame(fwFrame);
    fwFrame = null;
    fwRockets = [];
    fwSparks = [];
    fwFlashes = [];
    if (fwCtx) fwCtx.clearRect(0, 0, fwW, fwH);
  }

  if (fireworksCanvas && fwCtx) {
    window.addEventListener('resize', () => {
      if (!fwActive) return;
      resizeFireworks();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (fwActive) stopFireworks();
    } else if (state.scene === 'final') {
      startFireworks();
    }
  });

  /* -------------------------------------------------------
     Generic soft click
     ------------------------------------------------------- */
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !state.started) return;
    if (['startBtn', 'openBtn', 'rejectBtn', 'acceptBtn'].includes(button.id)) return;
    if (button.hasAttribute('data-go')) return;
    if (button.id === 'playBtn' || button.id === 'sfxBtn') return;
    if (button.classList.contains('hello-choice')) return;
    Sound.tap();
  }, true);

  /* -------------------------------------------------------
     Initial boot
     ------------------------------------------------------- */
  updatePlayUI(false);

  // 先尽力在打开网页时从头播放；如果被浏览器拦截，
  // 第一次“轻触开启”的手势会接着从 0 开始播放。
  tryAutoplayBgm();

  const preview = new URLSearchParams(window.location.search).get('preview');
  const validPreviews = ['envelope', 'hello', 'letter', 'final'];

  if (preview && validPreviews.includes(preview)) {
    gate.hidden = true;
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-started');

    if (preview === 'letter') {
      startLetter(true);
    } else if (preview === 'final') {
      setScene('final');
      startFireworks();
    } else {
      setScene(preview);
    }
  }
})();
