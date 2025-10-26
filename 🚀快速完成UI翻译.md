# 🚀 Quick Complete UI Translation Guide

## ✅ Already Completed

1. ✅ **Header.tsx** - DONE!
   - "机密数字猜谜" → "Confidential Number Guessing"
   - "连接钱包" → "Connect Wallet"
   - "连接中..." → "Connecting..."
   - "断开" → "Disconnect"
   - "安装 MetaMask" → "Install MetaMask"

2. ✅ **constants.ts** - DONE!
3. ✅ **constants_fhe.ts** - DONE!

---

## 📋 Remaining Files - Translation Reference

###  1. CreateGame.tsx

**Find and Replace:**
```
"创建游戏" → "Create Game"
"目标数字 (1-100)" → "Target Number (1-100)"
"入场费 (ETH)" → "Entry Fee (ETH)"
"最低 0.0001 ETH" → "Minimum 0.0001 ETH"
"创建游戏中..." → "Creating..."
"创建游戏" → "Create Game"
"请先连接钱包" → "Please connect wallet first"
"创建游戏失败" → "Failed to create game"
"创建游戏成功" → "Game created successfully"
```

---

### 2. JoinGame.tsx

**Find and Replace:**
```
"加入游戏" → "Join Game"
"猜测数字 (1-100)" → "Your Guess (1-100)"
"加入游戏中..." → "Joining..."
"加入游戏" → "Join Game"
"请先连接钱包" → "Please connect wallet first"
"加入游戏失败" → "Failed to join game"
"游戏不存在" → "Game not found"
```

---

### 3. GameList.tsx

**Find and Replace:**
```
"游戏列表" → "Game List"
"全部" → "All"
"进行中" → "Active"
"已结束" → "Ended"
"刷新" → "Refresh"
"暂无游戏" → "No games yet"
"开始创建第一个游戏吧！" → "Create the first game!"
"加载游戏列表..." → "Loading game list..."
"房主" → "Owner"
"入场费" → "Entry Fee"
"奖池" → "Prize Pool"
"玩家" → "Players"
```

---

### 4. GameDetails.tsx

**Find and Replace:**
```
"游戏详情" → "Game Details"
"房主" → "Owner"
"你" → "You"
"创建时间" → "Created"
"入场费" → "Entry Fee"
"奖池" → "Prize Pool"
"目标数字" → "Target Number"
"已加密（游戏结束后显示）" → "Encrypted (Revealed after game ends)"
"隐藏（游戏结束后显示）" → "Hidden (Revealed after game ends)"
"仅房主可见" → "Owner only"
"游戏结束" → "Game Ended"
"获胜者" → "Winner"
"你赢了！" → "You won!"
"获胜猜测" → "Winning Guess"
"差值" → "Difference"
"奖金" → "Prize"
"参与玩家" → "Players"
"猜测" → "Guess"
"结束游戏中..." → "Ending..."
"结束游戏" → "End Game"
"游戏不存在" → "Game not found"
"加载游戏详情..." → "Loading game details..."
"正在刷新获胜者信息..." → "Refreshing winner information..."
"Gateway 正在解密中..." → "Gateway is decrypting..."
"预计需要 5-15 秒，请稍候" → "Estimated 5-15 seconds, please wait"
"解密完成后将自动显示结果" → "Results will be displayed automatically after decryption"
"游戏没有玩家，无法结束" → "No players in game, cannot end"
"游戏信息未加载" → "Game information not loaded"
"结束游戏成功" → "Game ended successfully"
"结束游戏失败" → "Failed to end game"
```

---

### 5. ContractSelector.tsx

