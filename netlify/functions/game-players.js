const ethers = require("ethers");
const config = require("./shared/config");

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { gameId } = event.queryStringParameters || {};

    if (!gameId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing gameId parameter" }),
      };
    }

    // Connect to Sepolia
    const provider = new ethers.JsonRpcProvider(config.RPC_URL);
    const contract = new ethers.Contract(
      config.CONTRACT_ADDRESS,
      config.CONTRACT_ABI,
      provider
    );

    // Get players
    const players = await contract.getPlayers(gameId);

    // Get each player's guess
    const playerGuesses = await Promise.all(
      players.map(async (playerAddress) => {
        const guess = await contract.getPlayerGuess(gameId, playerAddress);
        return {
          address: playerAddress,
          guess: Number(guess),
        };
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        gameId: Number(gameId),
        players: playerGuesses,
      }),
    };
  } catch (error) {
    console.error("Error fetching game players:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch game players",
        message: error.message,
      }),
    };
  }
};


