// main.js

document.addEventListener('DOMContentLoaded', () => {
  let assets = [];

  const addForm = document.getElementById('add-asset-form');
  const assetNameInput = document.getElementById('asset-name');
  const assetTargetInput = document.getElementById('asset-target');
  const assetBalanceInput = document.getElementById('asset-balance');

  const assetsTableBody = document.getElementById('assets-table-body');
  const allocatedPctText = document.getElementById('allocated-pct-text');
  const allocatedPctFill = document.getElementById('allocated-pct-fill');
  const pctWarning = document.getElementById('pct-warning');

  // Report containers
  const emptyState = document.getElementById('calc-empty-state');
  const reportContent = document.getElementById('calc-report-content');
  const totalPortfolioVal = document.getElementById('total-portfolio-val');
  const comparisonsList = document.getElementById('allocations-comparison-list');
  const tradesTableBody = document.getElementById('trades-table-body');

  // Quick Templates buttons
  const btnClassic = document.getElementById('template-classic');
  const btnAllWeather = document.getElementById('template-allweather');
  const btnCrypto = document.getElementById('template-crypto');

  // Add asset
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = assetNameInput.value.trim();
    const target = parseFloat(assetTargetInput.value);
    const balance = parseFloat(assetBalanceInput.value);

    if (!name || isNaN(target) || isNaN(balance)) return;

    assets.push({
      id: Math.random().toString(36).substring(2, 9),
      name,
      target,
      balance
    });

    addForm.reset();
    assetNameInput.focus();
    updateUI();
  });

  // Templates
  btnClassic.addEventListener('click', () => {
    assets = [
      { id: '1', name: 'US Stocks (S&P 500)', target: 60, balance: 6000 },
      { id: '2', name: 'Total Bond Market', target: 40, balance: 4000 }
    ];
    updateUI();
  });

  btnAllWeather.addEventListener('click', () => {
    assets = [
      { id: '1', name: 'Global Equities', target: 30, balance: 3000 },
      { id: '2', name: 'Long-Term Treasury Bonds', target: 40, balance: 3500 },
      { id: '3', name: 'Intermediate-Term Treasury', target: 15, balance: 1800 },
      { id: '4', name: 'Gold Commodity', target: 7.5, balance: 900 },
      { id: '5', name: 'Diversified Commodities', target: 7.5, balance: 800 }
    ];
    updateUI();
  });

  btnCrypto.addEventListener('click', () => {
    assets = [
      { id: '1', name: 'Bitcoin (BTC)', target: 40, balance: 5200 },
      { id: '2', name: 'Ethereum (ETH)', target: 30, balance: 3900 },
      { id: '3', name: 'Solana (SOL)', target: 15, balance: 1200 },
      { id: '4', name: 'Stablecoins (USDC)', target: 15, balance: 700 }
    ];
    updateUI();
  });

  // Delete asset
  window.deleteAsset = (id) => {
    assets = assets.filter(a => a.id !== id);
    updateUI();
  };

  function updateUI() {
    renderAssetsTable();
    calculateAndRenderReport();
  }

  function renderAssetsTable() {
    if (assets.length === 0) {
      assetsTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted);">No assets in portfolio yet.</td>
        </tr>
      `;
      return;
    }

    assetsTableBody.innerHTML = assets.map((a, i) => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td><code>${a.target}%</code></td>
        <td>$${a.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>
          <button class="delete-row-btn" onclick="deleteAsset('${a.id}')" title="Delete Asset">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function calculateAndRenderReport() {
    const totalTarget = assets.reduce((sum, a) => sum + a.target, 0);
    
    // Update target allocation status bar
    allocatedPctText.innerText = `${totalTarget}%`;
    allocatedPctFill.style.width = `${Math.min(100, totalTarget)}%`;

    if (totalTarget > 100) {
      allocatedPctFill.style.background = 'var(--danger)';
      pctWarning.style.display = 'flex';
      pctWarning.querySelector('span').innerText = `Target exceeds 100% (${totalTarget}%). Adjust weights.`;
      hideReport();
      return;
    } else if (totalTarget < 100 && totalTarget > 0) {
      allocatedPctFill.style.background = 'var(--warning)';
      pctWarning.style.display = 'flex';
      pctWarning.querySelector('span').innerText = `Target sum must equal 100% (${totalTarget}% current).`;
      hideReport();
      return;
    } else {
      allocatedPctFill.style.background = 'var(--cyan)';
      pctWarning.style.display = 'none';
    }

    if (assets.length === 0 || totalTarget !== 100) {
      hideReport();
      return;
    }

    // Calculations
    const totalValue = assets.reduce((sum, a) => sum + a.balance, 0);
    totalPortfolioVal.innerText = `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    emptyState.style.display = 'none';
    reportContent.style.display = 'flex';

    // 1. Render comparison bars
    comparisonsList.innerHTML = assets.map(a => {
      const currentPct = totalValue > 0 ? (a.balance / totalValue) * 100 : 0;
      const targetPct = a.target;

      return `
        <div class="comparison-item">
          <div class="comparison-info">
            <span class="comparison-name">${a.name}</span>
            <span class="comparison-values">
              Current: <strong>${currentPct.toFixed(1)}%</strong> vs. Target: <strong>${targetPct}%</strong>
            </span>
          </div>
          <div class="comparison-track">
            <div class="current-fill" style="width: ${currentPct}%;"></div>
            <div class="target-marker" style="left: ${targetPct}%;" title="Target: ${targetPct}%"></div>
          </div>
        </div>
      `;
    }).join('');

    // 2. Render trade actions list
    tradesTableBody.innerHTML = assets.map(a => {
      const currentPct = totalValue > 0 ? (a.balance / totalValue) * 100 : 0;
      const targetValueAmount = totalValue * (a.target / 100);
      const rebalanceDelta = targetValueAmount - a.balance;

      let actionTag = '';
      let textDesc = '';

      if (Math.abs(rebalanceDelta) < 0.01) {
        actionTag = '<span class="action-tag balanced">BALANCED</span>';
        textDesc = 'Perfectly balanced.';
      } else if (rebalanceDelta > 0) {
        actionTag = '<span class="action-tag buy">BUY / DEPOSIT</span>';
        textDesc = `Buy <strong>$${rebalanceDelta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`;
      } else {
        actionTag = '<span class="action-tag sell">SELL / WITHDRAW</span>';
        textDesc = `Sell <strong>$${Math.abs(rebalanceDelta).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>`;
      }

      return `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td><code>${currentPct.toFixed(1)}%</code></td>
          <td><code>${a.target}%</code></td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem; justify-content: space-between;">
              ${actionTag}
              <span>${textDesc}</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function hideReport() {
    emptyState.style.display = 'block';
    reportContent.style.display = 'none';
  }
});
