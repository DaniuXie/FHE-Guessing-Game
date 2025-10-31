/**
 * Health check endpoint
 */

const { CONTRACT_ADDRESS, successResponse, errorResponse } = require('./shared/config');

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
    return successResponse({
      message: 'API is running',
      contract: CONTRACT_ADDRESS,
      network: 'sepolia',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return errorResponse(error.message);
  }
};


