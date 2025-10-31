/**
 * Get list of games
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
    console.log('📋 Querying games list...');
    
    const { contract, rpcUrl } = await getContract();
    console.log(`✅ Connected to RPC: ${rpcUrl}`);
    
    const total = await contract.getTotalGames();
    const totalNum = Number(total);
    console.log(`   Total games: ${totalNum}`);
    
    if (totalNum === 0) {
      return successResponse({ games: [] });
    }
    
    // Get recent 20 games
    const limit = Math.min(20, totalNum);
    const start = Math.max(1, totalNum - limit + 1);
    
    const games = [];
    for (let i = totalNum; i >= start; i--) {
      try {
        const info = await contract.getGameInfo(i);
        games.push({
          id: Number(info[0]),
          target: Number(info[1]),
          owner: info[2],
          entryFee: info[3].toString(),
          prizePool: info[4].toString(),
          playerCount: Number(info[5]),
          status: Number(info[6]),
          winner: info[7],
          createdAt: Number(info[8])
        });
      } catch (err) {
        console.warn(`   ⚠️ Game #${i} query failed, skipping`);
      }
    }
    
    console.log(`✅ Successfully loaded ${games.length} games`);
    
    return successResponse({ games });
  } catch (error) {
    console.error('❌ Error querying games list:', error);
    return errorResponse(error.message);
  }
};


