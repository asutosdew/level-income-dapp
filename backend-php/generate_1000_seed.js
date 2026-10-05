const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const TOTAL_USERS = 1000;
const OUTPUT_FILE = path.join(__dirname, 'seed_1000_users.sql');

console.log(`Starting generation of ${TOTAL_USERS} users dataset...`);

// Seed pseudo-random generator for reproducible deterministic output
let seed = 42;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function randInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// Generate valid-looking EVM private key (64 hex characters) and address (40 hex characters)
function generateWallet(index) {
  const hash = crypto.createHash('sha256').update(`morgan_user_${index}_key_seed_2026`).digest('hex');
  const privateKey = '0x' + hash;
  const addrHash = crypto.createHash('sha256').update(hash).digest('hex').substring(24);
  const address = '0x' + addrHash.toLowerCase();
  return { privateKey, address };
}

const firstNames = [
  'Alexander', 'Sophia', 'Vikram', 'Elena', 'Marcus', 'Tariq', 'Lucas', 'David', 'Grace', 'Aarav',
  'Priya', 'Liam', 'Emma', 'Noah', 'Olivia', 'Ethan', 'Ava', 'Mateo', 'Isabella', 'Muhammad',
  'Fatima', 'Dmitry', 'Anastasia', 'Chen', 'Mei', 'Kenji', 'Yuki', 'Carlos', 'Camila', 'Rohan',
  'Ananya', 'Gabriel', 'Chloe', 'Arthur', 'Alice', 'Siddharth', 'Neha', 'Oliver', 'Mia', 'Lucas',
  'Zayn', 'Yasmin', 'Ivan', 'Natalia', 'Wei', 'Lin', 'Hiroshi', 'Sakura', 'Diego', 'Valentina'
];

const lastNames = [
  'Wright', 'Chen', 'Malhotra', 'Rostova', 'Sterling', 'Al-Mansoor', 'Silva', 'Kim', 'O’Connor', 'Sharma',
  'Patel', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez',
  'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis',
  'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill'
];

const packages = [
  { id: 'starter_50', name: 'Morgan Starter', price: 50 },
  { id: 'bronze_100', name: 'Morgan Bronze', price: 100 },
  { id: 'silver_250', name: 'Morgan Silver', price: 250 },
  { id: 'gold_500', name: 'Morgan Gold', price: 500 },
  { id: 'platinum_1000', name: 'Morgan Platinum', price: 1000 },
  { id: 'treasure_5000', name: 'Imperial Treasure', price: 5000 }
];

const packageWeights = [15, 25, 25, 20, 10, 5]; // Percentages

function choosePackage() {
  const r = randInt(1, 100);
  let acc = 0;
  for (let i = 0; i < packageWeights.length; i++) {
    acc += packageWeights[i];
    if (r <= acc) return packages[i];
  }
  return packages[1];
}

// 1. Initialize Root User & Demo User
const users = [];
const wallets = [];

// User 1: Root Genesis Founder
users.push({
  id: 1,
  userId: 'MT-10024',
  wallet: '0x9b32fa99834190cbbde029104fa2841b994801ac',
  sponsorId: 'MT-ROOT',
  sponsorAddress: null,
  sponsorIndex: null,
  nickname: 'Genesis Vault Leader',
  pkg: packages[5], // $5,000
  staked: 5000,
  levelInTree: 0,
  createdAt: '2026-06-01 00:00:00'
});

wallets.push({
  userId: 'MT-10024',
  wallet: '0x9b32fa99834190cbbde029104fa2841b994801ac',
  privateKey: '0x8f3c71a92038475610293847561029384756102938475610293847561029384a'
});

// User 2: Demo Primary User (Child of User 1)
users.push({
  id: 2,
  userId: 'MT-77291',
  wallet: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  sponsorId: 'MT-10024',
  sponsorAddress: '0x9b32fa99834190cbbde029104fa2841b994801ac',
  sponsorIndex: 0,
  nickname: 'Gold Leader',
  pkg: packages[3], // $500
  staked: 5000, // will adjust
  levelInTree: 1,
  createdAt: '2026-07-15 10:30:00'
});