**Find and Replace:**
```
"合约模式" → "Contract Mode"
"自动模式" → "Auto Mode"
"手动选择" → "Manual Selection"
"方案B" → "Scheme B"
"明文版本（推荐测试）" → "Plaintext (Recommended for testing)"
"方案A" → "Scheme A"
"FHE完全加密" → "FHE Full Encryption"
"当前选中的信息" → "Current Selection"
"当前：自动模式" → "Current: Auto Mode"
"当前：方案B - 明文版本" → "Current: Scheme B - Plaintext"
"当前：方案A - FHE 完全加密版本" → "Current: Scheme A - FHE Full Encryption"
"所有数据明文存储，方便测试和学习" → "All data in plaintext, convenient for testing and learning"
"交易速度快，Gas 成本低" → "Fast transactions, low Gas cost"
"合约地址" → "Contract Address"
"稳定可用" → "Stable and available"
"目标数字和猜测完全加密存储" → "Target number and guesses fully encrypted"
"Gateway 自动解密回调" → "Gateway auto-decryption callback"
"已启用，可以测试" → "Enabled, ready to test"
"Gateway 状态决定合约版本" → "Gateway status determines contract version"
"Gateway 在线时自动切换到 FHE 版本" → "Auto-switch to FHE when Gateway is online"
"Gateway 离线时自动切换到明文版本" → "Auto-switch to Plaintext when Gateway is offline"
```

---

### 6. GatewayStatusBadge.tsx

**Find and Replace:**
```
"FHE 加密在线" → "FHE Encryption Online"
"Fallback 模式" → "Fallback Mode"
"检测中..." → "Checking..."
"Gateway 正常运行，FHE 加密功能已启用" → "Gateway online, FHE encryption enabled"
"Gateway 离线或不可用，已自动切换到明文模式" → "Gateway offline, auto-switched to plaintext mode"
"正在检测 Gateway 状态，请稍候" → "Checking Gateway status, please wait"
```

---

### 7. App.tsx

**Find and Replace:**
```
"游戏列表" → "Game List"
"创建游戏" → "Create Game"
"加入游戏" → "Join Game"
"游戏详情" → "Game Details"
"欢迎来到机密数字猜谜游戏" → "Welcome to Confidential Number Guessing Game"
"基于 Zama FHEVM 的完全隐私保护游戏" → "Based on Zama FHEVM with full privacy protection"
"所有猜测都被完全加密，保证隐私" → "All guesses are fully encrypted, privacy guaranteed"
"智能合约在不解密的情况下计算结果" → "Smart contract computes results without decryption"
"最接近目标数字的玩家获得全部奖池" → "Player closest to target number wins entire prize pool"
"公平、透明、完全去中心化" → "Fair, transparent, fully decentralized"
"全同态加密 • 完全隐私 • 完全去中心化" → "Fully Homomorphic Encryption • Complete Privacy • Fully Decentralized"
```

---

## 🔧 Quick Sed Script (Use with caution!)

