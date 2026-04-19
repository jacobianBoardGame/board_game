/* tournament.js — schema v0.2
 * Data model:
 *   games[]:
 *     { id, date (YYYY-MM-DD), season, note?, players[]:
 *         { name, finalScore, rounds[]: { camp: 'red'|'blue', won: bool } }
 *     }
 *
 * Aggregation per player (over filtered games):
 *   games       = # of games participated
 *   score       = sum of finalScore
 *   avg         = score / games
 *   rounds      = total rounds played across games
 *   redGames    = rounds played as red
 *   blueGames   = rounds played as blue
 *   redWins     = red rounds won
 *   blueWins    = blue rounds won
 *   wins        = redWins + blueWins
 *   winrate     = wins / rounds
 */
(function () {
  'use strict';

  const DATA_URL = './assets/data/tournament.json';

  const state = {
    raw: null,
    sortKey: 'score',
    sortDir: 'desc',
  };

  fetch(DATA_URL, { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(init)
    .catch(err => {
      console.error('[tournament] load failed:', err);
      const e = document.getElementById('empty');
      e.hidden = false;
      e.textContent = 'Failed to load tournament.json — check path and JSON syntax.';
    });

  function init(data) {
    state.raw = data;
    setText('data-version', data.version || '-');
    setText('data-updated', data.updated || '-');
    setText('data-version-en', data.version || '-');
    setText('data-updated-en', data.updated || '-');

    const years = [...new Set((data.games || []).map(g => g.date.slice(0, 4)))].sort().reverse();
    fillSelect('f-year', years.map(y => ({ value: y, label: y })));
    fillSelect('f-season', (data.seasons || []).map(s => ({ value: s.id, label: s.label || s.id })));

    document.getElementById('f-scope').addEventListener('change', onScopeChange);
    document.getElementById('f-year').addEventListener('change', render);
    document.getElementById('f-month').addEventListener('change', render);
    document.getElementById('f-season').addEventListener('change', render);
    document.getElementById('f-reset').addEventListener('click', () => {
      document.getElementById('f-scope').value = 'all';
      onScopeChange();
    });

    document.querySelectorAll('#standings th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        else { state.sortKey = key; state.sortDir = key === 'name' ? 'asc' : 'desc'; }
        render();
      });
    });

    render();
  }

  function onScopeChange() {
    const v = document.getElementById('f-scope').value;
    document.getElementById('f-year-wrap').hidden   = v !== 'year';
    document.getElementById('f-month-wrap').hidden  = v !== 'month';
    document.getElementById('f-season-wrap').hidden = v !== 'season';
    render();
  }

  function applyFilter(games) {
    const scope = document.getElementById('f-scope').value;
    if (scope === 'year') {
      const y = document.getElementById('f-year').value;
      return games.filter(g => g.date.startsWith(y));
    }
    if (scope === 'month') {
      const ym = document.getElementById('f-month').value;
      if (!ym) return games;
      return games.filter(g => g.date.startsWith(ym));
    }
    if (scope === 'season') {
      const s = document.getElementById('f-season').value;
      return games.filter(g => g.season === s);
    }
    return games;
  }

  function aggregate(games) {
    const agg = new Map();
    const get = name => {
      if (!agg.has(name)) {
        agg.set(name, {
          name, games: 0, score: 0,
          rounds: 0, redGames: 0, blueGames: 0,
          wins: 0, redWins: 0, blueWins: 0,
        });
      }
      return agg.get(name);
    };
    games.forEach(g => {
      (g.players || []).forEach(p => {
        const s = get(p.name);
        s.games += 1;
        s.score += Number(p.finalScore) || 0;
        (p.rounds || []).forEach(r => {
          s.rounds += 1;
          if (r.camp === 'red')  s.redGames  += 1;
          if (r.camp === 'blue') s.blueGames += 1;
          if (r.won) {
            s.wins += 1;
            if (r.camp === 'red')  s.redWins  += 1;
            if (r.camp === 'blue') s.blueWins += 1;
          }
        });
      });
    });
    return [...agg.values()].map(s => ({
      ...s,
      avg: s.games ? s.score / s.games : 0,
      winrate: s.rounds ? s.wins / s.rounds : 0,
    }));
  }

  function render() {
    const games = applyFilter(state.raw.games || []);
    renderSummary(games);
    const stats = aggregate(games);
    renderMVP(stats);
    renderTable(stats);
    renderGames(games);
  }

  function renderSummary(games) {
    const el = document.getElementById('f-summary');
    if (!games.length) { el.textContent = 'No games in scope.'; return; }
    const totalRounds = games.reduce((n, g) =>
      n + (g.players?.[0]?.rounds?.length || 0), 0); // rounds per game ≈ length of any player's rounds
    el.textContent = `${games.length} games · ~${totalRounds} rounds total`;
  }

  function renderMVP(stats) {
    const box = document.getElementById('mvp-box');
    box.innerHTML = '';
    if (!stats.length) return;

    const pick = (key) => [...stats].sort((a, b) => b[key] - a[key])[0];
    const byScore = pick('score');
    const byWinrate = [...stats].filter(s => s.rounds >= 1).sort((a, b) => b.winrate - a.winrate)[0] || stats[0];
    const byRed   = pick('redWins');
    const byBlue  = pick('blueWins');

    const mk = (label, s, val) => `
      <div class="mvp-box">
        <div class="t-muted">${label}</div>
        <div class="mvp-name">${escapeHtml(s.name)}</div>
        <div class="t-muted">${val}</div>
      </div>`;

    box.innerHTML =
      mk('Top score',  byScore,   `${byScore.score} pts · ${byScore.games} games`) +
      mk('Best winrate', byWinrate, `${(byWinrate.winrate*100).toFixed(0)}% (${byWinrate.wins}/${byWinrate.rounds})`) +
      mk('Red MVP',    byRed,     `${byRed.redWins} wins / ${byRed.redGames} red rounds`) +
      mk('Blue MVP',   byBlue,    `${byBlue.blueWins} wins / ${byBlue.blueGames} blue rounds`);
  }

  function renderTable(stats) {
    const tbody = document.querySelector('#standings tbody');
    const empty = document.getElementById('empty');
    tbody.innerHTML = '';
    if (!stats.length) { empty.hidden = false; return; }
    empty.hidden = true;

    const { sortKey, sortDir } = state;
    stats.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    document.querySelectorAll('#standings th[data-sort]').forEach(th => {
      th.classList.remove('asc', 'desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortDir);
    });

    stats.forEach((s, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="t-rank">${i + 1}</td>
        <td>${escapeHtml(s.name)}</td>
        <td class="num">${s.games}</td>
        <td class="num">${s.score}</td>
        <td class="num">${s.avg.toFixed(2)}</td>
        <td class="num">${s.rounds}</td>
        <td class="num">${s.redWins}</td>
        <td class="num">${s.redGames}</td>
        <td class="num">${s.blueWins}</td>
        <td class="num">${s.blueGames}</td>
        <td class="num">${(s.winrate * 100).toFixed(0)}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderGames(games) {
    const wrap = document.getElementById('games-log');
    wrap.innerHTML = '';
    if (!games.length) return;
    [...games].sort((a, b) => b.date.localeCompare(a.date)).forEach(g => {
      const det = document.createElement('details');
      const roundCount = g.players?.[0]?.rounds?.length || 0;
      det.innerHTML = `
        <summary>
          <strong>${g.date}</strong> · ${escapeHtml(g.id)} · ${roundCount} rounds
          ${g.note ? `<span class="t-muted"> — ${escapeHtml(g.note)}</span>` : ''}
        </summary>
        <table class="t-table" style="margin-top:6px">
          <thead>
            <tr>
              <th>Player</th>
              <th>Rounds (camp · result)</th>
              <th class="num">Red W/P</th>
              <th class="num">Blue W/P</th>
              <th class="num">Final</th>
            </tr>
          </thead>
          <tbody>
            ${(g.players || []).map(p => {
              const rW = p.rounds.filter(r => r.camp === 'red'  && r.won).length;
              const rP = p.rounds.filter(r => r.camp === 'red').length;
              const bW = p.rounds.filter(r => r.camp === 'blue' && r.won).length;
              const bP = p.rounds.filter(r => r.camp === 'blue').length;
              const dots = p.rounds.map(r => {
                const cls = (r.camp === 'red' ? 'r' : 'b') + (r.won ? '' : ' lose');
                return `<span class="${cls}" title="${r.camp} · ${r.won ? 'W' : 'L'}">${r.won ? '✓' : '·'}</span>`;
              }).join('');
              return `
                <tr>
                  <td>${escapeHtml(p.name)}</td>
                  <td><span class="t-round-dots">${dots}</span></td>
                  <td class="num">${rW}/${rP}</td>
                  <td class="num">${bW}/${bP}</td>
                  <td class="num">${p.finalScore}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>`;
      wrap.appendChild(det);
    });
  }

  // ---------- utils ----------
  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function fillSelect(id, opts) {
    const sel = document.getElementById(id);
    opts.forEach(o => {
      const el = document.createElement('option');
      el.value = o.value; el.textContent = o.label;
      sel.appendChild(el);
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
})();