wallets.push({
  userId: 'MT-77291',
  wallet: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  privateKey: '0x4f35544b82772a0f8b1e42a981295e2634e91823a2618293746192837461928b'
});

// 2. Generate 998 additional users across tree
// We ensure MT-77291 has at least 9 direct referrals, and tree spans 15 generations!
const directReferralsForDemo = [
  { name: 'Alexander Wright', pkg: packages[4] },
  { name: 'Sophia Chen', pkg: packages[3] },
  { name: 'Vikram Malhotra', pkg: packages[3] },
  { name: 'Elena Rostova', pkg: packages[2] },
  { name: 'Marcus Sterling', pkg: packages[1] },
  { name: 'Tariq Al-Mansoor', pkg: packages[1] },
  { name: 'Lucas Silva', pkg: packages[0] },
  { name: 'David Kim', pkg: null },
  { name: 'Grace O’Connor', pkg: null }
];

for (let i = 0; i < directReferralsForDemo.length; i++) {
  const w = generateWallet(i + 3);
  const def = directReferralsForDemo[i];
  const uIndex = users.length;
  users.push({
    id: uIndex + 1,
    userId: `MT-${55011 + i}`,
    wallet: w.address,
    sponsorId: 'MT-77291',
    sponsorAddress: users[1].wallet,
    sponsorIndex: 1,
    nickname: def.name,
    pkg: def.pkg,
    staked: def.pkg ? def.pkg.price : 0,
    levelInTree: 2,
    createdAt: `2026-08-${14 + i * 2} 12:00:00`
  });
  wallets.push({
    userId: `MT-${55011 + i}`,
    wallet: w.address,
    privateKey: w.privateKey
  });
}

// Generate remaining users (up to TOTAL_USERS)
// Distribute them in generations so that tree depth reaches 15 levels!
while (users.length < TOTAL_USERS) {
  const uIndex = users.length;
  const w = generateWallet(uIndex + 1);
  const name = `${randChoice(firstNames)} ${randChoice(lastNames)}`;
  const pkg = (randInt(1, 100) <= 90) ? choosePackage() : null; // 90% active stakers
  const staked = pkg ? pkg.price : 0;

  // Pick a sponsor from eligible existing users
  // To reach 15 levels, bias sponsor selection towards deeper nodes
  let sponsorIndex;
  const randVal = random();
  if (randVal < 0.25 && users.length > 50) {
    // Pick from nodes between level 3 and 14
    const deepCandidates = [];
    for (let j = 2; j < users.length; j++) {
      if (users[j].levelInTree >= 2 && users[j].levelInTree < 14) {
        deepCandidates.push(j);
      }
    }
    sponsorIndex = deepCandidates.length > 0 ? randChoice(deepCandidates) : randInt(1, users.length - 1);
  } else if (randVal < 0.6) {
    // Pick from demo downline tree (descendants of User 2)
    const demoDescendants = [];
    for (let j = 1; j < users.length; j++) {
      if (users[j].sponsorIndex === 1 || users[j].levelInTree >= 2) {
        demoDescendants.push(j);
      }
    }
    sponsorIndex = demoDescendants.length > 0 ? randChoice(demoDescendants) : randInt(0, users.length - 1);
  } else {
    // Random eligible sponsor
    sponsorIndex = randInt(0, users.length - 1);
  }

  const sponsor = users[sponsorIndex];
  const levelInTree = sponsor.levelInTree + 1;

  users.push({
    id: uIndex + 1,
    userId: `MT-${10025 + uIndex}`,
    wallet: w.address,
    sponsorId: sponsor.userId,
    sponsorAddress: sponsor.wallet,
    sponsorIndex: sponsorIndex,
    nickname: name,
    pkg: pkg,
    staked: staked,
    levelInTree: levelInTree,
    createdAt: `2026-08-${String(randInt(1, 30)).padStart(2, '0')} ${String(randInt(0, 23)).padStart(2, '0')}:${String(randInt(0, 59)).padStart(2, '0')}:00`
  });

  wallets.push({
    userId: `MT-${10025 + uIndex}`,
    wallet: w.address,
    privateKey: w.privateKey
  });
}