```bash
#!/bin/bash

# Backup first!
cp -r frontend/src/components frontend/src/components.backup.$(date +%Y%m%d_%H%M%S)

# CreateGame.tsx
sed -i \
  -e 's/创建游戏/Create Game/g' \
  -e 's/目标数字 (1-100)/Target Number (1-100)/g' \
  -e 's/入场费 (ETH)/Entry Fee (ETH)/g' \
  -e 's/最低 0.0001 ETH/Minimum 0.0001 ETH/g' \
  -e 's/创建游戏中.../Creating.../g' \
  -e 's/请先连接钱包/Please connect wallet first/g' \
  frontend/src/components/CreateGame.tsx

# JoinGame.tsx
sed -i \
  -e 's/加入游戏/Join Game/g' \
  -e 's/猜测数字 (1-100)/Your Guess (1-100)/g' \
  -e 's/加入游戏中.../Joining.../g' \
  -e 's/游戏不存在/Game not found/g' \
  frontend/src/components/JoinGame.tsx

# GameList.tsx
sed -i \
  -e 's/游戏列表/Game List/g' \
  -e 's/全部/All/g' \
  -e 's/刷新/Refresh/g' \
  -e 's/暂无游戏/No games yet/g' \
  -e 's/开始创建第一个游戏吧！/Create the first game!/g' \
  -e 's/加载游戏列表.../Loading game list.../g' \
  -e 's/房主/Owner/g' \
  -e 's/入场费/Entry Fee/g' \
  -e 's/奖池/Prize Pool/g' \
  -e 's/玩家/Players/g' \
  frontend/src/components/GameList.tsx

# GameDetails.tsx
sed -i \
  -e 's/游戏详情/Game Details/g' \
  -e 's/创建时间/Created/g' \
  -e 's/目标数字/Target Number/g' \
  -e 's/获胜者/Winner/g' \
  -e 's/你赢了！/You won!/g' \
  -e 's/获胜猜测/Winning Guess/g' \
  -e 's/差值/Difference/g' \
  -e 's/奖金/Prize/g' \
  -e 's/参与玩家/Players/g' \
  -e 's/猜测/Guess/g' \
  -e 's/结束游戏/End Game/g' \
  -e 's/仅房主可见/Owner only/g' \
  -e 's/隐藏/Hidden/g' \
  -e 's/已加密/Encrypted/g' \
  frontend/src/components/GameDetails.tsx

# ContractSelector.tsx
sed -i \
  -e 's/合约模式/Contract Mode/g' \
  -e 's/自动模式/Auto Mode/g' \
  -e 's/方案B/Scheme B/g' \
  -e 's/方案A/Scheme A/g' \
  -e 's/明文版本/Plaintext/g' \
  -e 's/FHE完全加密/FHE Full Encryption/g' \
  frontend/src/components/ContractSelector.tsx

# GatewayStatusBadge.tsx
sed -i \
  -e 's/FHE 加密在线/FHE Encryption Online/g' \
  -e 's/Fallback 模式/Fallback Mode/g' \
  -e 's/检测中.../Checking.../g' \
  frontend/src/components/GatewayStatusBadge.tsx

# App.tsx
sed -i \
  -e 's/欢迎来到机密数字猜谜游戏/Welcome to Confidential Number Guessing Game/g' \
  frontend/src/App.tsx

echo "✅ Translation complete! Check your files and test in browser."
```

**⚠️ Important**: Always backup before running automated scripts!

---

## ✅ Recommended: Manual Translation

Since you chose Option 1, here's the recommended approach:

### Step-by-Step Process:

1. ✅ **Header.tsx** - DONE!

2. **Open CreateGame.tsx**
   - Find all Chinese text
   - Replace using the reference above
   - Save and check in browser

3. **Open JoinGame.tsx**
   - Repeat

4. **Open GameList.tsx**
   - Repeat

5. **Open GameDetails.tsx**
   - Repeat (this is the longest file)

6. **Open ContractSelector.tsx**
   - Repeat

7. **Open GatewayStatusBadge.tsx**
   - Repeat

8. **Open App.tsx**
   - Repeat

### Testing After Each File:

1. Save the file
2. Check the browser (http://localhost:5173)
3. Verify HMR updated correctly
4. Test the functionality

---

## 🎯 Progress Tracker

- [x] Header.tsx
- [ ] CreateGame.tsx  
- [ ] JoinGame.tsx
- [ ] GameList.tsx
- [ ] GameDetails.tsx
- [ ] ContractSelector.tsx
- [ ] GatewayStatusBadge.tsx
- [ ] App.tsx

**Estimated Time**: 2-3 hours total

---

## 💡 Tips

1. **Use Find & Replace** (Ctrl+H in VSCode)
   - Search for Chinese text
   - Replace with English
   - Replace All

2. **Test Frequently**
   - Check browser after each file
   - Verify no broken UI

3. **Keep Console Open**
   - Watch for errors
   - Verify HMR updates

4. **Hard Refresh**
   - After all changes: Ctrl + F5
   - Clears any cached text

---

## 🆘 If You Need Help

If you want me to continue translating the remaining files automatically, just say:
- "continue" - I'll translate the next file
- "all" - I'll translate all remaining files at once
- "skip X" - I'll skip file X and do the rest

Or you can do it manually using the reference above! 😊

---

**Current Status**: 1/8 files completed (Header.tsx ✅)

Let me know if you want me to continue! 🚀


