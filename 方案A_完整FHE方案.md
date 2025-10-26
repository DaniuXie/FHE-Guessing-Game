# 方案A：使用正确的SDK实现完整FHE

## 📦 1. 更换前端依赖

### 卸载错误的包
```bash
cd frontend
npm uninstall fhevmjs
```

### 安装正确的包
```bash
npm install @zama-fhe/relayer-sdk
npm install @fhevm/solidity
```

## 📝 2. 更新前端代码

### frontend/src/utils/fhevm.ts
```typescript
import { createInstance, createEncryptedInput } from "@zama-fhe/relayer-sdk";
import { SepoliaConfig } from "@zama-fhe/relayer-sdk/configs";

let instance: any = null;

export async function initFhevm() {
  if (instance) return instance;
  
  try {
    console.log("🔧 初始化 FHEVM SDK...");
    instance = await createInstance(SepoliaConfig);
    console.log("✅ FHEVM SDK 初始化成功");
    return instance;
  } catch (error) {
    console.error("❌ FHEVM SDK 初始化失败:", error);
    throw error;
  }
}

export async function encryptNumber(
  number: number,
  userAddress: string,
  contractAddress: string
): Promise<{ handle: any; attestation: any }> {
  try {
    console.log(`🔐 加密数字 ${number}...`);
    
    const inst = await initFhevm();
    
    const { handles, attestation } = await createEncryptedInput(inst, [
      { type: "euint32", value: number }
    ]);
    
    console.log("✅ 加密完成");
    
    return {
      handle: handles[0],
      attestation: attestation
    };
  } catch (error) {
    console.error("❌ 加密失败:", error);
    throw new Error("加密数字失败");
  }
}
```

## 🔧 3. 更新合约（如果需要）

### contracts/GuessGame.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";

contract GuessGame {
    struct Game {
        uint256 gameId;
        euint32 targetNumber;  // 加密的目标数字
        address owner;
        uint256 entryFee;
        uint256 prizePool;
        address[] players;
        mapping(address => euint32) guesses;
        mapping(address => bool) hasGuessed;
        GameStatus status;
        address winner;
        uint256 createdAt;
    }
    
    enum GameStatus { ACTIVE, ENDED }
    
    mapping(uint256 => Game) public games;
    uint256 public gameCounter;
    
    event GameCreated(uint256 indexed gameId, address indexed owner, uint256 entryFee, uint256 createdAt);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 prizePool);
    event GameEnded(uint256 indexed gameId, address indexed winner, uint256 prizePool);
    
    function createGame(
        externalEuint32 externalTarget,  // 外部加密输入
        bytes calldata attestation,      // 证明
        uint256 entryFee
    ) external payable returns (uint256) {
        require(entryFee > 0, "Entry fee must be greater than 0");
        require(msg.value == entryFee, "Incorrect entry fee");
        
        gameCounter++;
        uint256 newGameId = gameCounter;
        
        Game storage newGame = games[newGameId];
        newGame.gameId = newGameId;
        newGame.owner = msg.sender;
        newGame.entryFee = entryFee;
        newGame.prizePool = msg.value;
        newGame.status = GameStatus.ACTIVE;
        newGame.createdAt = block.timestamp;
        
        // 从外部导入加密值
        newGame.targetNumber = FHE.fromExternal(externalTarget, attestation);
        FHE.allow(newGame.targetNumber, address(this));
        
        emit GameCreated(newGameId, msg.sender, entryFee, block.timestamp);
        
        return newGameId;
    }
    
    function joinGame(
        uint256 gameId,
        externalEuint32 externalGuess,   // 外部加密输入
        bytes calldata attestation        // 证明
    ) external payable {
        Game storage game = games[gameId];
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(!game.hasGuessed[msg.sender], "Already guessed");
        require(msg.value == game.entryFee, "Incorrect entry fee");
        require(msg.sender != game.owner, "Owner cannot join");
        
        // 从外部导入加密猜测
        euint32 guess = FHE.fromExternal(externalGuess, attestation);
        FHE.allow(guess, address(this));
        
        game.guesses[msg.sender] = guess;
        game.hasGuessed[msg.sender] = true;
        game.players.push(msg.sender);
        game.prizePool += msg.value;
        
        emit PlayerJoined(gameId, msg.sender, game.prizePool);
    }
    
    // 其他函数...
}
```

## 🎨 4. 更新前端调用

### frontend/src/hooks/useContract.ts
```typescript
const createGame = async (targetNumber: number, entryFeeEth: string) => {
  // 加密目标数字
  const { handle, attestation } = await encryptNumber(
    targetNumber,
    address,
    CONTRACT_ADDRESS
  );
  
  // 调用合约
  const entryFee = parseEther(entryFeeEth);
  const signer = await provider.getSigner();
  const contractWithSigner = contract.connect(signer);
  
  const tx = await contractWithSigner.createGame(
    handle,        // externalEuint32
    attestation,   // bytes
    entryFee,      // uint256
    { value: entryFee }
  );
  
  await tx.wait();
};
```

## 📊 优缺点

### ✅ 优点
- 真正的FHE加密
- 完整的隐私保护
- 符合官方最佳实践
- 学习价值高

### ❌ 缺点
- 需要重新部署合约
- 需要更换依赖
- 配置更复杂
- 依赖Gateway稳定性

## ⏱️ 预计工作量
- 前端修改：30分钟
- 合约修改：30分钟
- 测试调试：1小时
- **总计：2小时**

---

**适合**：想学习完整FHEVM的用户 🎓