console.log(`Generated ${users.length} users and ${wallets.length} wallet keypairs.`);

// 3. Compute Financial Calculations (MLM Commission, Team Turnover, ROI, Withdrawals)
// Initialize user accumulators
users.forEach(u => {
  u.totalStaked = u.staked;
  u.maxCap = u.totalStaked * 3.0; // 300% capping
  u.availableBalance = 0.0;
  u.totalWithdrawn = 0.0;
  u.totalLevelIncome = 0.0;
  u.totalDirectIncome = 0.0;
  u.totalRoiIncome = 0.0;
  u.totalRoyaltyIncome = 0.0;
  u.totalEarnedTowardsCap = 0.0;
  u.directsCount = 0;
  u.activeDirectsCount = 0;
  u.totalTeamCount = 0;
  u.totalTeamTurnover = 0.0;
  u.directLegVolumes = {}; // childIndex -> turnover
});

// Update directs counts
for (let i = 1; i < users.length; i++) {
  const u = users[i];
  if (u.sponsorIndex !== null && u.sponsorIndex >= 0) {
    const sp = users[u.sponsorIndex];
    sp.directsCount++;
    if (u.totalStaked > 0) {
      sp.activeDirectsCount++;
    }
  }
}

const levelRates = {
  1: 10.0, 2: 5.0, 3: 3.0, 4: 2.0, 5: 1.0,
  6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5,
  11: 0.25, 12: 0.25, 13: 0.25, 14: 0.25, 15: 0.25
};

const levelReqs = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5,
  6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
  11: 11, 12: 12, 13: 13, 14: 14, 15: 15
};

const deposits = [];
const levelIncomes = [];
const transactions = [];

// For each staker, create deposit and distribute 15-tier commission
users.forEach((u, uIdx) => {
  if (u.totalStaked <= 0) return;

  const txHash = '0x' + crypto.createHash('sha256').update(`dep_${u.userId}_${u.totalStaked}`).digest('hex');
  deposits.push({
    wallet: u.wallet,
    userId: u.userId,
    pkgId: u.pkg ? u.pkg.id : 'custom',
    pkgName: u.pkg ? u.pkg.name : `Stake $${u.totalStaked}`,
    amount: u.totalStaked,
    dailyRoi: 0.84,
    txHash: txHash,
    status: 'confirmed',
    createdAt: u.createdAt
  });

  // Log in transactions table
  transactions.push({
    txId: `tx_dep_${u.userId}`,
    wallet: u.wallet,
    userId: u.userId,
    type: 'deposit',
    title: `Staked in Morgan Treasure (${u.pkg ? u.pkg.name : 'Stake'})`,
    amount: u.totalStaked,
    fee: 0.0,
    net: u.totalStaked,
    status: 'completed',
    txHash: txHash,
    createdAt: u.createdAt
  });

  // Distribute across 15 upline tiers
  let currIndex = u.sponsorIndex;
  let childIndex = uIdx;

  for (let lvl = 1; lvl <= 15; lvl++) {
    if (currIndex === null || currIndex < 0) break;

    const sponsor = users[currIndex];
    sponsor.totalTeamCount++;
    sponsor.totalTeamTurnover += u.totalStaked;

    // Track leg volume
    if (!sponsor.directLegVolumes[childIndex]) {
      sponsor.directLegVolumes[childIndex] = 0;
    }
    sponsor.directLegVolumes[childIndex] += u.totalStaked;

    const percent = levelRates[lvl] || 0.0;
    const req = levelReqs[lvl] || lvl;

    if (sponsor.totalStaked > 0 && sponsor.directsCount >= req) {
      const potComm = (u.totalStaked * percent) / 100.0;
      const remCap = Math.max(0, sponsor.maxCap - sponsor.totalEarnedTowardsCap);
      const actComm = Math.min(potComm, remCap);

      if (actComm > 0) {
        sponsor.totalLevelIncome += actComm;
        sponsor.totalEarnedTowardsCap += actComm;
        sponsor.availableBalance += actComm;

        if (lvl === 1) {
          sponsor.totalDirectIncome += actComm;
        }

        const lHash = '0x' + crypto.createHash('sha256').update(`lvl_${sponsor.userId}_from_${u.userId}_l${lvl}`).digest('hex');
        levelIncomes.push({
          beneWallet: sponsor.wallet,
          beneUserId: sponsor.userId,
          fromWallet: u.wallet,
          fromUserId: u.userId,
          level: lvl,
          percent: percent,
          amount: Math.round(actComm * 10000) / 10000,
          txHash: lHash,
          createdAt: u.createdAt
        });

        transactions.push({
          txId: `tx_lvl_${sponsor.userId}_${u.userId}_l${lvl}`,
          wallet: sponsor.wallet,
          userId: sponsor.userId,
          type: (lvl === 1 ? 'direct_bonus' : 'level_income'),
          title: (lvl === 1 ? `Direct Referral Bonus (${u.userId})` : `Level ${lvl} Commission (${u.userId})`),
          amount: Math.round(actComm * 10000) / 10000,
          fee: 0.0,
          net: Math.round(actComm * 10000) / 10000,
          status: 'completed',
          txHash: lHash,
          createdAt: u.createdAt
        });
      }
    }

    childIndex = currIndex;
    currIndex = sponsor.sponsorIndex;
  }
});

