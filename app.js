// app.js（no-module 版；防呆修正版）

// 題庫
const questionBank = [
  "現在有多少位學生呢？",
  "老師的人數有多少位？",
  "校地面積有多大呢？",
  "現在有多少個班級呢？",
  "新住民的學生有幾位？",
  "圖書館自己買的書有幾本？",
  "圖書館借出去的書，一共借了幾本？",
  "最近30天，一共花了多少小時在學習？"
];

// 取到 .slot-text 容器
const districtSlot = document.getElementById('district-text');
const schoolSlot   = document.getElementById('school-text');
const dataSlot     = document.getElementById('data-text');
const spinButton   = document.getElementById('spin-button');
const srStatus     = document.getElementById('sr-status');
const slotsPanel   = document.querySelector('.slots-panel'); // 可能為 null，要做防呆
const nextHint     = document.getElementById('nextHint');

const uniqueDistricts = [...new Set(window.schoolData.map(d => d.district))];
const schoolNames     = window.schoolData.map(s => s.name);
const rnd = (n) => Math.floor(Math.random() * n);

// DOM 結構檢查（避免 HTML 結構有改動時不小心報錯）
function assertStructure() {
  const ok =
    districtSlot && schoolSlot && dataSlot && spinButton &&
    districtSlot.classList.contains('slot-text') &&
    schoolSlot.classList.contains('slot-text') &&
    dataSlot.classList.contains('slot-text');
  if (!ok) {
    console.warn('[slot] 結構不符合預期：請確認 #district-text / #school-text / #data-text 都是 .slot-text 容器');
  }
}
assertStructure();

// 產生轉輪：A + A（無縫循環）
function buildReel(slotEl, pool, length = 18) {
  const reel = document.createElement('div');
  reel.className = 'reel';
  const A  = Array.from({ length }, () => pool[rnd(pool.length)]);
  const AA = A.concat(A);
  reel.innerHTML = AA.map(v => `<div class="reel-item">${v}</div>`).join('');
  slotEl.innerHTML = '';
  slotEl.appendChild(reel);
  return reel;
}

function startSpin(slotEl, pool) {
  const reel = buildReel(slotEl, pool);
  slotEl.classList.add('spinning');
  return reel;
}

function stopSpin(reelEl, slotEl, finalValue, delay = 1050) {
  return new Promise(resolve => {
    setTimeout(() => {
      slotEl.classList.remove('spinning');
      slotEl.innerHTML = `<span class="slot-lines">${finalValue}</span>`;

      // 停輪微震（防呆：找不到父層就略過）
      const box = slotEl.closest?.('.slot-box');
      if (box) {
        box.classList.add('settle');
        setTimeout(()=>box.classList.remove('settle'),120);
      }

      resolve();
    }, delay);
  });
}

let spinning = false;

async function startRandomizer(){
  if (spinning) return;
  spinning = true;

  // UI：清掉完成狀態與提示（防呆：slotsPanel 可能不存在）
  if (slotsPanel) slotsPanel.classList.remove('done');
  if (nextHint) nextHint.style.opacity = 0;

  // 按鈕狀態
  const origText = spinButton?.textContent || '出題 🔍';
  if (spinButton) {
    spinButton.disabled = true;
    spinButton.setAttribute('aria-pressed','true');
    spinButton.textContent = '運轉中…';
  }

  // 目標
  const school = window.schoolData[rnd(window.schoolData.length)];
  const q = questionBank[rnd(questionBank.length)];

  // 開始轉動
  const districtReel = startSpin(districtSlot, uniqueDistricts);
  const schoolReel   = startSpin(schoolSlot,   schoolNames);
  const dataReel     = startSpin(dataSlot,     questionBank);

  // 依序停輪
  await stopSpin(districtReel, districtSlot, school.district, 900 + rnd(250));
  await stopSpin(schoolReel,   schoolSlot,   school.name,     900 + rnd(250));
  await stopSpin(dataReel,     dataSlot,     q,               900 + rnd(250));

  // 完成狀態 + 提示
  if (slotsPanel) slotsPanel.classList.add('done');
  if (nextHint) nextHint.style.opacity = 1;

  // ARIA 提示
  if (srStatus) {
    srStatus.textContent = `題目完成：請查詢「${school.district} ${school.name}」的「${q}」。`;
  }

  // 還原按鈕
  if (spinButton) {
    spinButton.disabled = false;
    spinButton.setAttribute('aria-pressed','false');
    spinButton.textContent = '再抽一次 🔍';
  }
  spinning = false;
}

spinButton?.addEventListener('click', startRandomizer, { passive: true });
