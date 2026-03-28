const playersContainer = document.getElementById("players-container");
const addPlayerBtn = document.getElementById("add-player-btn");
const resetPlayersBtn = document.getElementById("reset-players-btn");
const calculateBtn = document.getElementById("calculate-btn");
const copySummaryBtn = document.getElementById("copy-summary-btn");
const resultTable = document.getElementById("result-table");
const summaryOutput = document.getElementById("summary-output");

const textMap = {
  zh: {
    player: "玩家",
    playerName: "玩家姓名",
    camp: "阵营",
    good: "好人",
    evil: "坏人",
    win: "是否属于最终胜利阵营",
    yes: "是",
    no: "否",
    role: "角色",
    normal: "普通",
    assassin: "刺客",
    merlin: "梅林",
    extra: "个人额外修正",
    remove: "删除",
    namePlaceholder: "例如：玩家1",
    baseScore: "主局分",
    bonusScore: "特殊分",
    totalScore: "总分",
    payment: "收付",
    receive: "应收",
    pay: "应付",
    neutral: "持平",
    result: "结算结果",
    copied: "摘要已复制到剪贴板",
    copyFailed: "复制失败，请手动复制",
    summaryTitle: "籌碼阿瓦隆结算摘要",
    invalidPlayerCount: "至少保留 1 名玩家",
    tableName: "姓名",
    tableCamp: "阵营",
    tableOutcome: "胜负",
    tableBase: "主局分",
    tableBonus: "特殊分",
    tableExtra: "个人修正",
    tableTotal: "总分",
    tablePayment: "收付"
  },
  en: {
    player: "Player",
    playerName: "Player Name",
    camp: "Camp",
    good: "Good",
    evil: "Evil",
    win: "In winning camp",
    yes: "Yes",
    no: "No",
    role: "Role",
    normal: "Normal",
    assassin: "Assassin",
    merlin: "Merlin",
    extra: "Personal Adjustment",
    remove: "Remove",
    namePlaceholder: "e.g. Player 1",
    baseScore: "Base",
    bonusScore: "Bonus",
    totalScore: "Total",
    payment: "Payment",
    receive: "Receive",
    pay: "Pay",
    neutral: "Even",
    result: "Settlement Results",
    copied: "Summary copied to clipboard",
    copyFailed: "Copy failed. Please copy manually.",
    summaryTitle: "Chip Avalon Settlement Summary",
    invalidPlayerCount: "At least 1 player is required",
    tableName: "Name",
    tableCamp: "Camp",
    tableOutcome: "Outcome",
    tableBase: "Base",
    tableBonus: "Bonus",
    tableExtra: "Extra",
    tableTotal: "Total",
    tablePayment: "Payment"
  }
};

function getLang() {
  return localStorage.getItem("site-lang") === "en" ? "en" : "zh";
}

function t(key) {
  return textMap[getLang()][key] || key;
}

function getNextPlayerIndex() {
  return playersContainer.querySelectorAll(".player-row").length + 1;
}

function createPlayerRow(defaultName = "") {
  const idx = getNextPlayerIndex();
  const row = document.createElement("div");
  row.className = "player-row";

  row.innerHTML = `
    <div class="player-row-head">
      <div class="player-row-title">${t("player")} ${idx}</div>
      <button type="button" class="danger-btn remove-player-btn">${t("remove")}</button>
    </div>

    <div class="form-grid">
      <label>
        <span>${t("playerName")}</span>
        <input type="text" class="player-name" value="${defaultName || ""}" placeholder="${t("namePlaceholder")}" />
      </label>

      <label>
        <span>${t("camp")}</span>
        <select class="player-camp">
          <option value="good">${t("good")}</option>
          <option value="evil">${t("evil")}</option>
        </select>
      </label>

      <label>
        <span>${t("win")}</span>
        <select class="player-win">
          <option value="yes">${t("yes")}</option>
          <option value="no">${t("no")}</option>
        </select>
      </label>

      <label>
        <span>${t("role")}</span>
        <select class="player-role">
          <option value="normal">${t("normal")}</option>
          <option value="assassin">${t("assassin")}</option>
          <option value="merlin">${t("merlin")}</option>
        </select>
      </label>

      <label>
        <span>${t("extra")}</span>
        <input type="number" class="player-extra" value="0" step="1" />
      </label>
    </div>
  `;

  const removeBtn = row.querySelector(".remove-player-btn");
  removeBtn.addEventListener("click", () => {
    const rows = playersContainer.querySelectorAll(".player-row");
    if (rows.length <= 1) {
      alert(t("invalidPlayerCount"));
      return;
    }
    row.remove();
    refreshPlayerTitles();
  });

  playersContainer.appendChild(row);
}