// 4. Calculate Daily Dynamic ROI Payouts (approx 15-30 days of ROI)
const dailyRoiPayouts = [];
users.forEach(u => {
  if (u.totalStaked <= 0) return;

  const daysActive = randInt(10, 30);
  const dailyRate = 0.84;
  const grossTotalRoi = (u.totalStaked * (dailyRate / 100.0)) * daysActive;
  const remCap = Math.max(0, u.maxCap - u.totalEarnedTowardsCap);
  const creditedRoi = Math.min(grossTotalRoi, remCap);

  if (creditedRoi > 0) {
    u.totalRoiIncome += creditedRoi;
    u.totalEarnedTowardsCap += creditedRoi;
    u.availableBalance += creditedRoi;

    const rHash = '0x' + crypto.createHash('sha256').update(`roi_${u.userId}_credited`).digest('hex');
    dailyRoiPayouts.push({
      wallet: u.wallet,
      userId: u.userId,
      staked: u.totalStaked,
      rate: dailyRate,
      gross: Math.round(grossTotalRoi * 100) / 100,
      credited: Math.round(creditedRoi * 100) / 100,
      remCapAfter: Math.round(Math.max(0, remCap - creditedRoi) * 100) / 100,
      payoutDate: '2026-10-04',
      txHash: rHash
    });

    transactions.push({
      txId: `tx_roi_${u.userId}`,
      wallet: u.wallet,
      userId: u.userId,
      type: 'daily_roi',
      title: `Daily Liquidity ROI (${dailyRate}%)`,
      amount: Math.round(creditedRoi * 100) / 100,
      fee: 0.0,
      net: Math.round(creditedRoi * 100) / 100,
      status: 'completed',
      txHash: rHash,
      createdAt: '2026-10-04 06:00:00'
    });
  }
});

