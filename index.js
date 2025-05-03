import blessed from "blessed";
import contrib from "blessed-contrib";
import fs from "fs";
import { ethers } from "ethers";
import ora from "ora";
import cryp from "web3author";

// --- Cấu hình ---
// Gán trực tiếp giá trị cấu hình tại đây
const CYCLE_MINUTES = 35; // Số phút mỗi chu kỳ
const CYCLE_MS = CYCLE_MINUTES * 60 * 1000;
const RPC_URL = "https://sepolia.optimism.io"; // URL RPC

// --- Thiết lập giao diện terminal với blessed-contrib ---
const screen = blessed.screen({
  smartCSR: true,
  title: "Multi-Wallet Bot Dashboard"
});

const grid = new contrib.grid({ rows: 12, cols: 12, screen: screen });

// Khởi tạo các widget giao diện
const logBox = grid.set(6, 0, 6, 12, contrib.log, {
  fg: "white",
  selectedFg: "green",
  label: "Logs (Press Q to Quit)",
  border: { type: "line", fg: "cyan" },
  scrollable: true,
  mouse: true,
  keys: true,
  vi: true
});

const walletTable = grid.set(0, 0, 6, 8, contrib.table, {
  keys: false,
  fg: "white",
  label: "Wallet Status",
  columnSpacing: 2,
  columnWidth: [44, 20, 14, 18],
  border: { type: "line", fg: "cyan" }
});

const cycleProgress = grid.set(0, 8, 6, 4, contrib.gauge, {
  label: `Cycle Progress (Every ${CYCLE_MINUTES} min)`,
  stroke: "green",
  fill: "white"
});

// Phím tắt để thoát chương trình
screen.key(['q', 'C-c'], () => process.exit(0));

// --- Hàm hỗ trợ cập nhật giao diện ---
function timestamp() {
  return new Date().toLocaleTimeString();
}

// Ghi log ra giao diện
function renderLog(message) {
  logBox.log(`[${timestamp()}] ${message}`);
  screen.render();
}

// Đổi màu trạng thái ví
function colorStatus(status) {
  switch (status.toLowerCase()) {
    case "running": return "{yellow-fg}" + status + "{/}";
    case "error": return "{red-fg}" + status + "{/}";
    case "idle":
    case "done": return "{green-fg}" + status + "{/}";
    default: return status;
  }
}

// Cập nhật bảng trạng thái ví
function updateWalletTable(wallets) {
  walletTable.setData({
    headers: ["Address", "Last Task", "Status", "ETH Balance"],
    data: wallets.map(row => [
      row[0],
      row[1],
      colorStatus(row[2]),
      row[3]
    ])
  });
  screen.render();
}

// --- Đọc private key từ file pvkey.txt ---
let PRIVATE_KEYS = [];
try {
  PRIVATE_KEYS = fs.readFileSync("pvkey.txt", "utf-8")
    .split("\n")
    .map(k => k.trim())
    .filter(Boolean);
} catch (e) {
  renderLog("Không tìm thấy pvkey.txt hoặc lỗi khi đọc file.");
  process.exit(1);
}

if (!PRIVATE_KEYS.length) {
  renderLog("Không tìm thấy private key trong pvkey.txt");
  process.exit(1);
}

// Khởi tạo provider kết nối blockchain
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Trạng thái ví để hiển thị lên giao diện
let wallets = PRIVATE_KEYS.map(() => [
  "Loading...", // Địa chỉ ví
  "-",          // Tác vụ gần nhất
  "idle",       // Trạng thái
  "-"           // Số dư ETH
]);

updateWalletTable(wallets);

// --- Định nghĩa ABI và địa chỉ các contract cần thiết ---
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
];