function refreshPlayerTitles() {
  const rows = playersContainer.querySelectorAll(".player-row");
  rows.forEach((row, index) => {
    const title = row.querySelector(".player-row-title");
    if (title) {
      title.textContent = `${t("player")} ${index + 1}`;
    }
  });
}

function rebuildPlayerLabels() {
  const rows = Array.from(playersContainer.querySelectorAll(".player-row")).map((row) => ({
    name: row.querySelector(".player-name").value,
    camp: row.querySelector(".player-camp").value,
    win: row.querySelector(".player-win").value,
    role: row.querySelector(".player-role").value,
    extra: row.querySelector(".player-extra").value
  }));

  playersContainer.innerHTML = "";
  rows.forEach((p) => {
    createPlayerRow(p.name);
    const row = playersContainer.lastElementChild;
    row.querySelector(".player-camp").value = p.camp;
    row.querySelector(".player-win").value = p.win;
    row.querySelector(".player-role").value = p.role;
    row.querySelector(".player-extra").value = p.extra;
  });
  refreshPlayerTitles();
}

function resetPlayers(count = 5) {
  playersContainer.innerHTML = "";
  for (let i = 1; i <= count; i += 1) {
    createPlayerRow(`${t("player")} ${i}`);
  }
  refreshPlayerTitles();
}

function readNumber(id, fallback = 0) {
  const el = document.getElementById(id);
  const val = Number(el.value);
  return Number.isFinite(val) ? val : fallback;
}

function getPlayersData() {
  return Array.from(playersContainer.querySelectorAll(".player-row")).map((row, index) => {
    const name = row.querySelector(".player-name").value.trim() || `${t("player")} ${index + 1}`;
    const camp = row.querySelector(".player-camp").value;
    const win = row.querySelector(".player-win").value === "yes";
    const role = row.querySelector(".player-role").value;
    const extra = Number(row.querySelector(".player-extra").value) || 0;

    return { name, camp, win, role, extra };
  });
}

function calculateResults() {
  const i = readNumber("base-i", 1);
  const j = readNumber("base-j", 5);
  const z = readNumber("base-z", 2);

  const evilSabotageWin = document.getElementById("event-evil-sabotage-win").checked;
  const assassinHitMerlin = document.getElementById("event-assassin-hit-merlin").checked;
  const goodCleanWin = document.getElementById("event-good-clean-win").checked;
  const evilSaboteurCount = Number(document.getElementById("evil-saboteur-count").value) || 0;

  const players = getPlayersData();

  players.forEach((p) => {
    p.base = p.win ? i * j : -i * j;
    p.bonus = 0;

    if (evilSabotageWin) {
      p.bonus += p.camp === "evil" ? i : -i;
    }

    if (assassinHitMerlin) {
      p.bonus += p.camp === "evil" ? i : -i;
      if (p.role === "assassin") p.bonus += i;
      if (p.role === "merlin") p.bonus -= i;
    }

    if (goodCleanWin) {
      p.bonus += p.camp === "good" ? i : -i;
    }

    if (evilSabotageWin && evilSaboteurCount === 2) {
      p.bonus += p.camp === "evil" ? i : -i;
    }

    if (evilSabotageWin && evilSaboteurCount === 3) {
      p.bonus += p.camp === "evil" ? 2 * i : -2 * i;
    }

    p.total = p.base + p.bonus + p.extra;
    p.payment = p.total;
  });

  const pool = players.length * z * i;
  return { i, j, z, players, pool };
}