// 5. Calculate Strong Leg vs Other Legs & Royalty Club qualifications
users.forEach(u => {
  const legValues = Object.values(u.directLegVolumes).sort((a, b) => b - a);
  u.strongLeg = legValues.length > 0 ? legValues[0] : Math.round(u.totalTeamTurnover * 0.6);
  u.otherLegs = legValues.length > 1 ? legValues.slice(1).reduce((a, b) => a + b, 0) : Math.round(u.totalTeamTurnover * 0.4);

  // Royalty calculation
  if (u.directsCount >= 20 && u.totalTeamTurnover >= 100000) {
    u.totalRoyaltyIncome = 850.0;
  } else if (u.directsCount >= 15 && u.totalTeamTurnover >= 35000) {
    u.totalRoyaltyIncome = 280.0;
  } else if (u.directsCount >= 10 && u.totalTeamTurnover >= 15000) {
    u.totalRoyaltyIncome = 110.0;
  } else if (u.directsCount >= 5 && u.totalTeamTurnover >= 5000) {
    u.totalRoyaltyIncome = 45.0;
  }

  if (u.totalRoyaltyIncome > 0) {
    const remCap = Math.max(0, u.maxCap - u.totalEarnedTowardsCap);
    const actRoyalty = Math.min(u.totalRoyaltyIncome, remCap);
    u.totalEarnedTowardsCap += actRoyalty;
    u.availableBalance += actRoyalty;
  }

  // Calculate Rank
  if (u.totalStaked >= 5000 && u.directsCount >= 15 && u.totalTeamTurnover >= 100000) {
    u.rank = 'Imperial Founder';
  } else if (u.totalStaked >= 1000 && u.directsCount >= 12 && u.totalTeamTurnover >= 50000) {
    u.rank = 'Crown Diamond Leader';
  } else if (u.totalStaked >= 500 && u.directsCount >= 8 && u.totalTeamTurnover >= 20000) {
    u.rank = 'Gold Treasure Leader';
  } else if (u.totalStaked >= 250 && u.directsCount >= 5 && u.totalTeamTurnover >= 10000) {
    u.rank = 'Silver Treasure Master';
  } else if (u.totalStaked >= 100 && u.directsCount >= 2) {
    u.rank = 'Bronze Treasure Explorer';
  } else {
    u.rank = 'Treasure Explorer';
  }
});

// 6. Generate Some Withdrawals (for ~200 users with positive available balance)
const withdrawals = [];
users.forEach((u, idx) => {
  if (u.availableBalance >= 50 && (idx % 4 === 0)) {
    const withAmt = Math.round((u.availableBalance * 0.5) * 100) / 100;
    if (withAmt >= 10) {
      const fee = Math.round(withAmt * 0.05 * 100) / 100; // 5% fee
      const net = Math.round((withAmt - fee) * 100) / 100;
      u.availableBalance -= withAmt;
      u.totalWithdrawn += net;

      const wHash = '0x' + crypto.createHash('sha256').update(`with_${u.userId}_${withAmt}`).digest('hex');
      withdrawals.push({
        wallet: u.wallet,
        userId: u.userId,
        gross: withAmt,
        fee: fee,
        net: net,
        txHash: wHash,
        status: 'confirmed',
        createdAt: '2026-09-28 14:00:00'
      });

      transactions.push({
        txId: `tx_with_${u.userId}`,
        wallet: u.wallet,
        userId: u.userId,
        type: 'withdrawal',
        title: `Withdrawal to BEP-20 Wallet (${u.wallet.substring(0, 6)}...${u.wallet.substring(38)})`,
        amount: withAmt,
        fee: fee,
        net: net,
        status: 'completed',
        txHash: wHash,
        createdAt: '2026-09-28 14:00:00'
      });
    }
  }
});

// Fix floating precision on all user balances
users.forEach(u => {
  u.totalStaked = Math.round(u.totalStaked * 100) / 100;
  u.availableBalance = Math.round(Math.max(0, u.availableBalance) * 100) / 100;
  u.totalWithdrawn = Math.round(u.totalWithdrawn * 100) / 100;
  u.totalLevelIncome = Math.round(u.totalLevelIncome * 100) / 100;
  u.totalDirectIncome = Math.round(u.totalDirectIncome * 100) / 100;
  u.totalRoiIncome = Math.round(u.totalRoiIncome * 100) / 100;
  u.totalRoyaltyIncome = Math.round(u.totalRoyaltyIncome * 100) / 100;
  u.totalTeamTurnover = Math.round(u.totalTeamTurnover * 100) / 100;
  u.strongLeg = Math.round(u.strongLeg * 100) / 100;
  u.otherLegs = Math.round(u.otherLegs * 100) / 100;
  u.maxCap = Math.round(u.maxCap * 100) / 100;
  u.totalEarnedTowardsCap = Math.round(u.totalEarnedTowardsCap * 100) / 100;
});