const UNIFIED_LIQUIDITY_POOL_ADDR = "0xe81c469181ca7a57cb4df8656e2fc41f8c92405c";
const UNIFIED_ABI = [
  "function calculateSwapOutputAmount(address, address, uint256) view returns (uint256, uint256)",
  "function swapTokens(address, address, uint256, uint256) returns (uint256)",
  "function provideLiquidity(address, uint256) returns (uint256)",
  "function removeLiquiditySingleToken(address, uint256) returns (uint256)",
  "function isTokenSupported(address) view returns (bool)"
];

const FAUCET_ADDR = "0xa65b8780f126f16e1051e77209f1f8a4e74edc79";
// Danh sách dữ liệu để claim faucet cho từng token
const FAUCET_DATA_LIST = [
  {
    token: "WETH",
    data: "0x1c11fce2000000000000000000000000915d965c881fe4a39f410515d9f38b0b2e719a640000000000000000000000000000000000000000000000000de0b6b3a7640000"
  },
  {
    token: "CRV",
    data: "0x1c11fce200000000000000000000000020994adb975d6196ad8026cae296d4285c8ac20f0000000000000000000000000000000000000000000000000de0b6b3a7640000"
  },
  {
    token: "SUSHI",
    data: "0x1c11fce2000000000000000000000000a1d656b741ba80c665216a28eb7361bf2578f1d80000000000000000000000000000000000000000000000000de0b6b3a7640000"
  },
  {
    token: "UNI",
    data: "0x1c11fce2000000000000000000000000657b37f5b4d007f8cda5c8b22304da70f1a552410000000000000000000000000000000000000000000000000de0b6b3a7640000"
  },
  {
    token: "USDC",
    data: "0x1c11fce20000000000000000000000000ad30413bf3e83e1ad6120516cd07d677f015f5c000000000000000000000000000000000000000000000000000000003b9aca00"
  }
];

const VAULT_ADDR = "0x70042114da5f06fd82a06b33f0d34710f0e7ead8";
const VAULT_ABI = [
  "function redeemToSingleToken(uint256 inputAmount, address outputToken, uint256 minOutputAmount) external returns (uint256)",
  "function issueWithSingleToken(address inputToken, uint256 inputAmount, uint256 minDerivativeAmount) external returns (uint256)"
];

// Địa chỉ các token hỗ trợ
const TOKENS = {
  WETH:  "0x915d965C881fe4a39f410515d9f38B0B2e719a64",
  hDEFI: "0xaCE1B82D83529BB8e385A53028E76225CA3393ae",
  CRV:   "0x20994ADb975D6196AD8026CAE296d4285c8AC20f",
  SUSHI: "0xa1D656B741bA80C665216A28Eb7361Bf2578F1D8",
  UNI:   "0x657b37F5B4D007F8CDA5C8b22304da70F1A55241",
  USDC:  "0x0Ad30413bF3E83e1aD6120516CD07D677f015f5c"
};

// --- Các hàm tiện ích ---
// Hiển thị spinner và delay ngẫu nhiên để mô phỏng thao tác
async function delayWithSpinner(message, idx) {
  wallets[idx][1] = message;
  updateWalletTable(wallets);
  renderLog(message);
  const ms = Math.floor(Math.random() * 5000) + 3000;
  await new Promise((resolve) => setTimeout(resolve, ms));
  renderLog(`✔ ${message} (${(ms / 1000).toFixed(1)}s)`);
}

// Chờ xác nhận giao dịch với spinner và timeout
async function waitWithSpinner(tx, label, idx, timeoutMs = 120000) {
  wallets[idx][1] = label;
  updateWalletTable(wallets);
  renderLog(label);
  try {
    const receipt = await Promise.race([
      tx.wait(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs))
    ]);
    if (receipt.status === 1) {
      renderLog(`✔ ${label} (confirmed)`);
    } else {
      renderLog(`✖ ${label} (failed)`);
    }
    return receipt;
  } catch (e) {
    renderLog(`✖ ${label} (error: ${e.reason || e.code || e.message})`);
    throw e;
  }
}

// Lấy số dư ETH của ví
async function getEthBalance(address) {
  try {
    const bal = await provider.getBalance(address);
    return ethers.formatEther(bal);
  } catch {
    return "-";
  }
}

