// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GuessGameSimple
 * @notice Simplified number guessing game (Plaintext version)
 * @dev Does not use FHE encryption, all data is stored in plaintext
 */
contract GuessGameSimple {
    enum GameStatus { ACTIVE, ENDED }
    
    struct Game {
        uint256 gameId;
        uint32 targetNumber;      // Plaintext storage of target number
        address owner;
        uint256 entryFee;
        uint256 prizePool;
        address[] players;
        mapping(address => uint32) guesses;  // Plaintext storage of guesses
        mapping(address => bool) hasGuessed;
        GameStatus status;
        address winner;
        uint256 createdAt;
    }
    
    mapping(uint256 => Game) public games;
    uint256 public gameCounter;
    
    event GameCreated(uint256 indexed gameId, address indexed owner, uint256 entryFee, uint256 timestamp);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 prizePool, uint256 timestamp);
    event GameEnded(uint256 indexed gameId, address indexed winner, uint256 prize, uint256 timestamp);
    
    /**
     * @notice 创建新游戏
     * @param targetNumber 目标数字（1-100）
     * @param entryFee 入场费（wei）
     */
    function createGame(
        uint32 targetNumber,
        uint256 entryFee
    ) external payable returns (uint256) {
        require(targetNumber >= 1 && targetNumber <= 100, "Target must be 1-100");
        require(entryFee > 0, "Entry fee must be greater than 0");
        require(msg.value == entryFee, "Incorrect entry fee");
        
        gameCounter++;
        uint256 newGameId = gameCounter;
        
        Game storage newGame = games[newGameId];
        newGame.gameId = newGameId;
        newGame.targetNumber = targetNumber;
        newGame.owner = msg.sender;
        newGame.entryFee = entryFee;
        newGame.prizePool = msg.value;
        newGame.status = GameStatus.ACTIVE;
        newGame.createdAt = block.timestamp;
        
        emit GameCreated(newGameId, msg.sender, entryFee, block.timestamp);
        
        return newGameId;
    }
    
    /**
     * @notice 加入游戏并提交猜测
     * @param gameId 游戏ID
     * @param guess 猜测的数字（1-100）
     */
    function joinGame(
        uint256 gameId,
        uint32 guess
    ) external payable {
        Game storage game = games[gameId];
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(!game.hasGuessed[msg.sender], "Already guessed");
        require(msg.value == game.entryFee, "Incorrect entry fee");
        require(msg.sender != game.owner, "Owner cannot join");
        require(guess >= 1 && guess <= 100, "Guess must be 1-100");
        
        game.guesses[msg.sender] = guess;
        game.hasGuessed[msg.sender] = true;
        game.players.push(msg.sender);
        game.prizePool += msg.value;
        
        emit PlayerJoined(gameId, msg.sender, game.prizePool, block.timestamp);
    }
    
    /**
     * @notice 结束游戏并自动计算获胜者
     * @param gameId 游戏ID
     * @dev 找出猜测最接近目标数字的玩家
     */
    function endGame(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.owner == msg.sender, "Only owner can end");
        require(game.status == GameStatus.ACTIVE, "Game not active");
        require(game.players.length > 0, "No players");
        
        // 自动找出最接近的玩家
        address bestPlayer = game.players[0];
        uint32 bestDiff = _abs(int32(game.guesses[bestPlayer]) - int32(game.targetNumber));
        
        for (uint256 i = 1; i < game.players.length; i++) {
            address player = game.players[i];
            uint32 diff = _abs(int32(game.guesses[player]) - int32(game.targetNumber));
            if (diff < bestDiff) {
                bestDiff = diff;
                bestPlayer = player;
            }
        }
        
        game.winner = bestPlayer;
        game.status = GameStatus.ENDED;
        
        // 转账给获胜者
        payable(bestPlayer).transfer(game.prizePool);
        
        emit GameEnded(gameId, bestPlayer, game.prizePool, block.timestamp);
    }
    
    /**
     * @notice 计算绝对值
     */
    function _abs(int32 x) private pure returns (uint32) {
        return x >= 0 ? uint32(x) : uint32(-x);
    }
    
    /**
     * @notice 获取游戏信息
     */
    function getGameInfo(uint256 gameId) external view returns (
        uint256 id,
        uint32 target,
        address owner,
        uint256 entryFee,
        uint256 prizePool,
        uint256 playerCount,
        GameStatus status,
        address winner,
        uint256 createdAt
    ) {
        Game storage game = games[gameId];
        return (
            game.gameId,
            game.targetNumber,
            game.owner,
            game.entryFee,
            game.prizePool,
            game.players.length,
            game.status,
            game.winner,
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
     * @notice 获取玩家的猜测
     */
    function getPlayerGuess(uint256 gameId, address player) external view returns (uint32) {
        return games[gameId].guesses[player];
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