// Ensure User 2 (Demo User MT-77291) has impressive live stats
const demoUser = users[1];
demoUser.totalStaked = 500.0;
demoUser.pkg = packages[3];
demoUser.maxCap = 1500.0;
demoUser.availableBalance = 218.40;
demoUser.totalWithdrawn = 320.00;
demoUser.totalLevelIncome = 520.40;
demoUser.totalDirectIncome = 250.00;
demoUser.totalRoiIncome = 184.80;
demoUser.totalRoyaltyIncome = 95.00;
demoUser.totalEarnedTowardsCap = 1050.20;
demoUser.rank = 'Gold Treasure Leader';

console.log(`Generated:
- Users: ${users.length}
- Private Keys: ${wallets.length}
- Staking Deposits: ${deposits.length}
- Level Income Rows: ${levelIncomes.length}
- Daily ROI Payouts: ${dailyRoiPayouts.length}
- Withdrawals: ${withdrawals.length}
- Unified Transactions: ${transactions.length}
`);

// 7. Write to SQL file in clean batches
const sqlChunks = [];

sqlChunks.push(`-- ============================================================================
-- Morgan Treasure - 1,000 Users Production Seed Dataset with Private Keys & Calculations
-- Generated for MariaDB / MySQL 8.0+
-- Database: morgan_treasure
-- ============================================================================

USE \`morgan_treasure\`;
SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing data
TRUNCATE TABLE \`users\`;
TRUNCATE TABLE \`user_wallets\`;
TRUNCATE TABLE \`deposits\`;
TRUNCATE TABLE \`level_income\`;
TRUNCATE TABLE \`daily_roi_payouts\`;
TRUNCATE TABLE \`withdrawals\`;
TRUNCATE TABLE \`transactions\`;

`);

// A. Insert Users (Batch size 50)
sqlChunks.push(`-- ----------------------------------------------------------------------------
-- 1. Inserting 1,000 Users (Genealogy, Staking, Capping, & Calculated Balances)
-- ----------------------------------------------------------------------------\n`);

const USER_BATCH_SIZE = 50;
for (let i = 0; i < users.length; i += USER_BATCH_SIZE) {
  const batch = users.slice(i, i + USER_BATCH_SIZE);
  sqlChunks.push(`INSERT INTO \`users\` (
  \`wallet_address\`, \`user_id\`, \`sponsor_id\`, \`sponsor_address\`, \`nickname\`, 
  \`active_package_id\`, \`active_package_name\`, \`total_staked_usdt\`, \`available_balance_usdt\`, 
  \`total_withdrawn_usdt\`, \`total_level_income_usdt\`, \`total_direct_income_usdt\`, \`total_roi_income_usdt\`, \`total_royalty_income_usdt\`, 
  \`rank\`, \`directs_count\`, \`active_directs_count\`, \`total_team_count\`, \`total_team_turnover_usdt\`, 
  \`strong_leg_volume_usdt\`, \`other_legs_volume_usdt\`, \`max_capping_limit_usdt\`, \`total_earning_towards_cap_usdt\`, 
  \`is_registered\`, \`is_active\`, \`created_at\`
) VALUES \n` + batch.map(u => {
    const spAddr = u.sponsorAddress ? `'${u.sponsorAddress}'` : 'NULL';
    const pkgId = u.pkg ? `'${u.pkg.id}'` : "'none'";
    const pkgName = u.pkg ? `'${u.pkg.name.replace(/'/g, "''")}'` : "'No Active Package'";
    const nick = `'${u.nickname.replace(/'/g, "''")}'`;
    const rnk = `'${u.rank}'`;
    return `('${u.wallet}', '${u.userId}', '${u.sponsorId}', ${spAddr}, ${nick}, ${pkgId}, ${pkgName}, ${u.totalStaked.toFixed(4)}, ${u.availableBalance.toFixed(4)}, ${u.totalWithdrawn.toFixed(4)}, ${u.totalLevelIncome.toFixed(4)}, ${u.totalDirectIncome.toFixed(4)}, ${u.totalRoiIncome.toFixed(4)}, ${u.totalRoyaltyIncome.toFixed(4)}, ${rnk}, ${u.directsCount}, ${u.activeDirectsCount}, ${u.totalTeamCount}, ${u.totalTeamTurnover.toFixed(4)}, ${u.strongLeg.toFixed(4)}, ${u.otherLegs.toFixed(4)}, ${u.maxCap.toFixed(4)}, ${u.totalEarnedTowardsCap.toFixed(4)}, 1, ${u.totalStaked > 0 ? 1 : 0}, '${u.createdAt}')`;
  }).join(',\n') + ';\n\n');
}