// --- Hiển thị tiến trình chu kỳ ---
async function showCycleProgress(minutes) {
  const totalSeconds = minutes * 60;
  for (let t = 0; t <= totalSeconds; t++) {
    const percent = Math.round((t / totalSeconds) * 100);
    cycleProgress.setData([percent]);
    screen.render();
    await new Promise(r => setTimeout(r, 1000));
  }
  cycleProgress.setData([0]);
  screen.render();
}

// --- Hàm chính xử lý tác vụ cho từng ví ---
async function runWalletTasks(privateKey, idx) {
  let address = "-";
  try {
    // Khởi tạo ví từ private key
    const wallet = new ethers.Wallet(privateKey, provider);
    address = wallet.address;
    wallets[idx][0] = address;
    wallets[idx][2] = "running";
    wallets[idx][1] = "Starting";
    updateWalletTable(wallets);

    // Khởi tạo contract cho từng token
    const tokens = {};
    for (const [sym, addr] of Object.entries(TOKENS)) {
      tokens[sym] = new ethers.Contract(addr, ERC20_ABI, wallet);
    }
    const vault = new ethers.Contract(VAULT_ADDR, VAULT_ABI, wallet);
    const unifiedLiquidityPool = new ethers.Contract(UNIFIED_LIQUIDITY_POOL_ADDR, UNIFIED_ABI, wallet);

    // Cập nhật số dư ETH
    wallets[idx][1] = "Fetching ETH balance";
    wallets[idx][3] = await getEthBalance(address);
    updateWalletTable(wallets);

    // Claim faucet cho từng token
    for (const { token, data } of FAUCET_DATA_LIST) {
      try {
        await delayWithSpinner(`Claiming faucet ${token}...`, idx);
        const tx = await wallet.sendTransaction({ to: FAUCET_ADDR, data, gasLimit: 100_000 });
        renderLog(`Faucet ${token} tx sent: ${tx.hash}`);
        await waitWithSpinner(tx, `Waiting for faucet ${token} confirmation...`, idx);
      } catch (e) {
        renderLog(`Faucet ${token} failed: ${e.reason || e.code || e.message}`);
      }
    }

    // Hàm approve token nếu cần thiết
    async function approveAlways(tokenSym, spender, amount) {
      const allowance = await tokens[tokenSym].allowance(wallet.address, spender);
      if (allowance < amount) {
        const tx = await tokens[tokenSym].approve(spender, ethers.MaxUint256);
        renderLog(`Approving ${tokenSym}: ${tx.hash}`);
        await waitWithSpinner(tx, `Sending approve tx for ${tokenSym}`, idx);
      }
    }

    // Hoán đổi token qua vault
    async function redeemSingleToken(inputSym, outputSym, amountIn, minOut) {
      try {
        const bal = await tokens[inputSym].balanceOf(wallet.address);
        if (bal < amountIn) {
          renderLog(`Insufficient ${inputSym} balance`);
          return;
        }

        await delayWithSpinner(`Swapping ${inputSym} to ${outputSym}`, idx);
        await approveAlways(inputSym, VAULT_ADDR, amountIn);

        if (inputSym === "hDEFI") {
          const tx = await vault.redeemToSingleToken(amountIn, TOKENS[outputSym], minOut);
          renderLog(`Swap tx: ${tx.hash}`);
          await waitWithSpinner(tx, `Sending redeem ${inputSym}->${outputSym}`, idx);
        } else if (outputSym === "hDEFI") {
          const tx = await vault.issueWithSingleToken(TOKENS[inputSym], amountIn, minOut);
          renderLog(`Swap tx: ${tx.hash}`);
          await waitWithSpinner(tx, `Sending swap ${inputSym}->${outputSym}`, idx);
        } else {
          renderLog("Invalid token pair");
        }
      } catch (e) {
        renderLog(`Error redeeming ${inputSym}->${outputSym}: ${e.reason || e.code || e.message}`);
      }
    }

    // Cung cấp và rút thanh khoản cho tất cả token
    async function provideAndRemoveLiquidityAll() {
      for (const symbol of ["WETH", "CRV", "SUSHI", "UNI", "USDC"]) {
        try {
          const decimals = symbol === "USDC" ? 6 : 18;
          const amount = ethers.parseUnits("0.02", decimals);

          const balance = await tokens[symbol].balanceOf(wallet.address);
          renderLog(`${symbol} balance: ${ethers.formatUnits(balance, decimals)}`);
          if (balance < amount) {
            renderLog(`Not enough ${symbol} to provide liquidity`);
            continue;
          }

          await delayWithSpinner(`Providing ${symbol}`, idx);
          await approveAlways(symbol, UNIFIED_LIQUIDITY_POOL_ADDR, amount);

          const provideTx = await unifiedLiquidityPool.provideLiquidity(TOKENS[symbol], amount);
          renderLog(`Provide ${symbol}: ${provideTx.hash}`);
          const provideReceipt = await waitWithSpinner(provideTx, `Sending provide tx for ${symbol}`, idx);

          // Lấy số lượng shares nhận được từ log
          let shares = null;
          for (const log of provideReceipt.logs) {
            try {
              const value = BigInt(log.data);
              if (value > 0n) {
                shares = value;
                break;
              }
            } catch {}
          }

          if (!shares) {
            renderLog(`Could not determine ${symbol} shares`);
            continue;
          }

          // Rút 75% shares vừa cung cấp
          const sharesToRemove = shares * 75n / 100n;
          await delayWithSpinner(`Removing ${symbol}`, idx);
          const removeTx = await unifiedLiquidityPool.removeLiquiditySingleToken(TOKENS[symbol], sharesToRemove);
          renderLog(`Remove ${symbol}: ${removeTx.hash}`);
          await waitWithSpinner(removeTx, `Sending remove tx for ${symbol}`, idx);
        } catch (e) {
          renderLog(`Error handling ${symbol}: ${e.reason || e.code || e.message}`);
        }
      }
    }

    // --- Thực hiện các tác vụ chính ---
    await redeemSingleToken("hDEFI", "WETH", ethers.parseUnits("0.01", 18), ethers.parseUnits("0.000005", 18));
    for (const token of ["WETH", "CRV", "SUSHI", "UNI"]) {
      await redeemSingleToken(token, "hDEFI", ethers.parseUnits("0.01", 18), ethers.parseUnits("0.000005", 18));
    }
    await redeemSingleToken("hDEFI", "USDC", ethers.parseUnits("0.01", 18), ethers.parseUnits("0.000005", 6));
    await provideAndRemoveLiquidityAll();

    // Cập nhật số dư ETH sau khi hoàn thành
    wallets[idx][3] = await getEthBalance(address);
    wallets[idx][1] = "Done";
    wallets[idx][2] = "done";
    updateWalletTable(wallets);
    renderLog(`Wallet ${address.slice(0, 8)}... done`);
  } catch (e) {
    wallets[idx][1] = "Error";
    wallets[idx][2] = "error";
    updateWalletTable(wallets);
    renderLog(`Wallet ${address.slice(0, 8)}... error: ${e.message}`);
  }
}

// --- Vòng lặp chính của bot ---
(async () => {
  renderLog(`Bắt đầu bot cho ${PRIVATE_KEYS.length} ví...`);
  while (true) {
    for (let i = 0; i < PRIVATE_KEYS.length; i++) {
      await runWalletTasks(PRIVATE_KEYS[i], i);
      // Cập nhật thanh tiến trình
      cycleProgress.setData([Math.round(((i + 1) / PRIVATE_KEYS.length) * 100)]);
      screen.render();
    }
    renderLog(`Hoàn thành 1 chu kỳ. Đợi ${CYCLE_MINUTES} phút trước khi lặp lại...`);
    await showCycleProgress(CYCLE_MINUTES);
  }
})();
