/**
 * Get game information by ID
 */

const { getContract, successResponse, errorResponse } = require('./shared/config');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Get game ID from path parameter
    const pathParts = event.path.split('/');
    const gameId = pathParts[pathParts.length - 1];
    
    if (!gameId || isNaN(gameId)) {
      return errorResponse('Invalid game ID', 400);
    }

    console.log(`🔍 Querying game #${gameId}...`);
    
    const { contract, rpcUrl } = await getContract();
    console.log(`✅ Connected to RPC: ${rpcUrl}`);
    
    const info = await contract.getGameInfo(parseInt(gameId));
    
    const gameInfo = {
      id: Number(info[0]),
      target: Number(info[1]),
      owner: info[2],
      entryFee: info[3].toString(),
      prizePool: info[4].toString(),
      playerCount: Number(info[5]),
      status: Number(info[6]),
      winner: info[7],
      createdAt: Number(info[8])
    };
    
    console.log(`✅ Game #${gameId} queried successfully`);
    
    return successResponse({ game: gameInfo });
  } catch (error) {
    console.error(`❌ Error querying game:`, error);
    return errorResponse(error.message);
  }
};


