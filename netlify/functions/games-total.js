/**
 * Get total number of games
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
    console.log('📊 Querying total games...');
    
    const { contract, rpcUrl } = await getContract();
    console.log(`✅ Connected to RPC: ${rpcUrl}`);
    
    const total = await contract.getTotalGames();
    const totalNum = Number(total);
    
    console.log(`✅ Total games: ${totalNum}`);
    
    return successResponse({ total: totalNum });
  } catch (error) {
    console.error('❌ Error querying total games:', error);
    return errorResponse(error.message);
  }
};


