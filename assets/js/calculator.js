(function () {
  const playerCountInput = document.getElementById('player-count');
  const buildPlayersBtn = document.getElementById('build-players');
  const playersContainer = document.getElementById('players-container');
  const calculateBtn = document.getElementById('calculate-btn');
  const resultTable = document.getElementById('result-table');
  const summaryOutput = document.getElementById('summary-output');
  const copySummaryBtn = document.getElementById('copy-summary-btn');

  function buildPlayerRows() {
    const count = Math.max(1, Number(playerCountInput.value || 5));
    playersContainer.innerHTML = '';
    for (let idx = 0; idx < count; idx += 1) {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML = `
        <label>
          <span>Name</span>
          <input type="text" class="player-name" value="P${idx + 1}" />
        </label>
        <label>
          <span>Camp</span>
          <select class="player-camp">
            <option value="good">Good</option>
            <option value="evil">Evil</option>
          </select>
        </label>
        <label>
          <span>Win?</span>
          <select class="player-win">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label>
          <span>Merlin</span>
          <select class="player-merlin">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        <label>
          <span>Assassin</span>
          <select class="player-assassin">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      `;
      playersContainer.appendChild(row);
    }
  }

  function collectPlayers() {
    const rows = [...playersContainer.querySelectorAll('.player-row')];
    return rows.map(row => ({
      name: row.querySelector('.player-name').value.trim() || 'Player',
      camp: row.querySelector('.player-camp').value,
      win: row.querySelector('.player-win').value === 'yes',
      isMerlin: row.querySelector('.player-merlin').value === 'yes',
      isAssassin: row.querySelector('.player-assassin').value === 'yes'
    }));
  }

  function calculate() {
    const i = Number(document.getElementById('base-i').value || 1);
    const j = Number(document.getElementById('base-j').value || 5);
    const z = Number(document.getElementById('base-z').value || 2);
    const players = collectPlayers();
    const evilSabotageWin = document.getElementById('event-evil-sabotage-win').checked;
    const assassinHitMerlin = document.getElementById('event-assassin-hit-merlin').checked;
    const goodCleanWin = document.getElementById('event-good-clean-win').checked;
    const evilSaboteurCount = Number(document.getElementById('evil-saboteur-count').value || 0);

    const prizePool = players.length * z * i;

    const results = players.map(player => {
      let mainScore = player.win ? i * j : -i * j;
      let specialScore = 0;

      if (evilSabotageWin) {
        specialScore += player.camp === 'evil' ? i : -i;
      }
      if (assassinHitMerlin) {
        specialScore += player.camp === 'evil' ? i : -i;
        if (player.isAssassin) specialScore += i;
        if (player.isMerlin) specialScore -= i;
      }
      if (goodCleanWin) {
        specialScore += player.camp === 'good' ? i : -i;
      }
      if (evilSabotageWin && evilSaboteurCount === 2) {
        specialScore += player.camp === 'evil' ? i : -i;
      }
      if (evilSabotageWin && evilSaboteurCount === 3) {
        specialScore += player.camp === 'evil' ? 2 * i : -2 * i;
      }

      const total = mainScore + specialScore;
      return { ...player, mainScore, specialScore, total };
    });

    render(results, prizePool, { i, j, z, evilSabotageWin, assassinHitMerlin, goodCleanWin, evilSaboteurCount });
  }

  function render(results, prizePool, config) {
    const rows = results.map(r => `
      <tr>
        <td>${escapeHtml(r.name)}</td>
        <td>${r.camp}</td>
        <td>${r.mainScore}</td>
        <td>${r.specialScore}</td>
        <td>${r.total}</td>
      </tr>
    `).join('');

    resultTable.innerHTML = `
      <table class="result-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Camp</th>
            <th>Main</th>
            <th>Special</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    const summaryLines = [
      `Chip Avalon settlement summary`,
      `i=${config.i}, j=${config.j}, z=${config.z}`,
      `Prize Pool = ${prizePool}`,
      `Events: sabotageWin=${config.evilSabotageWin}, assassinHitMerlin=${config.assassinHitMerlin}, goodCleanWin=${config.goodCleanWin}, evilSaboteurCount=${config.evilSaboteurCount}`,
      ...results.map(r => `${r.name}: main=${r.mainScore}, special=${r.specialScore}, total=${r.total}`)
    ];
    summaryOutput.textContent = summaryLines.join('\n');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (buildPlayersBtn) buildPlayersBtn.addEventListener('click', buildPlayerRows);
  if (calculateBtn) calculateBtn.addEventListener('click', calculate);
  if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(summaryOutput.textContent || '');
        copySummaryBtn.textContent = 'Copied';
        setTimeout(() => { copySummaryBtn.textContent = 'Copy Summary'; }, 1200);
      } catch (_) {}
    });
  }

  buildPlayerRows();
})();