function renderResults(data) {
  const lang = getLang();

  const rowsHtml = data.players.map((p) => {
    const totalClass = p.total > 0 ? "result-positive" : p.total < 0 ? "result-negative" : "";
    const paymentText =
      p.payment > 0
        ? `${t("receive")} ${p.payment}`
        : p.payment < 0
          ? `${t("pay")} ${Math.abs(p.payment)}`
          : t("neutral");

    return `
      <tr>
        <td>${p.name}</td>
        <td>${p.camp === "good" ? t("good") : t("evil")}</td>
        <td>${p.win ? t("yes") : t("no")}</td>
        <td>${p.base}</td>
        <td>${p.bonus}</td>
        <td>${p.extra}</td>
        <td class="${totalClass}">${p.total}</td>
        <td class="${totalClass}">${paymentText}</td>
      </tr>
    `;
  }).join("");

  resultTable.innerHTML = `
    <div class="result-table-wrap">
      <table class="result-table">
        <thead>
          <tr>
            <th>${t("tableName")}</th>
            <th>${t("tableCamp")}</th>
            <th>${t("tableOutcome")}</th>
            <th>${t("tableBase")}</th>
            <th>${t("tableBonus")}</th>
            <th>${t("tableExtra")}</th>
            <th>${t("tableTotal")}</th>
            <th>${t("tablePayment")}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;

  const summaryLines = [
    t("summaryTitle"),
    `i=${data.i}, j=${data.j}, z=${data.z}`,
    `Pool=${data.pool}`,
    ""
  ];

  data.players.forEach((p) => {
    const paymentText =
      p.payment > 0
        ? `${t("receive")} ${p.payment}`
        : p.payment < 0
          ? `${t("pay")} ${Math.abs(p.payment)}`
          : t("neutral");

    summaryLines.push(
      `${p.name} | ${p.camp === "good" ? t("good") : t("evil")} | ${t("baseScore")}: ${p.base} | ${t("bonusScore")}: ${p.bonus} | ${t("totalScore")}: ${p.total} | ${t("payment")}: ${paymentText}`
    );
  });

  summaryOutput.textContent = summaryLines.join("\n");
}

function handleCalculate() {
  const data = calculateResults();
  renderResults(data);
}

async function handleCopySummary() {
  try {
    await navigator.clipboard.writeText(summaryOutput.textContent || "");
    alert(t("copied"));
  } catch (err) {
    alert(t("copyFailed"));
  }
}

addPlayerBtn.addEventListener("click", () => {
  createPlayerRow(`${t("player")} ${getNextPlayerIndex()}`);
  refreshPlayerTitles();
});

resetPlayersBtn.addEventListener("click", () => {
  resetPlayers(5);
  resultTable.innerHTML = "";
  summaryOutput.textContent = "";
});

calculateBtn.addEventListener("click", handleCalculate);
copySummaryBtn.addEventListener("click", handleCopySummary);

window.addEventListener("storage", (event) => {
  if (event.key === "site-lang") {
    rebuildPlayerLabels();
    const currentSummary = summaryOutput.textContent.trim();
    if (currentSummary) {
      handleCalculate();
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  resetPlayers(5);

  const observer = new MutationObserver(() => {
    rebuildPlayerLabels();
  });

  const btnZh = document.getElementById("btn-zh");
  const btnEn = document.getElementById("btn-en");

  if (btnZh) {
    btnZh.addEventListener("click", () => {
      setTimeout(() => {
        rebuildPlayerLabels();
        if (summaryOutput.textContent.trim()) handleCalculate();
      }, 0);
    });
  }

  if (btnEn) {
    btnEn.addEventListener("click", () => {
      setTimeout(() => {
        rebuildPlayerLabels();
        if (summaryOutput.textContent.trim()) handleCalculate();
      }, 0);
    });
  }
});
