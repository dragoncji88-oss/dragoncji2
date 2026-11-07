/**
 * Generates the complete, standalone, zero-dependency index.html file
 * that can be opened directly in any browser offline or saved as a single file.
 */

export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>스마트 학생 발표자 뽑기 - 교실 수업용</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Pretendard & Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Pretendard", sans-serif;
    }
    .slot-blur {
      animation: slotBlur 0.2s linear infinite;
    }
    @keyframes slotBlur {
      0% { filter: blur(0px); transform: translateY(-3px); }
      50% { filter: blur(2px); transform: translateY(3px); }
      100% { filter: blur(0px); transform: translateY(-3px); }
    }
    .pulse-glow {
      box-shadow: 0 0 25px rgba(99, 102, 241, 0.45);
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">

  <!-- Confetti Canvas Overlay -->
  <canvas id="confettiCanvas" class="fixed inset-0 pointer-events-none z-50 w-full h-full"></canvas>

  <!-- Navigation Bar -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-200">
          🎯
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-900 leading-tight">스마트 학생 발표자 뽑기</h1>
          <p class="text-xs text-slate-500">교실 TV · 전자칠판 · 프로젝터 수업용</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="toggleSoundBtn" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
          <span id="soundIcon">🔊</span>
          <span id="soundLabel">효과음 ON</span>
        </button>
        <button id="toggleTtsBtn" class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
          <span>🗣️</span>
          <span id="ttsLabel">이름 낭독 ON</span>
        </button>
        <button id="fullscreenBtn" class="hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 items-center gap-1.5 transition-colors">
          <span>⛶</span> 전체화면
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    <!-- Left Stage: Main Drawing Arena (7 cols) -->
    <section class="lg:col-span-7 flex flex-col gap-5">
      
      <!-- Stage Box -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        
        <!-- Live Status Bar -->
        <div class="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-100 text-xs font-medium text-slate-500">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>추첨 대기 중</span>
          </div>
          <div class="flex items-center gap-4 font-semibold text-slate-700">
            <span>남은 인원: <strong id="stageRemainCount" class="text-indigo-600 text-sm">0</strong>명</span>
            <span>선발 완료: <strong id="stagePickedCount" class="text-amber-600 text-sm">0</strong>명</span>
          </div>
        </div>

        <!-- Reel Container (dynamically populated for 1~5 people) -->
        <div id="reelsContainer" class="w-full my-6 grid grid-cols-1 gap-4">
          <!-- Populated by JS -->
        </div>

        <!-- Options Toolbar -->
        <div class="w-full bg-slate-50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-100 text-xs sm:text-sm">
          <!-- Pick Count -->
          <div class="flex items-center gap-2">
            <label class="font-bold text-slate-700">뽑을 인원:</label>
            <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" id="countButtons">
              <button data-count="1" class="count-btn px-3 py-1 rounded-md font-bold text-xs bg-indigo-600 text-white transition-colors">1명</button>
              <button data-count="2" class="count-btn px-3 py-1 rounded-md font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors">2명</button>
              <button data-count="3" class="count-btn px-3 py-1 rounded-md font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors">3명</button>
              <button data-count="4" class="count-btn px-3 py-1 rounded-md font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors">4명</button>
              <button data-count="5" class="count-btn px-3 py-1 rounded-md font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors">5명</button>
            </div>
          </div>

          <!-- Exclude Checkbox -->
          <label class="inline-flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700">
            <input type="checkbox" id="excludePickedCheckbox" checked class="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
            <span>한 번 뽑힌 학생은 제외 (중복 방지)</span>
          </label>
        </div>

        <!-- Giant Pick Button -->
        <div class="w-full mt-6">
          <button id="pickBtn" class="w-full py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white font-black text-2xl sm:text-3xl tracking-tight shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <span>🎲</span>
            <span>발표자 뽑기</span>
          </button>
          <p class="text-center text-xs text-slate-400 mt-2 font-medium">키보드 [Space] 스페이스바를 눌러도 발표자를 뽑을 수 있습니다</p>
        </div>

      </div>

      <!-- Quick Guidance Toast / Alert -->
      <div id="alertBox" class="hidden p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between">
        <span id="alertMessage">남은 학생이 없습니다!</span>
        <button id="closeAlertBtn" class="text-rose-500 hover:text-rose-700 font-bold ml-2">닫기</button>
      </div>

    </section>

    <!-- Right Sidebar: Roster & History Deck (5 cols) -->
    <aside class="lg:col-span-5 flex flex-col gap-5">
      
      <!-- Card Container -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
        
        <!-- Tabs Header -->
        <div class="flex items-center p-1 bg-slate-100 rounded-xl mb-5">
          <button id="tabRosterBtn" class="flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-xs transition-colors">
            학생 명단 관리 (<span id="totalStudentsBadge">0</span>명)
          </button>
          <button id="tabHistoryBtn" class="flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            완료된 발표자 (<span id="pickedStudentsBadge">0</span>명)
          </button>
        </div>

        <!-- Tab 1: Roster Input Content -->
        <div id="rosterSection" class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <label for="rosterInput" class="text-xs font-bold text-slate-700">이름 목록 (줄바꿈 또는 쉼표 구분):</label>
            <div class="flex items-center gap-1.5">
              <button id="loadPresetBtn" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline">예시 25명 불러오기</button>
              <span class="text-slate-300">·</span>
              <button id="clearRosterBtn" class="text-xs text-slate-500 hover:text-rose-600 font-medium">비우기</button>
            </div>
          </div>

          <textarea id="rosterInput" rows="7" placeholder="김민준&#10;이서연&#10;박도윤&#10;최지안&#10;..." class="w-full p-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-800 bg-slate-50/50 leading-relaxed resize-y"></textarea>

          <!-- Candidate tags summary -->
          <div>
            <div class="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>현재 추첨 가능 학생 (<span id="remainCountSpan">0</span>명)</span>
              <button id="shuffleBtn" class="text-xs text-slate-600 hover:text-slate-900 font-medium">🔀 무작위 섞기</button>
            </div>
            <div id="candidateTags" class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <!-- Rendered tags -->
            </div>
          </div>
        </div>

        <!-- Tab 2: History Content -->
        <div id="historySection" class="hidden flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700">오늘 선발된 발표 순서:</span>
            <div class="flex items-center gap-2">
              <button id="copyHistoryBtn" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold">📋 기록 복사</button>
              <button id="resetHistoryBtn" class="text-xs text-rose-600 hover:text-rose-800 font-bold">🔄 추첨 기록 리셋</button>
            </div>
          </div>

          <div id="historyList" class="flex flex-col gap-2 max-h-80 overflow-y-auto p-1 text-sm">
            <!-- Rendered history items -->
          </div>
        </div>

      </div>

    </aside>

  </main>

  <!-- Celebratory Winner Modal -->
  <div id="winnerModal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="relative w-full max-w-xl bg-white rounded-3xl border border-amber-300 shadow-2xl p-6 sm:p-10 text-center animate-in fade-in duration-200">
      <button id="closeModalBtn" class="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 text-xl font-bold">✕</button>
      
      <div class="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-500 flex items-center justify-center text-3xl mb-3 shadow-inner">
        🏆
      </div>
      <p class="text-xs sm:text-sm font-bold tracking-wider text-amber-600 uppercase">축하합니다! 발표자 당첨</p>
      <h2 id="modalTitle" class="text-2xl sm:text-3xl font-black text-slate-900 mt-1 mb-5">오늘의 발표자</h2>
      
      <!-- Modal Winners Container -->
      <div id="modalWinnersList" class="space-y-3 my-5">
        <!-- Rendered winner cards -->
      </div>

      <p class="text-sm text-slate-500 font-medium mb-6">준비된 내용을 멋지게 발표해 주세요! 👏</p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button id="modalPickAgainBtn" class="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30">
          다음 발표자 바로 뽑기
        </button>
        <button id="modalCloseConfirmBtn" class="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
          확인
        </button>
      </div>
    </div>
  </div>

  <!-- Complete Standalone JavaScript -->
  <script>
    // --- State ---
    const state = {
      allStudents: [],
      pickedHistory: [], // array of { name, order, time }
      pickCount: 1,
      excludePicked: true,
      soundEnabled: true,
      ttsEnabled: true,
      isRolling: false,
      lastWinners: [],
      currentTab: 'roster' // 'roster' | 'history'
    };

    const SAMPLE_NAMES = [
      '김도윤', '이시우', '박서준', '최예준', '정유준',
      '강지호', '조수아', '윤서아', '장하은', '임지아',
      '한서연', '오지안', '서민서', '신하윤', '권은우',
      '황서진', '안선우', '송시은', '전지우', '홍로아',
      '고채원', '문주원', '양채아', '손태이', '배도현'
    ];

    // --- Web Audio API Synth Engine ---
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        const AudioClass = window.AudioContext || window.webkitAudioContext;
        if (AudioClass) audioCtx = new AudioClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playTick() {
      if (!state.soundEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }

    function playFanfare() {
      if (!state.soundEnabled) return;
      try {
        const ctx = getAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [
          { f: 523.25, t: 0.0, d: 0.3 },
          { f: 659.25, t: 0.12, d: 0.3 },
          { f: 783.99, t: 0.24, d: 0.4 },
          { f: 1046.5, t: 0.36, d: 1.0 }
        ];
        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.f, now + n.t);
          gain.gain.setValueAtTime(0.01, now + n.t);
          gain.gain.linearRampToValueAtTime(0.2, now + n.t + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + n.t);
          osc.stop(now + n.t + n.d + 0.05);
        });
      } catch (e) {}
    }

    function speakWinner(names) {
      if (!state.ttsEnabled || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const msg = names.length === 1 
          ? '축하합니다! 발표자는 ' + names[0] + ' 학생입니다!'
          : '축하합니다! 발표자는 ' + names.join(', ') + ' 학생입니다!';
        const utterance = new SpeechSynthesisUtterance(msg);
        utterance.lang = 'ko-KR';
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }

    // --- Canvas Confetti Engine ---
    function triggerConfetti() {
      const canvas = document.getElementById('confettiCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;
      const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE'];
      const particles = [];
      
      for (let i = 0; i < 120; i++) {
        const cluster = i % 3;
        let sx = w * 0.5, sy = h * 0.7, baseAngle = -Math.PI / 2;
        if (cluster === 0) { sx = w * 0.15; sy = h * 0.85; baseAngle = -Math.PI / 3; }
        if (cluster === 1) { sx = w * 0.85; sy = h * 0.85; baseAngle = (-2 * Math.PI) / 3; }
        const angle = baseAngle + (Math.random() - 0.5) * 0.8;
        const spd = 10 + Math.random() * 20;
        particles.push({
          x: sx, y: sy,
          w: 8 + Math.random() * 6,
          h: 8 + Math.random() * 6,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          tilt: Math.random() * 10,
          opacity: 1
        });
      }

      const start = performance.now();
      function frame(time) {
        ctx.clearRect(0, 0, w, h);
        let active = 0;
        for (let p of particles) {
          p.vy += 0.45;
          p.vx *= 0.98;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += 4;
          p.opacity -= 0.005;
          if (p.opacity > 0 && p.y < h + 50) {
            active++;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
          }
        }
        if (active > 0 && time - start < 3500) {
          requestAnimationFrame(frame);
        } else {
          ctx.clearRect(0, 0, w, h);
        }
      }
      requestAnimationFrame(frame);
    }

    // --- DOM Elements ---
    const rosterInput = document.getElementById('rosterInput');
    const reelsContainer = document.getElementById('reelsContainer');
    const pickBtn = document.getElementById('pickBtn');
    const stageRemainCount = document.getElementById('stageRemainCount');
    const stagePickedCount = document.getElementById('stagePickedCount');
    const remainCountSpan = document.getElementById('remainCountSpan');
    const totalStudentsBadge = document.getElementById('totalStudentsBadge');
    const pickedStudentsBadge = document.getElementById('pickedStudentsBadge');
    const candidateTags = document.getElementById('candidateTags');
    const historyList = document.getElementById('historyList');
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');
    const winnerModal = document.getElementById('winnerModal');
    const modalWinnersList = document.getElementById('modalWinnersList');
    const excludePickedCheckbox = document.getElementById('excludePickedCheckbox');

    // --- Parsing & Eligible Candidates ---
    function parseRosterText(text) {
      return text
        .split(/[\\n,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    function getEligibleCandidates() {
      if (!state.excludePicked) {
        return [...state.allStudents];
      }
      const pickedNames = new Set(state.pickedHistory.map(h => h.name));
      return state.allStudents.filter(name => !pickedNames.has(name));
    }

    function updateStatsUI() {
      const eligible = getEligibleCandidates();
      const remainCount = eligible.length;
      const pickedCount = state.pickedHistory.length;
      const totalCount = state.allStudents.length;

      stageRemainCount.textContent = remainCount;
      stagePickedCount.textContent = pickedCount;
      remainCountSpan.textContent = remainCount;
      totalStudentsBadge.textContent = totalCount;
      pickedStudentsBadge.textContent = pickedCount;

      // Render Candidate Tags
      candidateTags.innerHTML = '';
      if (eligible.length === 0) {
        candidateTags.innerHTML = '<span class="text-slate-400">추첨 가능한 학생이 없습니다.</span>';
      } else {
        eligible.forEach(name => {
          const span = document.createElement('span');
          span.className = 'px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-medium';
          span.textContent = name;
          candidateTags.appendChild(span);
        });
      }

      // Render History List
      historyList.innerHTML = '';
      if (state.pickedHistory.length === 0) {
        historyList.innerHTML = '<div class="text-center py-6 text-slate-400 text-xs">아직 선발된 발표자가 없습니다.</div>';
      } else {
        state.pickedHistory.forEach(item => {
          const div = document.createElement('div');
          div.className = 'flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl';
          div.innerHTML = \`
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-md bg-amber-500 text-white font-black text-xs flex items-center justify-center">#\${item.order}</span>
              <span class="font-bold text-slate-800">\${item.name}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[11px] text-slate-400">\${item.time}</span>
              <button onclick="restoreStudent('\${item.name}')" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">복귀</button>
            </div>
          \`;
          historyList.appendChild(div);
        });
      }

      renderReelsPreview();
    }

    function renderReelsPreview() {
      reelsContainer.innerHTML = '';
      const eligible = getEligibleCandidates();

      for (let i = 0; i < state.pickCount; i++) {
        const div = document.createElement('div');
        div.className = 'rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 text-center transition-all relative overflow-hidden';
        
        const label = state.pickCount > 1 ? \`발표자 \${i + 1}\` : '발표자 슬롯';
        const displayWinner = state.lastWinners[i];

        div.innerHTML = \`
          <div class="text-xs font-bold text-slate-400 mb-2">\${label}</div>
          <div id="reelName_\${i}" class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            \${displayWinner ? displayWinner : (eligible.length > 0 ? eligible[i % eligible.length] : '명단 필요')}
          </div>
          <div class="text-xs text-slate-400 mt-2">\${displayWinner ? '선발 완료' : '추첨 대기'}</div>
        \`;
        reelsContainer.appendChild(div);
      }
    }

    window.restoreStudent = function(name) {
      state.pickedHistory = state.pickedHistory.filter(h => h.name !== name);
      updateStatsUI();
    };

    function showAlert(msg) {
      alertMessage.textContent = msg;
      alertBox.classList.remove('hidden');
    }
    document.getElementById('closeAlertBtn').addEventListener('click', () => {
      alertBox.classList.add('hidden');
    });

    // --- Draw Execution ---
    function startDraw() {
      if (state.isRolling) return;
      alertBox.classList.add('hidden');

      const eligible = getEligibleCandidates();
      if (eligible.length === 0) {
        showAlert('남은 학생이 없습니다! 명단을 추가하거나 추첨 기록을 리셋해 주세요.');
        return;
      }

      const countToPick = Math.min(state.pickCount, eligible.length);
      if (state.pickCount > eligible.length && state.excludePicked) {
        showAlert(\`남은 학생(\${eligible.length}명)보다 뽑을 인원(\${state.pickCount}명)이 많아, 남은 전체 인원을 선발합니다.\`);
      }

      // Pick random winners without duplicates among themselves
      const pool = [...eligible];
      const selectedWinners = [];
      for (let i = 0; i < countToPick; i++) {
        const randIdx = Math.floor(Math.random() * pool.length);
        selectedWinners.push(pool[randIdx]);
        pool.splice(randIdx, 1);
      }

      state.isRolling = true;
      pickBtn.disabled = true;
      pickBtn.classList.add('opacity-50', 'cursor-not-allowed');

      // Rolling animation
      const durationMs = 2400;
      const startTime = performance.now();
      let lastTick = 0;

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = elapsed / durationMs;

        // Sound tick at dynamically slowing interval
        const tickInterval = 50 + Math.pow(progress, 2.5) * 200;
        if (currentTime - lastTick > tickInterval) {
          playTick();
          lastTick = currentTime;
        }

        // Fast random names in reels
        for (let i = 0; i < state.pickCount; i++) {
          const reelEl = document.getElementById(\`reelName_\${i}\`);
          if (reelEl) {
            const tempName = eligible[Math.floor(Math.random() * eligible.length)];
            reelEl.textContent = tempName;
            reelEl.classList.add('slot-blur');
          }
        }

        if (elapsed < durationMs) {
          requestAnimationFrame(step);
        } else {
          // Finalize
          state.isRolling = false;
          pickBtn.disabled = false;
          pickBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          state.lastWinners = selectedWinners;

          // Remove blur & display winners
          for (let i = 0; i < state.pickCount; i++) {
            const reelEl = document.getElementById(\`reelName_\${i}\`);
            if (reelEl) {
              reelEl.classList.remove('slot-blur');
              reelEl.textContent = selectedWinners[i] || '-';
            }
          }

          // Record in history
          const nowStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
          const startOrder = state.pickedHistory.length + 1;
          selectedWinners.forEach((name, idx) => {
            state.pickedHistory.push({
              name,
              order: startOrder + idx,
              time: nowStr
            });
          });

          // Sound & Confetti
          playFanfare();
          triggerConfetti();
          speakWinner(selectedWinners);

          // Update UI & Show Winner Modal
          updateStatsUI();
          showWinnerModal(selectedWinners, startOrder);
        }
      }

      requestAnimationFrame(step);
    }

    function showWinnerModal(winners, startOrder) {
      modalWinnersList.innerHTML = '';
      winners.forEach((name, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-4 rounded-2xl bg-amber-50 border-2 border-amber-300';
        div.innerHTML = \`
          <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-sm">#\${startOrder + i}</span>
          <span class="text-3xl sm:text-4xl font-black text-slate-900">\${name}</span>
          <span class="text-xs font-bold text-amber-700">발표자</span>
        \`;
        modalWinnersList.appendChild(div);
      });
      winnerModal.classList.remove('hidden');
      winnerModal.classList.add('flex');
    }

    function closeModal() {
      winnerModal.classList.add('hidden');
      winnerModal.classList.remove('flex');
    }

    // --- Event Listeners ---
    rosterInput.addEventListener('input', (e) => {
      state.allStudents = parseRosterText(e.target.value);
      updateStatsUI();
    });

    document.getElementById('loadPresetBtn').addEventListener('click', () => {
      rosterInput.value = SAMPLE_NAMES.join('\\n');
      state.allStudents = [...SAMPLE_NAMES];
      updateStatsUI();
    });

    document.getElementById('clearRosterBtn').addEventListener('click', () => {
      if (confirm('명단을 모두 비우시겠습니까?')) {
        rosterInput.value = '';
        state.allStudents = [];
        updateStatsUI();
      }
    });

    document.getElementById('shuffleBtn').addEventListener('click', () => {
      state.allStudents.sort(() => Math.random() - 0.5);
      rosterInput.value = state.allStudents.join('\\n');
      updateStatsUI();
    });

    document.getElementById('resetHistoryBtn').addEventListener('click', () => {
      if (confirm('추첨 기록을 초기화하시겠습니까? 전체 학생이 다시 추첨 대상이 됩니다.')) {
        state.pickedHistory = [];
        state.lastWinners = [];
        updateStatsUI();
      }
    });

    document.getElementById('copyHistoryBtn').addEventListener('click', () => {
      if (state.pickedHistory.length === 0) {
        alert('복사할 추첨 기록이 없습니다.');
        return;
      }
      const text = state.pickedHistory.map(h => \`#\${h.order}번째 발표자: \${h.name} (\${h.time})\`).join('\\n');
      navigator.clipboard.writeText(text).then(() => alert('발표자 명단이 클립보드에 복사되었습니다.'));
    });

    excludePickedCheckbox.addEventListener('change', (e) => {
      state.excludePicked = e.target.checked;
      updateStatsUI();
    });

    // Count Buttons
    document.querySelectorAll('.count-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.count-btn').forEach(b => {
          b.className = 'count-btn px-3 py-1 rounded-md font-medium text-xs text-slate-600 hover:text-slate-900 transition-colors';
        });
        e.target.className = 'count-btn px-3 py-1 rounded-md font-bold text-xs bg-indigo-600 text-white transition-colors';
        state.pickCount = parseInt(e.target.dataset.count, 10);
        renderReelsPreview();
      });
    });

    // Pick CTA
    pickBtn.addEventListener('click', startDraw);

    // Keyboard Spacebar Shortcut
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        if (!winnerModal.classList.contains('hidden')) {
          closeModal();
        } else {
          startDraw();
        }
      }
      if (e.key === 'Escape' && !winnerModal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Modal Events
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('modalCloseConfirmBtn').addEventListener('click', closeModal);
    document.getElementById('modalPickAgainBtn').addEventListener('click', () => {
      closeModal();
      setTimeout(startDraw, 300);
    });

    // Sound and TTS Toggles
    const toggleSoundBtn = document.getElementById('toggleSoundBtn');
    toggleSoundBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      document.getElementById('soundIcon').textContent = state.soundEnabled ? '🔊' : '🔇';
      document.getElementById('soundLabel').textContent = state.soundEnabled ? '효과음 ON' : '효과음 OFF';
    });

    const toggleTtsBtn = document.getElementById('toggleTtsBtn');
    toggleTtsBtn.addEventListener('click', () => {
      state.ttsEnabled = !state.ttsEnabled;
      document.getElementById('ttsLabel').textContent = state.ttsEnabled ? '이름 낭독 ON' : '이름 낭독 OFF';
    });

    // Fullscreen Toggle
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Tabs
    const tabRosterBtn = document.getElementById('tabRosterBtn');
    const tabHistoryBtn = document.getElementById('tabHistoryBtn');
    const rosterSection = document.getElementById('rosterSection');
    const historySection = document.getElementById('historySection');

    tabRosterBtn.addEventListener('click', () => {
      tabRosterBtn.className = 'flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-xs transition-colors';
      tabHistoryBtn.className = 'flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors';
      rosterSection.classList.remove('hidden');
      rosterSection.classList.add('flex');
      historySection.classList.add('hidden');
      historySection.classList.remove('flex');
    });

    tabHistoryBtn.addEventListener('click', () => {
      tabHistoryBtn.className = 'flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-xs transition-colors';
      tabRosterBtn.className = 'flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors';
      historySection.classList.remove('hidden');
      historySection.classList.add('flex');
      rosterSection.classList.add('hidden');
      rosterSection.classList.remove('flex');
    });

    // Initialize with sample roster
    rosterInput.value = SAMPLE_NAMES.join('\\n');
    state.allStudents = [...SAMPLE_NAMES];
    updateStatsUI();

  </script>
</body>
</html>`;
}
