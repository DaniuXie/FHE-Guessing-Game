require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { MNEMONIC, ALCHEMY_KEY, PRIVATE_KEY } = process.env;

// 确保至少有一种认证方式
let accounts;
if (MNEMONIC) {
  accounts = {
    mnemonic: MNEMONIC,
    path: "m/44'/60'/0'/0",
    initialIndex: 0,
    count: 10,
  };
} else if (PRIVATE_KEY) {
  accounts = [PRIVATE_KEY];
} else {
  console.warn("⚠️ Warning: No MNEMONIC or PRIVATE_KEY found in .env file");
  accounts = [];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",  // 用于 FHE 合约
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.20",  // 用于旧合约
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      }
    ]
  },
  
  networks: {
    // Sepolia 测试网 (使用 fhEVM Coprocessor)
    sepolia: {
      url: ALCHEMY_KEY 
        ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
        : "https://eth-sepolia.public.blastapi.io",  // 更稳定的公共RPC
      chainId: 11155111,
      accounts: accounts,
      gasPrice: "auto",
      gas: "auto",
    },
    
    // 本地开发网络
    hardhat: {
      chainId: 31337,
      forking: ALCHEMY_KEY ? {
        url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
        enabled: false,
      } : undefined,
    },
    
    // Localhost
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  mocha: {
    timeout: 120000, // 2分钟超时（Gateway回调可能需要时间）
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
  },
};