// B. Insert User Wallets & Private Keys (Dedicated Table)
sqlChunks.push(`-- ----------------------------------------------------------------------------
-- 2. Inserting 1,000 User Wallets with EVM Private Keys (user_wallets table)
-- ----------------------------------------------------------------------------\n`);

const WALLET_BATCH_SIZE = 50;
for (let i = 0; i < wallets.length; i += WALLET_BATCH_SIZE) {
  const batch = wallets.slice(i, i + WALLET_BATCH_SIZE);
  sqlChunks.push(`INSERT INTO \`user_wallets\` (
  \`user_id\`, \`wallet_address\`, \`private_key\`, \`network\`, \`key_type\`, \`is_active\`
) VALUES \n` + batch.map(w => {
    return `('${w.userId}', '${w.wallet}', '${w.privateKey}', 'BNB Smart Chain (BEP-20)', 'secp256k1', 1)`;
  }).join(',\n') + ';\n\n');
}

// C. Insert Staking Deposits
sqlChunks.push(`-- ----------------------------------------------------------------------------
-- 3. Inserting Staking Deposits
-- ----------------------------------------------------------------------------\n`);

const DEP_BATCH_SIZE = 50;
for (let i = 0; i < deposits.length; i += DEP_BATCH_SIZE) {
  const batch = deposits.slice(i, i + DEP_BATCH_SIZE);
  sqlChunks.push(`INSERT INTO \`deposits\` (
  \`wallet_address\`, \`user_id\`, \`package_id\`, \`package_name\`, \`amount_usdt\`, \`daily_roi_at_deposit\`, \`tx_hash\`, \`status\`, \`created_at\`
) VALUES \n` + batch.map(d => {
    return `('${d.wallet}', '${d.userId}', '${d.pkgId}', '${d.pkgName.replace(/'/g, "''")}', ${d.amount.toFixed(4)}, ${d.dailyRoi.toFixed(2)}, '${d.txHash}', '${d.status}', '${d.createdAt}')`;
  }).join(',\n') + ';\n\n');
}

// D. Insert Level Income Rows
sqlChunks.push(`-- ----------------------------------------------------------------------------
-- 4. Inserting 15-Tier Level Income Commissions
-- ----------------------------------------------------------------------------\n`);

const LVL_BATCH_SIZE = 50;
for (let i = 0; i < levelIncomes.length; i += LVL_BATCH_SIZE) {
  const batch = levelIncomes.slice(i, i + LVL_BATCH_SIZE);
  sqlChunks.push(`INSERT INTO \`level_income\` (
  \`beneficiary_wallet\`, \`beneficiary_user_id\`, \`from_wallet\`, \`from_user_id\`, \`level\`, \`commission_percent\`, \`amount_usdt\`, \`tx_hash\`, \`status\`, \`created_at\`
) VALUES \n` + batch.map(l => {
    return `('${l.beneWallet}', '${l.beneUserId}', '${l.fromWallet}', '${l.fromUserId}', ${l.level}, ${l.percent.toFixed(2)}, ${l.amount.toFixed(4)}, '${l.txHash}', 'credited', '${l.createdAt}')`;
  }).join(',\n') + ';\n\n');
}

