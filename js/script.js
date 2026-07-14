(function () {
  "use strict";

  // State & Defaults

  function createExampleData() {
    return {
      criteria: [
        { name: "Penghasilan Orang tua", weight: 0.25 },
        { name: "Tes Penerimaan Mahasiswa Baru", weight: 0.25 },
        { name: "Hasil Wawancara", weight: 0.20 },
        { name: "Surat Penunjang", weight: 0.20 },
        { name: "Data Prestasi", weight: 0.10 },
      ],
      alternatives: [
        { id: "A1",  values: [4, 5, 5, 1, 5] },
        { id: "A2",  values: [5, 4, 3, 3, 5] },
        { id: "A3",  values: [5, 5, 3, 3, 5] },
        { id: "A4",  values: [3, 5, 3, 3, 4] },
        { id: "A5",  values: [4, 5, 5, 5, 4] },
        { id: "A6",  values: [2, 4, 1, 3, 4] },
        { id: "A7",  values: [2, 4, 3, 3, 4] },
        { id: "A8",  values: [3, 4, 5, 3, 5] },
        { id: "A9",  values: [5, 3, 3, 3, 5] },
        { id: "A10", values: [5, 4, 5, 1, 5] },
      ],
    };
  }

  let state = createExampleData();

  function saveState() {
    try { localStorage.setItem("spk_dia_state", JSON.stringify(state)); } catch (e) {}
  }
  function loadState() {
    try {
      const saved = localStorage.getItem("spk_dia_state");
      if (saved) { state = JSON.parse(saved); return true; }
    } catch (e) {}
    return false;
  }

  // DIA Math Core

  function compute() {
    const criteria     = state.criteria;
    const alternatives = state.alternatives;
    const numCriteria     = criteria.length;
    const numAlternatives = alternatives.length;

    const divisors = [];
    for (let j = 0; j < numCriteria; j++) {
      let sumOfSquares = 0;
      for (let i = 0; i < numAlternatives; i++) {
        sumOfSquares += Math.pow(alternatives[i].values[j] || 0, 2);
      }
      divisors.push(Math.sqrt(sumOfSquares));
    }

    const normalizedMatrix = alternatives.map((alt) =>
      alt.values.map((value, j) =>
        divisors[j] === 0 ? 0 : (value || 0) / divisors[j]
      )
    );

    const weightedMatrix = normalizedMatrix.map((row) =>
      row.map((value, j) => value * (criteria[j].weight || 0))
    );

    const idealPositive = [];
    const idealNegative = [];
    for (let j = 0; j < numCriteria; j++) {
      const column = weightedMatrix.map((row) => row[j]);
      idealPositive.push(Math.max(...column));
      idealNegative.push(Math.min(...column));
    }

    const distancePlus = weightedMatrix.map((row) =>
      row.reduce((acc, value, j) => acc + Math.abs(value - idealPositive[j]), 0)
    );
    const distanceMinus = weightedMatrix.map((row) =>
      row.reduce((acc, value, j) => acc + Math.abs(value - idealNegative[j]), 0)
    );

    const piaMinDPlus  = numAlternatives ? Math.min(...distancePlus)  : 0;
    const piaMaxDMinus = numAlternatives ? Math.max(...distanceMinus) : 0;

    const riValues = distancePlus.map((dPlus, i) =>
      Math.sqrt(
        Math.pow(dPlus - piaMinDPlus, 2) +
        Math.pow(distanceMinus[i] - piaMaxDMinus, 2)
      )
    );

    const sorted = [...riValues].sort((a, b) => a - b);
    const ranks  = riValues.map((ri) => sorted.indexOf(ri) + 1);

    return {
      divisors,
      normalizedMatrix,
      weightedMatrix,
      idealPositive,
      idealNegative,
      distancePlus,
      distanceMinus,
      piaMinDPlus,
      piaMaxDMinus,
      riValues,
      ranks,
    };
  }

  // Helpers

  function fmt(value, decimals) {
    if (value === undefined || value === null || isNaN(value)) return "—";
    return Number(value).toFixed(decimals === undefined ? 4 : decimals);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
    );
  }

  // Navigation

  const pageSubtitles = {
    dashboard:    "Dashboard",
    kriteria:     "Data Kriteria",
    alternatif:   "Data Alternatif",
    penilaian:    "Penilaian Alternatif",
    perhitungan:  "Perhitungan DIA",
    ranking:      "Hasil Ranking",
  };

  let currentPage = "dashboard";

  function navigateTo(page) {
    currentPage = page;

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.page === page);
    });

    document.querySelectorAll(".page").forEach((p) => {
      p.classList.toggle("active", p.id === "page-" + page);
    });

    document.getElementById("pageSubtitle").textContent = pageSubtitles[page] || "";

    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");

    renderPage(page);
  }

  document.getElementById("sidebarNav").addEventListener("click", (event) => {
    const navItem = event.target.closest(".nav-item");
    if (!navItem) return;
    const targetPage = navItem.dataset.page;
    if (!targetPage) return;
    event.preventDefault();
    navigateTo(targetPage);
  });

  document.getElementById("btnHamburger").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("sidebarOverlay").classList.toggle("active");
  });
  document.getElementById("sidebarOverlay").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");
  });

  // Dashboard

  let barChartInstance = null;
  let pieChartInstance = null;

  function renderDashboard() {
    const result = compute();
    const alternatives = state.alternatives;
    const criteria     = state.criteria;

    const sortedOrder = alternatives.map((_a, i) => i).sort((x, y) => result.riValues[x] - result.riValues[y]);
    const winnerIndex = sortedOrder[0];
    const winnerName  = alternatives[winnerIndex]?.id ?? "—";
    const winnerRi    = fmt(result.riValues[winnerIndex], 6);

    document.getElementById("summaryCards").innerHTML = `
      <div class="summary-card">
        <div class="summary-card-icon blue">
          <span class="material-icons-round">tune</span>
        </div>
        <div>
          <div class="summary-card-label">Jumlah Kriteria</div>
          <div class="summary-card-value">${criteria.length}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card-icon green">
          <span class="material-icons-round">group</span>
        </div>
        <div>
          <div class="summary-card-label">Jumlah Alternatif</div>
          <div class="summary-card-value">${alternatives.length}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card-icon purple">
          <span class="material-icons-round">emoji_events</span>
        </div>
        <div>
          <div class="summary-card-label">Alternatif Terbaik</div>
          <div class="summary-card-value">${escapeHtml(winnerName)}</div>
          <div class="summary-card-sub">(Ri: ${winnerRi})</div>
        </div>
      </div>
    `;

    renderBarChart("chartBar", result, alternatives, sortedOrder);
    renderPieChart("chartPie", criteria);
  }

  function renderBarChart(canvasId, result, alternatives, sortedOrder) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (canvasId === "chartBar" && barChartInstance) { barChartInstance.destroy(); }
    if (canvasId === "chartBarRanking" && barChartRankingInstance) { barChartRankingInstance.destroy(); }

    const labels = sortedOrder.map((i) => alternatives[i].id);
    const data   = sortedOrder.map((i) => +fmt(result.riValues[i], 6));

    const chartColors = sortedOrder.map((_i, idx) =>
      idx === 0 ? "rgba(59, 130, 246, 0.85)" : "rgba(147, 197, 253, 0.7)"
    );

    const instance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Nilai Ri",
          data: data,
          backgroundColor: chartColors,
          borderColor: sortedOrder.map((_i, idx) =>
            idx === 0 ? "rgba(37, 99, 235, 1)" : "rgba(96, 165, 250, 1)"
          ),
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Nilai Ri: ${ctx.parsed.y}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(0,0,0,0.05)" },
            ticks: { font: { family: "'IBM Plex Mono'" } },
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Inter'" } },
          },
        },
      },
    });

    if (canvasId === "chartBar") barChartInstance = instance;
    if (canvasId === "chartBarRanking") barChartRankingInstance = instance;
  }

  function renderPieChart(canvasId, criteria) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (canvasId === "chartPie" && pieChartInstance) { pieChartInstance.destroy(); }
    if (canvasId === "chartPieRanking" && pieChartRankingInstance) { pieChartRankingInstance.destroy(); }

    const labels = criteria.map((c, i) => `C${i + 1}`);
    const data   = criteria.map((c) => c.weight);
    const colors = [
      "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE",
      "#2563EB", "#1D4ED8", "#1E40AF", "#1E3A8A", "#172554",
    ];

    const instance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, criteria.length),
          borderColor: "#fff",
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: "rect",
              font: { family: "'Inter'", size: 12 },
              generateLabels: (chart) => {
                const dataset = chart.data.datasets[0];
                return chart.data.labels.map((label, i) => ({
                  text: `${label}: ${dataset.data[i]}`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: "#fff",
                  lineWidth: 2,
                  pointStyle: "rect",
                  index: i,
                }));
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${ctx.parsed}`,
            },
          },
        },
      },
    });

    if (canvasId === "chartPie") pieChartInstance = instance;
    if (canvasId === "chartPieRanking") pieChartRankingInstance = instance;
  }

  // Data Kriteria

  function renderKriteriaPage() {
    const criteria = state.criteria;
    const table = document.getElementById("kriteriaTable");

    let html = `<thead><tr>
      <th class="center" style="width:80px;">Kode</th>
      <th>Nama</th>
      <th class="center" style="width:120px;">Bobot</th>
      <th class="center" style="width:100px;">Aksi</th>
    </tr></thead><tbody>`;

    criteria.forEach((criterion, j) => {
      html += `<tr>
        <td class="center"><span class="code-badge">C${j + 1}</span></td>
        <td>
          <input type="text" data-role="crit-name" data-j="${j}" value="${escapeHtml(criterion.name)}" style="text-align:left; width:100%;">
        </td>
        <td class="center">
          <input type="number" step="any" min="0" data-role="crit-weight" data-j="${j}" value="${criterion.weight}" style="width:80px;">
        </td>
        <td class="center">
          <div class="action-btns">
            ${criteria.length > 1
              ? `<button class="action-btn delete" data-role="del-crit" data-j="${j}" title="Hapus">
                  <span class="material-icons-round">delete</span>
                </button>`
              : ""
            }
          </div>
        </td>
      </tr>`;
    });
    html += "</tbody>";
    table.innerHTML = html;

    document.getElementById("kriteriaFooter").innerHTML =
      `Menampilkan ${criteria.length} dari ${criteria.length} kriteria`;

    table.querySelectorAll('[data-role="crit-name"]').forEach((el) => {
      el.addEventListener("input", (event) => {
        state.criteria[+event.target.dataset.j].name = event.target.value;
        saveState();
      });
    });
    table.querySelectorAll('[data-role="crit-weight"]').forEach((el) => {
      el.addEventListener("input", (event) => {
        state.criteria[+event.target.dataset.j].weight = parseFloat(event.target.value) || 0;
        saveState();
        renderWeightBadge();
      });
    });
    table.querySelectorAll('[data-role="del-crit"]').forEach((el) => {
      el.addEventListener("click", (event) => {
        const j = +event.currentTarget.dataset.j;
        state.criteria.splice(j, 1);
        state.alternatives.forEach((alt) => alt.values.splice(j, 1));
        saveState();
        renderKriteriaPage();
        renderWeightBadge();
      });
    });

    renderWeightBadge();
  }

  document.getElementById("btnAddCriteria").addEventListener("click", () => {
    state.criteria.push({
      name: "Kriteria " + (state.criteria.length + 1),
      weight: 0,
    });
    state.alternatives.forEach((alt) => alt.values.push(3));
    saveState();
    renderKriteriaPage();
  });

  // Data Alternatif

  function renderAlternatifPage() {
    const alternatives = state.alternatives;
    const table = document.getElementById("alternatifTable");

    let html = `<thead><tr>
      <th class="center" style="width:80px;">Kode</th>
      <th>Nama Alternatif</th>
      <th class="center" style="width:100px;">Aksi</th>
    </tr></thead><tbody>`;

    alternatives.forEach((alt, i) => {
      html += `<tr>
        <td class="center"><span class="code-badge">A${i + 1}</span></td>
        <td>
          <input type="text" data-role="alt-name" data-i="${i}" value="${escapeHtml(alt.id)}" style="text-align:left; width:100%;">
        </td>
        <td class="center">
          <div class="action-btns">
            ${alternatives.length > 1
              ? `<button class="action-btn delete" data-role="del-alt" data-i="${i}" title="Hapus">
                  <span class="material-icons-round">delete</span>
                </button>`
              : ""
            }
          </div>
        </td>
      </tr>`;
    });
    html += "</tbody>";
    table.innerHTML = html;

    document.getElementById("alternatifFooter").innerHTML =
      `Menampilkan ${alternatives.length} dari ${alternatives.length} alternatif`;

    table.querySelectorAll('[data-role="alt-name"]').forEach((el) => {
      el.addEventListener("input", (event) => {
        state.alternatives[+event.target.dataset.i].id = event.target.value;
        saveState();
      });
    });
    table.querySelectorAll('[data-role="del-alt"]').forEach((el) => {
      el.addEventListener("click", (event) => {
        const i = +event.currentTarget.dataset.i;
        state.alternatives.splice(i, 1);
        saveState();
        renderAlternatifPage();
      });
    });
  }

  document.getElementById("btnAddAlternative").addEventListener("click", () => {
    const numCriteria = state.criteria.length;
    state.alternatives.push({
      id: "A" + (state.alternatives.length + 1),
      values: new Array(numCriteria).fill(3),
    });
    saveState();
    renderAlternatifPage();
  });

  // Penilaian

  function renderPenilaianPage() {
    const criteria     = state.criteria;
    const alternatives = state.alternatives;
    const table        = document.getElementById("penilaianTable");

    let html = "<thead><tr><th>Alternatif</th>";
    criteria.forEach((c, j) => {
      html += `<th class="center">
        <div><strong>C${j + 1}</strong></div>
        <div style="font-size:11px;font-weight:400;color:#94A3B8;text-transform:none;letter-spacing:0;">${escapeHtml(c.name)}</div>
      </th>`;
    });
    html += "</tr></thead><tbody>";

    alternatives.forEach((alt, i) => {
      html += `<tr><td>
        <span class="code-badge">A${i + 1}</span>
        <span style="margin-left:8px;">${escapeHtml(alt.id)}</span>
      </td>`;
      criteria.forEach((_c, j) => {
        html += `<td class="center">
          <input type="number" step="any" data-role="score" data-i="${i}" data-j="${j}" value="${alt.values[j]}">
        </td>`;
      });
      html += "</tr>";
    });
    html += "</tbody>";
    table.innerHTML = html;

    document.getElementById("penilaianStatus").innerHTML =
      `<div class="penilaian-status">
        <span class="material-icons-round" style="font-size:18px;">info</span>
        Silakan isi nilai setiap alternatif. Data akan tersimpan otomatis.
      </div>`;

    table.querySelectorAll('[data-role="score"]').forEach((el) => {
      el.addEventListener("input", (event) => {
        const i = +event.target.dataset.i;
        const j = +event.target.dataset.j;
        state.alternatives[i].values[j] = parseFloat(event.target.value) || 0;
        saveState();
      });
    });
  }

  document.getElementById("btnSavePenilaian").addEventListener("click", () => {
    saveState();
    document.getElementById("penilaianStatus").innerHTML =
      `<div class="penilaian-status saved">
        <span class="material-icons-round" style="font-size:18px;">check_circle</span>
        Data penilaian berhasil disimpan!
      </div>`;
    setTimeout(() => {
      const statusEl = document.querySelector(".penilaian-status");
      if (statusEl) {
        statusEl.classList.remove("saved");
        statusEl.innerHTML = '<span class="material-icons-round" style="font-size:18px;">info</span> Silakan isi nilai setiap alternatif. Data akan tersimpan otomatis.';
      }
    }, 2500);
  });

  // Perhitungan DIA

  function renderPerhitunganPage() {
    const result       = compute();
    const criteria     = state.criteria;
    const alternatives = state.alternatives;
    const alternativeIds = alternatives.map((a) => a.id);
    const container      = document.getElementById("perhitunganContent");

    function matrixHtml(title, matrix, rowLabels, colLabels, decimals) {
      const decimalArray = Array.isArray(decimals)
        ? decimals
        : colLabels.map(() => decimals);
      let html = `<table class="matrix-table"><thead><tr><th class="rowlabel">${title}</th>`;
      colLabels.forEach((label) => (html += `<th>${escapeHtml(label)}</th>`));
      html += "</tr></thead><tbody>";
      matrix.forEach((row, rowIdx) => {
        html += `<tr><td class="rowlabel">${escapeHtml(rowLabels[rowIdx])}</td>`;
        row.forEach((value, colIdx) => {
          const dec = decimalArray[colIdx] !== undefined ? decimalArray[colIdx] : decimalArray[0];
          html += `<td>${fmt(value, dec)}</td>`;
        });
        html += "</tr>";
      });
      html += "</tbody></table>";
      return html;
    }

    const colHeaders = criteria.map((c, j) => `C${j + 1}`);
    const rawMatrix = alternatives.map((a) => a.values.map((v) => v));

    container.innerHTML = `
      <div class="calc-step">
        <div class="calc-step-head">1) Matriks Keputusan (Data Mentah)</div>
        <div class="calc-step-body">
          <p class="caption">Nilai setiap alternatif terhadap setiap kriteria.</p>
          <div class="table-scroll">${matrixHtml("Alternatif", rawMatrix, alternativeIds, colHeaders, 0)}</div>
        </div>
      </div>

      <div class="calc-step">
        <div class="calc-step-head">2) Normalisasi Matriks</div>
        <div class="calc-step-body">
          <p class="caption">R<sub>ij</sub> = X<sub>ij</sub> / √(Σᵢ X<sub>ij</sub>²)</p>
          <div class="table-scroll">${matrixHtml("Alternatif", result.normalizedMatrix, alternativeIds, colHeaders, 6)}</div>
        </div>
      </div>

      <div class="calc-step">
        <div class="calc-step-head">3) Pembobotan Matriks Normalisasi</div>
        <div class="calc-step-body">
          <p class="caption">Y<sub>ij</sub> = R<sub>ij</sub> × W<sub>j</sub></p>
          <div class="table-scroll">${matrixHtml("Alternatif", result.weightedMatrix, alternativeIds, colHeaders, 6)}</div>
        </div>
      </div>

      <div class="calc-step">
        <div class="calc-step-head">4) Solusi Ideal (A⁺ / A⁻)</div>
        <div class="calc-step-body">
          <p class="caption">A⁺ = max kolom Y &nbsp;·&nbsp; A⁻ = min kolom Y (diterapkan seragam untuk semua kriteria).</p>
          <div class="table-scroll">${matrixHtml("Ideal", [result.idealPositive, result.idealNegative], ["A+ (Positif)", "A- (Negatif)"], colHeaders, 6)}</div>
        </div>
      </div>

      <div class="calc-step">
        <div class="calc-step-head">5) Jarak Manhattan (D⁺ / D⁻)</div>
        <div class="calc-step-body">
          <p class="caption">D⁺<sub>i</sub> = Σⱼ |Y<sub>ij</sub> − A⁺<sub>j</sub>| &nbsp;·&nbsp; D⁻<sub>i</sub> = Σⱼ |Y<sub>ij</sub> − A⁻<sub>j</sub>|</p>
          <div class="table-scroll">${matrixHtml("Alternatif",
            alternatives.map((_a, i) => [result.distancePlus[i], result.distanceMinus[i]]),
            alternativeIds, ["D+", "D-"], 5
          )}</div>
        </div>
      </div>

      <div class="calc-step">
        <div class="calc-step-head">6) PIA (Positive Ideal Alternative) & Nilai Ri</div>
        <div class="calc-step-body">
          <p class="caption">PIA = (min D⁺, max D⁻) = (${fmt(result.piaMinDPlus, 6)}, ${fmt(result.piaMaxDMinus, 6)}). 
          <br>R<sub>i</sub> = √((D⁺ᵢ − min D⁺)² + (D⁻ᵢ − max D⁻)²)</p>
          <div class="table-scroll">${matrixHtml("Alternatif",
            alternatives.map((_a, i) => [result.distancePlus[i], result.distanceMinus[i], result.riValues[i], result.ranks[i]]),
            alternativeIds, ["D+", "D-", "Ri", "Rank"], [6, 6, 6, 0]
          )}</div>
        </div>
      </div>
    `;
  }

  const btnHitungDIA = document.getElementById("btnHitungDIA");
  if (btnHitungDIA) {
    btnHitungDIA.addEventListener("click", () => {
      renderPerhitunganPage();
    });
  }

  // Hasil Ranking

  let barChartRankingInstance = null;
  let pieChartRankingInstance = null;

  function renderRankingPage() {
    const result       = compute();
    const alternatives = state.alternatives;
    const criteria     = state.criteria;
    const sortedOrder  = alternatives.map((_a, i) => i).sort((x, y) => result.riValues[x] - result.riValues[y]);
    const winnerIndex  = sortedOrder[0];
    const winnerName   = alternatives[winnerIndex]?.id ?? "—";
    const winnerRi     = fmt(result.riValues[winnerIndex], 6);

    const winnerSection = document.getElementById("winnerSection");
    winnerSection.innerHTML = `
      <div class="winner-section">
        <div class="winner-card">
          <div class="winner-tag"><span class="material-icons-round" style="font-size:14px;">emoji_events</span> Alternatif Terbaik</div>
          <div class="winner-name">${escapeHtml(winnerName)}</div>
          <div class="winner-ri">(Ri: <b>${winnerRi}</b>)</div>
          <div class="winner-detail">Peringkat 1 (Alternatif Terbaik)</div>
        </div>
        <div class="winner-table-wrap">
          ${buildRankTableHtml(result, alternatives, sortedOrder)}
        </div>
      </div>
    `;

    document.getElementById("rankTable").innerHTML = buildFullRankTableHtml(result, alternatives, sortedOrder);
    document.getElementById("rankFooter").innerHTML = `Total alternatif: ${alternatives.length}`;

    renderBarChart("chartBarRanking", result, alternatives, sortedOrder);
    renderPieChart("chartPieRanking", criteria);
    renderConclusion(result, alternatives, criteria, sortedOrder);
  }

  function buildRankTableHtml(result, alternatives, sortedOrder) {
    let html = `<table class="rank-table"><thead><tr>
      <th>Ranking</th><th>Alternatif</th><th>Nilai Ri</th><th>Status</th>
    </tr></thead><tbody>`;
    sortedOrder.forEach((i) => {
      const rank = result.ranks[i];
      const rankClass = rank === 1 ? "r1" : rank === 2 ? "r2" : rank === 3 ? "r3" : "rn";
      html += `<tr class="${rank === 1 ? "rank1" : ""}">
        <td><span class="rank-badge ${rankClass}">#${rank}</span></td>
        <td><div>${escapeHtml(alternatives[i].id)}</div></td>
        <td class="mono">${fmt(result.riValues[i], 6)}</td>
        <td><span class="status-chip ${rank === 1 ? "best" : "normal"}">${rank === 1 ? "Peringkat Terbaik" : "Peringkat " + rank}</span></td>
      </tr>`;
    });
    html += "</tbody></table>";
    return html;
  }

  function buildFullRankTableHtml(result, alternatives, sortedOrder) {
    let html = `<thead><tr>
      <th class="center">Rank</th><th>Alternatif</th>
      <th class="center">D+</th><th class="center">D-</th>
      <th class="center">Ri</th><th class="center">Status</th>
    </tr></thead><tbody>`;
    sortedOrder.forEach((i) => {
      const rank = result.ranks[i];
      const rankClass = rank === 1 ? "r1" : rank === 2 ? "r2" : rank === 3 ? "r3" : "rn";
      html += `<tr class="${rank === 1 ? "rank1" : ""}">
        <td class="center"><span class="rank-badge ${rankClass}">#${rank}</span></td>
        <td>${escapeHtml(alternatives[i].id)}</td>
        <td class="center mono">${fmt(result.distancePlus[i], 6)}</td>
        <td class="center mono">${fmt(result.distanceMinus[i], 6)}</td>
        <td class="center mono">${fmt(result.riValues[i], 6)}</td>
        <td class="center"><span class="status-chip ${rank === 1 ? "best" : "normal"}">${rank === 1 ? "Peringkat Terbaik" : "Peringkat " + rank}</span></td>
      </tr>`;
    });
    html += "</tbody>";
    return html;
  }

  // Kesimpulan

  function renderConclusion(result, alternatives, criteria, sortedOrder) {
    const container = document.getElementById("conclusionBody");
    if (!container) return;

    const numAlternatives = alternatives.length;
    const numCriteria     = criteria.length;
    const winnerIndex     = sortedOrder[0];
    const winnerName      = alternatives[winnerIndex]?.id ?? "—";
    const winnerRi        = fmt(result.riValues[winnerIndex], 6);
    const winnerDPlus     = fmt(result.distancePlus[winnerIndex], 6);
    const winnerDMinus    = fmt(result.distanceMinus[winnerIndex], 6);

    let runnerUpText = "";
    if (sortedOrder.length >= 2) {
      const runnerIndex = sortedOrder[1];
      const runnerName  = alternatives[runnerIndex]?.id ?? "—";
      const runnerRi    = fmt(result.riValues[runnerIndex], 6);
      const gap         = fmt(result.riValues[runnerIndex] - result.riValues[winnerIndex], 6);
      runnerUpText = `Peringkat kedua ditempati oleh <strong>${escapeHtml(runnerName)}</strong> dengan nilai Ri sebesar <span class="highlight-value">${runnerRi}</span>, dengan selisih <span class="highlight-value">${gap}</span> dari peringkat pertama.`;
    }

    const worstIndex = sortedOrder[sortedOrder.length - 1];
    const worstName  = alternatives[worstIndex]?.id ?? "—";
    const worstRi    = fmt(result.riValues[worstIndex], 6);

    const critList = criteria.map((c, j) => `${c.name} (bobot: ${c.weight})`).join(", ");

    container.innerHTML = `
      <p>
        Berdasarkan hasil perhitungan menggunakan metode <strong>DIA (Distance to the Ideal Alternative)</strong>,
        kandidat yang paling direkomendasikan adalah <strong>${escapeHtml(winnerName)}</strong>
        dengan nilai Preferensi (Ri) terendah sebesar <span class="highlight-value">${winnerRi}</span>.
      </p>
      <p>
        Kandidat ini terpilih karena memiliki jarak paling dekat dengan solusi ideal positif 
        (D⁺ = <span class="highlight-value">${winnerDPlus}</span>) dan paling jauh dari solusi ideal negatif 
        (D⁻ = <span class="highlight-value">${winnerDMinus}</span>) dibandingkan 
        <strong>${numAlternatives - 1}</strong> alternatif lainnya.
      </p>
      <span class="conclusion-separator"></span>
      <p>${runnerUpText}</p>
      <p>
        Alternatif dengan performa terendah adalah <strong>${escapeHtml(worstName)}</strong>
        dengan nilai Ri sebesar <span class="highlight-value">${worstRi}</span>.
      </p>
      <p class="conclusion-detail">
        <strong>Detail Analisis:</strong> Perhitungan dilakukan terhadap <strong>${numAlternatives}</strong> alternatif 
        menggunakan <strong>${numCriteria}</strong> kriteria: ${critList}.
        Metode DIA menghitung jarak Manhattan dari setiap alternatif ke solusi ideal positif (A⁺) dan negatif (A⁻), 
        kemudian menentukan titik referensi PIA (Positive Ideal Alternative) sebagai (min D⁺, max D⁻). 
        Nilai Ri dihitung sebagai jarak Euclidean dari setiap alternatif ke PIA, dimana 
        <strong>nilai Ri terkecil menunjukkan alternatif terbaik</strong>.
      </p>
    `;
  }

  // Header Actions

  document.getElementById("btnPrint").addEventListener("click", () => {
    window.print();
  });

  document.getElementById("btnExcel").addEventListener("click", () => {
    const result       = compute();
    const alternatives = state.alternatives;
    const criteria     = state.criteria;
    const sortedOrder  = alternatives.map((_a, i) => i).sort((x, y) => result.riValues[x] - result.riValues[y]);

    let csv = "Rank,Alternatif,";
    criteria.forEach((c, j) => { csv += `C${j + 1} (${c.name}),`; });
    csv += "D+,D-,Ri\n";

    sortedOrder.forEach((i) => {
      csv += `${result.ranks[i]},${alternatives[i].id},`;
      alternatives[i].values.forEach((v) => { csv += `${v},`; });
      csv += `${fmt(result.distancePlus[i], 6)},${fmt(result.distanceMinus[i], 6)},${fmt(result.riValues[i], 6)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "SPK_DIA_Ranking.csv";
    link.click();
  });

  document.getElementById("btnReset").addEventListener("click", () => {
    if (confirm("Apakah Anda yakin ingin mereset semua data ke contoh awal?")) {
      state = createExampleData();
      localStorage.removeItem("spk_dia_state");
      renderPage(currentPage);
    }
  });

  // Weight Badge

  function renderWeightBadge() {
    const weightSum    = state.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    const badgeElement = document.getElementById("weightBadge");
    if (!badgeElement) return;
    const isValid = Math.abs(weightSum - 1) < 0.005;

    badgeElement.innerHTML = `<div class="weight-badge ${isValid ? "ok" : "warn"}">
      Total bobot: ${weightSum.toFixed(3)} ${isValid ? "✓" : "— harus sama dengan 1.000"}
      ${isValid ? "" : '<button class="btn-tiny" id="btnNormalize" style="margin-left:8px;">Normalize</button>'}
    </div>`;

    if (!isValid) {
      document.getElementById("btnNormalize").addEventListener("click", () => {
        const currentSum = state.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);
        if (currentSum <= 0) {
          state.criteria.forEach((c) => (c.weight = +(1 / state.criteria.length).toFixed(4)));
        } else {
          state.criteria.forEach((c) => (c.weight = +(c.weight / currentSum).toFixed(4)));
        }
        saveState();
        renderKriteriaPage();
      });
    }
  }

  // Orchestration

  function renderPage(page) {
    switch (page) {
      case "dashboard":    renderDashboard(); break;
      case "kriteria":     renderKriteriaPage(); break;
      case "alternatif":   renderAlternatifPage(); break;
      case "penilaian":    renderPenilaianPage(); break;
      case "perhitungan":  renderPerhitunganPage(); break;
      case "ranking":      renderRankingPage(); break;
    }
  }

  // Init
  loadState();
  navigateTo("dashboard");
})();
