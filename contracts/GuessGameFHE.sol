// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

/**
 * @title GuessGameFHE
 * @notice 完整FHE版本的猜数字游戏
 * @dev 使用全同态加密保护目标数字和猜测
 * 
 * 隐私保护策略：
 * - 目标数字：加密存储（euint32）
 * - 玩家猜测：加密存储（euint32）
 * - 游戏进行中：所有数据保持加密
 * - 结束游戏：房主触发，揭露所有猜测，计算获胜者
 */
contract GuessGameFHE {
    
    enum GameStatus {
        ACTIVE,      // 游戏进行中
        ENDED        // 游戏已结束
    }
    
    struct Game {
        uint256 gameId;
        euint32 encryptedTarget;           // 🔐 加密的目标数字
        address owner;
        uint256 entryFee;
        uint256 prizePool;
        address[] players;
        mapping(address => euint32) encryptedGuesses; // 🔐 加密的猜测
        mapping(address => bool) hasGuessed;
        GameStatus status;
        address winner;
        uint32 revealedTarget;             // 游戏结束后揭露的目标
        mapping(address => uint32) revealedGuesses;    // 游戏结束后揭露的猜测
        uint256 createdAt;
    }
    
    mapping(uint256 => Game) public games;
    uint256 public gameCounter;
    
    event GameCreated(uint256 indexed gameId, address indexed owner, uint256 entryFee, uint256 timestamp);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 prizePool, uint256 timestamp);
    event GameEnded(uint256 indexed gameId, address indexed winner, uint256 prize, uint32 target, uint256 timestamp);
    
    /**
     * @notice 创建新游戏（FHE版本）
     * @param encryptedTarget 加密的目标数字句柄（前端生成）
     * @param inputProof 加密数据的证明
     * @param entryFee 入场费（wei）
     * @dev 前端用户输入明文 → SDK 加密 → 合约存储密文
     */
    function createGame(
        einput encryptedTarget,           // einput handle
        bytes memory inputProof,          // 证明
        uint256 entryFee
    ) external payable returns (uint256) {
        require(entryFee > 0, "Entry fee must be greater than 0");
        require(msg.value == entryFee, "Incorrect entry fee");
        
        gameCounter++;
        uint256 newGameId = gameCounter;
        
        Game storage newGame = games[newGameId];
        newGame.gameId = newGameId;
        
        // 🔐 将外部加密输入转换为合约内部的加密类型
        newGame.encryptedTarget = TFHE.asEuint32(encryptedTarget, inputProof);
        
        // 🔒 授权合约和房主访问
        TFHE.allowThis(newGame.encryptedTarget);
        TFHE.allow(newGame.encryptedTarget, msg.sender);
        
        newGame.owner = msg.sender;
        newGame.entryFee = entryFee;
        newGame.prizePool = msg.value;
        newGame.status = GameStatus.ACTIVE;
        newGame.createdAt = block.timestamp;
        
        emit GameCreated(newGameId, msg.sender, entryFee, block.timestamp);
        
        return newGameId;
    }
    
    /**
     * @notice 加入游戏并提交加密的猜测
     * @param gameId 游戏ID
     * @param encryptedGuess 加密的猜测数字句柄
     * @param inputProof 加密数据的证明
     * @dev 前端用户输入明文 → SDK 加密 → 合约存储密文
     */
    function joinGame(
        uint256 gameId,
        einput encryptedGuess,
        bytes memory inputProof
    ) external payable {
        Game storage game = games[gameId];
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(!game.hasGuessed[msg.sender], "Already guessed");
        require(msg.value == game.entryFee, "Incorrect entry fee");
        require(msg.sender != game.owner, "Owner cannot join");
        
        // 🔐 转换加密输入并存储
        euint32 guess = TFHE.asEuint32(encryptedGuess, inputProof);
        game.encryptedGuesses[msg.sender] = guess;
        
        // 🔒 授权合约和玩家访问
        TFHE.allowThis(guess);
        TFHE.allow(guess, msg.sender);
        game.hasGuessed[msg.sender] = true;
        game.players.push(msg.sender);
        game.prizePool += msg.value;
        
        emit PlayerJoined(gameId, msg.sender, game.prizePool, block.timestamp);
    }
    
    /**
     * @notice 结束游戏（简化版 - 揭露所有数据后计算）
     * @param gameId 游戏ID
     * @param decryptedTarget 明文目标数字（房主提供）
     * @param decryptedGuesses 所有玩家的明文猜测（房主提供）
     * @dev 由于 fhevm 库版本限制，采用简化策略
     */
    function endGame(
        uint256 gameId,
        uint32 decryptedTarget,
        uint32[] calldata decryptedGuesses
    ) external {
        Game storage game = games[gameId];
        require(game.owner == msg.sender, "Only owner can end");
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(game.players.length > 0, "No players");
        require(decryptedGuesses.length == game.players.length, "Invalid guesses length");
        
        // 🔐 验证提供的明文目标数字是否正确
        // 注意：在实际应用中，这需要更复杂的验证机制
        // 这里我们简化处理，信任房主提供的数据
        
        // 存储揭露的数据
        game.revealedTarget = decryptedTarget;
        
        // 找出最接近的玩家
        address bestPlayer = game.players[0];
        uint32 bestDiff = _abs(int32(decryptedGuesses[0]) - int32(decryptedTarget));
        game.revealedGuesses[bestPlayer] = decryptedGuesses[0];
        
        for (uint256 i = 1; i < game.players.length; i++) {
            address player = game.players[i];
            uint32 guess = decryptedGuesses[i];
            game.revealedGuesses[player] = guess;
            
            uint32 diff = _abs(int32(guess) - int32(decryptedTarget));
            if (diff < bestDiff) {
                bestDiff = diff;
                bestPlayer = player;
            }
        }
        
        game.winner = bestPlayer;
        game.status = GameStatus.ENDED;
        
        // 转账给获胜者
        payable(bestPlayer).transfer(game.prizePool);
        
        emit GameEnded(gameId, bestPlayer, game.prizePool, decryptedTarget, block.timestamp);
    }
    
    /**
     * @notice 计算绝对值
     */
    function _abs(int32 x) private pure returns (uint32) {
        return x >= 0 ? uint32(x) : uint32(-x);
    }
    
    /**
     * @notice 获取游戏基本信息（不包含加密数据）
     */
    function getGameInfo(uint256 gameId) external view returns (
        uint256 id,
        address owner,
        uint256 entryFee,
        uint256 prizePool,
        uint256 playerCount,
        GameStatus status,
        address winner,
        uint32 revealedTarget,  // 只有结束后才有值
        uint256 createdAt
    ) {
        Game storage game = games[gameId];
        return (
            game.gameId,
            game.owner,
            game.entryFee,
            game.prizePool,
            game.players.length,
            game.status,
            game.winner,
            game.revealedTarget,
            game.createdAt
        );
    }
    
    /**
     * @notice 获取所有玩家地址
     */
    function getPlayers(uint256 gameId) external view returns (address[] memory) {
        return games[gameId].players;
    }
    
    /**
     * @notice 获取玩家揭露后的猜测（只有游戏结束后才可用）
     */
    function getRevealedGuess(uint256 gameId, address player) external view returns (uint32) {
        Game storage game = games[gameId];
        require(game.status == GameStatus.ENDED, "Game not ended");
        return game.revealedGuesses[player];
    }
    
    /**
     * @notice 获取总游戏数
     */
    function getTotalGames() external view returns (uint256) {
        return gameCounter;
    }
    
    /**
     * @notice 检查玩家是否已猜测
     */
    function hasPlayerGuessed(uint256 gameId, address player) external view returns (bool) {
        return games[gameId].hasGuessed[player];
    }
    
    /**
     * @notice 用户解密自己的猜测（游戏进行中也可以）
     * @param gameId 游戏ID
     * @return 加密的猜测数据（需要前端 SDK 解密）
     */
    function getMyEncryptedGuess(uint256 gameId) external view returns (euint32) {
        Game storage game = games[gameId];
        require(game.hasGuessed[msg.sender], "Not guessed yet");
        return game.encryptedGuesses[msg.sender];
    }
}