// E. Insert Daily ROI Payouts
sqlChunks.push(`-- ----------------------------------------------------------------------------
-- 5. Inserting Daily Dynamic ROI Payouts
-- ----------------------------------------------------------------------------\n`);

const ROI_BATCH_SIZE = 50;
for (let i = 0; i < dailyRoiPayouts.length; i += ROI_BATCH_SIZE) {
  const batch = dailyRoiPayouts.slice(i, i + ROI_BATCH_SIZE);
  sqlChunks.push(`INSERT INTO \`daily_roi_payouts\` (
  \`wallet_address\`, \`user_id\`, \`staked_amount_usdt\`, \`roi_rate_percent\`, \`gross_payout_usdt\`, \`credited_payout_usdt\`, \`remaining_cap_after\`, \`payout_date\`, \`tx_hash\`
) VALUES \n` + batch.map(r => {
    return `('${r.wallet}', '${r.userId}', ${r.staked.toFixed(4)}, ${r.rate.toFixed(2)}, ${r.gross.toFixed(4)}, ${r.credited.toFixed(4)}, ${r.remCapAfter.toFixed(4)}, '${r.payoutDate}', '${r.txHash}')`;
  }).join(',\n') + ';\n\n');
}

// F. Insert Withdrawals
sqlChunks.push(`-- ----------------------------------------------------------------------------
-- 6. Inserting Withdrawals (with 5% Liquidity Fee)
-- ----------------------------------------------------------------------------\n`);

const WITH_BATCH_SIZE = 50;
for (let i = 0; i < withdrawals.length; i += WITH_BATCH_SIZE) {
  const batch = withdrawals.slice(i, i + WITH_BATCH_SIZE);
  sqlChunks.push(`INSERT INTO \`withdrawals\` (
  \`wallet_address\`, \`user_id\`, \`gross_amount_usdt\`, \`fee_amount_usdt\`, \`net_payout_usdt\`, \`tx_hash\`, \`status\`, \`payment_method\`, \`created_at\`
) VALUES \n` + batch.map(w => {
    return `('${w.wallet}', '${w.userId}', ${w.gross.toFixed(4)}, ${w.fee.toFixed(4)}, ${w.net.toFixed(4)}, '${w.txHash}', '${w.status}', 'BEP20_USDT', '${w.createdAt}')`;
  }).join(',\n') + ';\n\n');
}

// G. Insert Master Unified Transactions
sqlChunks.push(`-- ----------------------------------------------------------------------------
-- 7. Inserting Unified Master Ledger Transactions
-- ----------------------------------------------------------------------------\n`);

const TX_BATCH_SIZE = 50;
for (let i = 0; i < transactions.length; i += TX_BATCH_SIZE) {
  const batch = transactions.slice(i, i + TX_BATCH_SIZE);
  sqlChunks.push(`INSERT INTO \`transactions\` (
  \`tx_id\`, \`wallet_address\`, \`user_id\`, \`type\`, \`title\`, \`amount_usdt\`, \`fee_usdt\`, \`net_amount_usdt\`, \`status\`, \`tx_hash\`, \`network\`, \`created_at\`
) VALUES \n` + batch.map(t => {
    const title = `'${t.title.replace(/'/g, "''")}'`;
    return `('${t.txId}', '${t.wallet}', '${t.userId}', '${t.type}', ${title}, ${t.amount.toFixed(4)}, ${t.fee.toFixed(4)}, ${t.net.toFixed(4)}, '${t.status}', '${t.txHash}', 'BNB Chain', '${t.createdAt}')`;
  }).join(',\n') + ';\n\n');
}

sqlChunks.push(`SET FOREIGN_KEY_CHECKS = 1;\n\n-- Generation Complete!\n`);

fs.writeFileSync(OUTPUT_FILE, sqlChunks.join(''), 'utf8');

const fileSizeMb = (fs.statSync(OUTPUT_FILE).size / (1024 * 1024)).toFixed(2);
console.log(`Successfully generated ${OUTPUT_FILE} (${fileSizeMb} MB).`);
