// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";

/**
 * @title GuessGameFHE_v3
 * @notice 生产级FHE猜数字游戏（完整的Gateway解密流程）
 * @dev 包含完整的请求追踪、重试机制和超时处理
 * 
 * 升级要点：
 * ✅ 修复 Gas Limit = 0 问题
 * ✅ 添加完整的请求追踪系统
 * ✅ 实现重试机制
 * ✅ 实现超时和应急处理
 * ✅ 完善事件系统
 */
contract GuessGameFHE_v3 is GatewayCaller {
    
    // ==================== 状态枚举 ====================
    enum GameStatus {
        ACTIVE,           // 游戏进行中
        DECRYPTING,       // 等待 Gateway 解密
        ENDED,            // 游戏已结束
        EXPIRED,          // 已过期（超时）
        CANCELLED         // 已取消
    }
    
    // ==================== 解密请求结构 ====================
    struct DecryptionRequest {
        uint256 gameId;
        address requester;
        uint256 timestamp;
        uint8 retryCount;
        bool processed;
        bool exists;
    }
    
    // ==================== 游戏结构 ====================
    struct Game {
        uint256 gameId;
        euint32 encryptedTarget;        // 🔐 加密的目标数字
        address owner;
        uint256 entryFee;
        uint256 prizePool;
        address[] players;
        mapping(address => euint32) encryptedGuesses;  // 🔐 加密的猜测
        mapping(address => bool) hasGuessed;
        GameStatus status;
        address winner;
        uint32 revealedTarget;           // 游戏结束后揭露
        mapping(address => uint32) revealedGuesses;    // 游戏结束后揭露
        uint256 createdAt;
        uint256 expiresAt;              // 新增：过期时间
        uint256 decryptRequestId;        // Gateway 解密请求 ID
    }
    
    // ==================== 状态变量 ====================
    mapping(uint256 => Game) public games;
    uint256 public gameCounter;
    
    // 请求追踪映射
    mapping(uint256 => uint256) private requestIdToGameId;
    mapping(uint256 => DecryptionRequest) public decryptionRequests;
    mapping(uint256 => uint256) public gameToRequestId;
    
    // ==================== 配置常量 ====================
    uint256 public constant CALLBACK_GAS_LIMIT = 500000;  // ✅ 足够的回调 Gas
    uint256 public constant REQUEST_TIMEOUT = 30 minutes;
    uint256 public constant GAME_DURATION = 24 hours;
    uint8 public constant MAX_RETRIES = 3;
    
    // ==================== 事件系统 ====================
    event GameCreated(uint256 indexed gameId, address indexed owner, uint256 entryFee, uint256 timestamp);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 prizePool, uint256 timestamp);
    
    event DecryptionRequested(
        uint256 indexed requestId, 
        uint256 indexed gameId, 
        uint256 timestamp,
        address requester
    );
    
    event DecryptionCompleted(
        uint256 indexed requestId,
        uint256 indexed gameId,
        uint32 target,
        address winner
    );
    
    event DecryptionFailed(
        uint256 indexed requestId,
        uint256 indexed gameId,
        string reason
    );
    
    event DecryptionRetrying(
        uint256 indexed gameId,
        uint256 oldRequestId,
        uint256 newRequestId,
        uint8 retryCount
    );
    
    event GameEnded(
        uint256 indexed gameId, 
        address indexed winner, 
        uint256 prize, 
        uint32 target, 
        uint256 timestamp
    );
    
    event GameExpired(
        uint256 indexed gameId,
        uint256 timestamp
    );
    
    event EmergencyResolved(
        uint256 indexed gameId,
        address resolver,
        address winner
    );
    
    // ==================== 修饰器 ====================
    modifier onlyGameOwner(uint256 gameId) {
        require(games[gameId].owner == msg.sender, "Not game owner");
        _;
    }
    
    // ==================== 创建游戏 ====================
    /**
     * @notice 创建新游戏
     */
    function createGame(
        einput encryptedTarget,
        bytes memory inputProof,
        uint256 entryFee
    ) external payable returns (uint256) {
        require(entryFee > 0, "Entry fee must be greater than 0");
        require(msg.value == entryFee, "Incorrect entry fee");
        
        gameCounter++;
        uint256 newGameId = gameCounter;
        
        Game storage newGame = games[newGameId];
        newGame.gameId = newGameId;
        
        // 🔐 导入并存储加密数据
        newGame.encryptedTarget = TFHE.asEuint32(encryptedTarget, inputProof);
        
        // 🔒 授权
        TFHE.allowThis(newGame.encryptedTarget);
        TFHE.allow(newGame.encryptedTarget, msg.sender);
        
        newGame.owner = msg.sender;
        newGame.entryFee = entryFee;
        newGame.prizePool = msg.value;
        newGame.status = GameStatus.ACTIVE;
        newGame.createdAt = block.timestamp;
        newGame.expiresAt = block.timestamp + GAME_DURATION;  // 新增
        
        emit GameCreated(newGameId, msg.sender, entryFee, block.timestamp);
        
        return newGameId;
    }
    
    // ==================== 加入游戏 ====================
    /**
     * @notice 加入游戏
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
        
        // 🔐 导入并存储加密数据
        euint32 guess = TFHE.asEuint32(encryptedGuess, inputProof);
        game.encryptedGuesses[msg.sender] = guess;
        
        // 🔒 授权
        TFHE.allowThis(guess);
        TFHE.allow(guess, msg.sender);
        
        game.hasGuessed[msg.sender] = true;
        game.players.push(msg.sender);
        game.prizePool += msg.value;
        
        emit PlayerJoined(gameId, msg.sender, game.prizePool, block.timestamp);
    }
    
    // ==================== 结束游戏并请求解密 ====================
    /**
     * @notice 结束游戏并请求解密
     * @dev 升级版：包含正确的 Gas Limit 和请求追踪
     */
    function endGame(uint256 gameId) external onlyGameOwner(gameId) {
        Game storage game = games[gameId];
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(game.players.length > 0, "No players");
        
        // 🔐 密文计算：找出最接近的玩家（保持原逻辑）
        address bestPlayer = game.players[0];
        euint32 bestGuess = game.encryptedGuesses[bestPlayer];
        euint32 minDiff = _encryptedAbsDiff(bestGuess, game.encryptedTarget);
        
        for (uint256 i = 1; i < game.players.length; i++) {
            address player = game.players[i];
            euint32 guess = game.encryptedGuesses[player];
            euint32 currentDiff = _encryptedAbsDiff(guess, game.encryptedTarget);
            
            ebool isCloser = TFHE.lt(currentDiff, minDiff);
            minDiff = TFHE.select(isCloser, currentDiff, minDiff);
        }
        
        // 🚀 请求 Gateway 解密
        uint256[] memory cts = new uint256[](game.players.length + 1);
        cts[0] = Gateway.toUint256(game.encryptedTarget);
        for (uint256 i = 0; i < game.players.length; i++) {
            cts[i + 1] = Gateway.toUint256(game.encryptedGuesses[game.players[i]]);
        }
        
        // ✅ 关键修复：正确的 Gas Limit 和超时设置
        uint256 requestId = Gateway.requestDecryption(
            cts,
            this.callbackEndGame.selector,
            CALLBACK_GAS_LIMIT,  // ✅ 修复：从 0 改为 500000
            block.timestamp + REQUEST_TIMEOUT,  // ✅ 合理的超时时间
            false
        );
        
        // ✅ 新增：记录请求映射
        requestIdToGameId[requestId] = gameId;
        game.decryptRequestId = requestId;
        game.status = GameStatus.DECRYPTING;
        
        decryptionRequests[requestId] = DecryptionRequest({
            gameId: gameId,
            requester: msg.sender,
            timestamp: block.timestamp,
            retryCount: 0,
            processed: false,
            exists: true
        });
        
        gameToRequestId[gameId] = requestId;
        
        emit DecryptionRequested(requestId, gameId, block.timestamp, msg.sender);
    }
    
    // ==================== Gateway 回调 ====================
    /**
     * @notice Gateway 回调函数（增强验证）
     * @dev 只有 Gateway 可以调用此函数
     */
    function callbackEndGame(
        uint256 requestId,
        uint256[] memory decryptedData
    ) public onlyGateway {
        DecryptionRequest storage request = decryptionRequests[requestId];
        
        // ✅ 新增：完整的验证
        require(request.exists, "Invalid request ID");
        require(!request.processed, "Request already processed");
        require(
            block.timestamp <= request.timestamp + REQUEST_TIMEOUT,
            "Request expired"
        );
        
        uint256 gameId = request.gameId;
        Game storage game = games[gameId];
        
        require(game.status == GameStatus.DECRYPTING, "Not decrypting");
        require(decryptedData.length == game.players.length + 1, "Invalid data length");
        
        // 解析解密后的数据
        uint32 target = uint32(decryptedData[0]);
        game.revealedTarget = target;
        
        // 明文计算获胜者
        address bestPlayer = game.players[0];
        uint32 bestGuess = uint32(decryptedData[1]);
        game.revealedGuesses[bestPlayer] = bestGuess;
        uint32 bestDiff = _abs(int32(bestGuess) - int32(target));
        
        for (uint256 i = 1; i < game.players.length; i++) {
            address player = game.players[i];
            uint32 guess = uint32(decryptedData[i + 1]);
            game.revealedGuesses[player] = guess;
            
            uint32 diff = _abs(int32(guess) - int32(target));
            if (diff < bestDiff) {
                bestDiff = diff;
                bestPlayer = player;
            }
        }
        
        game.winner = bestPlayer;
        game.status = GameStatus.ENDED;
        
        // 标记已处理
        request.processed = true;
        
        // 转账给获胜者
        payable(bestPlayer).transfer(game.prizePool);
        
        emit DecryptionCompleted(requestId, gameId, target, bestPlayer);
        emit GameEnded(gameId, bestPlayer, game.prizePool, target, block.timestamp);
    }
    
    // ==================== 重试机制 ====================
    /**
     * @notice 重试解密（如果首次失败）
     */
    function retryDecryption(uint256 gameId) external returns (uint256 newRequestId) {
        Game storage game = games[gameId];
        uint256 oldRequestId = game.decryptRequestId;
        DecryptionRequest storage request = decryptionRequests[oldRequestId];
        
        // 验证可以重试
        require(game.status == GameStatus.DECRYPTING, "Game not decrypting");
        require(!request.processed, "Request already processed");
        require(request.retryCount < MAX_RETRIES, "Max retries exceeded");
        require(
            block.timestamp > request.timestamp + 5 minutes,
            "Too soon to retry"
        );
        
        // 增加重试计数
        request.retryCount++;
        
        // 重新提交解密请求
        uint256[] memory cts = new uint256[](game.players.length + 1);
        cts[0] = Gateway.toUint256(game.encryptedTarget);
        for (uint256 i = 0; i < game.players.length; i++) {
            cts[i + 1] = Gateway.toUint256(game.encryptedGuesses[game.players[i]]);
        }
        
        newRequestId = Gateway.requestDecryption(
            cts,
            this.callbackEndGame.selector,
            CALLBACK_GAS_LIMIT,
            block.timestamp + REQUEST_TIMEOUT,
            false
        );
        
        // 创建新的请求记录
        requestIdToGameId[newRequestId] = gameId;
        game.decryptRequestId = newRequestId;
        
        decryptionRequests[newRequestId] = DecryptionRequest({
            gameId: gameId,
            requester: msg.sender,
            timestamp: block.timestamp,
            retryCount: request.retryCount,
            processed: false,
            exists: true
        });
        
        gameToRequestId[gameId] = newRequestId;
        
        emit DecryptionRetrying(gameId, oldRequestId, newRequestId, request.retryCount);
        emit DecryptionRequested(newRequestId, gameId, block.timestamp, msg.sender);
        
        return newRequestId;
    }
    
    // ==================== 超时处理 ====================
    /**
     * @notice 取消过期的游戏并退款
     */
    function cancelExpiredGame(uint256 gameId) external {
        Game storage game = games[gameId];
        
        require(
            game.status == GameStatus.DECRYPTING,
            "Game not decrypting"
        );
        
        require(
            block.timestamp > game.expiresAt + REQUEST_TIMEOUT,
            "Not expired yet"
        );
        
        // 退款给所有参与者
        payable(game.owner).transfer(game.entryFee);
        for (uint256 i = 0; i < game.players.length; i++) {
            payable(game.players[i]).transfer(game.entryFee);
        }
        
        game.status = GameStatus.EXPIRED;
        emit GameExpired(gameId, block.timestamp);
    }
    
    // ==================== 应急处理 ====================
    /**
     * @notice 管理员应急解锁（仅在极端情况下）
     */
    function emergencyResolve(
        uint256 gameId,
        uint32 target,
        uint32[] calldata guesses
    ) external onlyOwner {
        Game storage game = games[gameId];
        
        require(game.status == GameStatus.DECRYPTING, "Invalid state");
        require(
            block.timestamp > game.expiresAt + 1 days,
            "Too early for emergency"
        );
        require(guesses.length == game.players.length, "Invalid guesses length");
        
        game.revealedTarget = target;
        
        // 手动设置猜测并计算获胜者
        address bestPlayer = game.players[0];
        uint32 bestDiff = _abs(int32(guesses[0]) - int32(target));
        game.revealedGuesses[bestPlayer] = guesses[0];
        
        for (uint256 i = 1; i < game.players.length; i++) {
            address player = game.players[i];
            game.revealedGuesses[player] = guesses[i];
            
            uint32 diff = _abs(int32(guesses[i]) - int32(target));
            if (diff < bestDiff) {
                bestDiff = diff;
                bestPlayer = player;
            }
        }
        
        game.winner = bestPlayer;
        game.status = GameStatus.ENDED;
        
        // 转账给获胜者
        payable(bestPlayer).transfer(game.prizePool);
        
        emit EmergencyResolved(gameId, msg.sender, bestPlayer);
        emit GameEnded(gameId, bestPlayer, game.prizePool, target, block.timestamp);
    }
    
    // ==================== 内部辅助函数 ====================
    
    /**
     * @notice 计算加密数值的绝对值差
     */
    function _encryptedAbsDiff(euint32 a, euint32 b) private returns (euint32) {
        ebool isLess = TFHE.lt(a, b);
        euint32 diff1 = TFHE.sub(b, a);
        euint32 diff2 = TFHE.sub(a, b);
        euint32 absDiff = TFHE.select(isLess, diff1, diff2);
        return absDiff;
    }
    
    /**
     * @notice 计算绝对值（明文）
     */
    function _abs(int32 x) private pure returns (uint32) {
        return x >= 0 ? uint32(x) : uint32(-x);
    }
    
    // ==================== 查询函数 ====================
    
    /**
     * @notice 获取游戏信息
     */
    function getGameInfo(uint256 gameId) external view returns (
        uint256 id,
        address owner,
        uint256 entryFee,
        uint256 prizePool,
        uint256 playerCount,
        GameStatus status,
        address winner,
        uint32 revealedTarget,
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
     * @notice 获取解密状态
     */
    function getDecryptionStatus(uint256 gameId) 
        external 
        view 
        returns (
            uint256 requestId,
            uint256 timestamp,
            uint8 retryCount,
            bool processed,
            GameStatus status
        ) 
    {
        requestId = gameToRequestId[gameId];
        DecryptionRequest memory request = decryptionRequests[requestId];
        
        return (
            requestId,
            request.timestamp,
            request.retryCount,
            request.processed,
            games[gameId].status
        );
    }
    
    /**
     * @notice 获取所有玩家地址
     */
    function getPlayers(uint256 gameId) external view returns (address[] memory) {
        return games[gameId].players;
    }
    
    /**
     * @notice 获取玩家揭露后的猜测
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
}

