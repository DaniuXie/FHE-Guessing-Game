# 🚀 Deployment Guide

Complete guide for deploying the FHE Guessing Game to production.

## 📋 Prerequisites

- [ ] Node.js 18+ installed
- [ ] Hardhat configured
- [ ] Sepolia ETH in deployer wallet
- [ ] GitHub account (for code hosting)
- [ ] (Optional) Custom domain for frontend

## 🔧 Pre-Deployment Checklist

### 1. Environment Setup

Create `.env` file:

```bash
# Deployer private key (NEVER commit this!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# RPC endpoints
SEPOLIA_RPC_URL=https://eth-sepolia.public.blastapi.io
ALCHEMY_KEY=your_alchemy_key_here

# Contract addresses (will be filled after deployment)
FHE_CONTRACT_ADDRESS=
PLAINTEXT_CONTRACT_ADDRESS=

# Frontend config
VITE_FHE_CONTRACT_ADDRESS=
VITE_PLAINTEXT_CONTRACT_ADDRESS=
VITE_NETWORK_ID=11155111
```

### 2. Update Package Information

Edit `package.json`:

```json
{
  "name": "fhe-guessing-game",
  "version": "1.0.0",
  "description": "Confidential Number Guessing Game powered by Zama FHEVM",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/fhe-guessing-game"
  },
  "keywords": ["fhe", "zama", "blockchain", "privacy", "ethereum"]
}
```

## 📦 Smart Contract Deployment

### Step 1: Compile Contracts

```bash
# Clean previous builds
npx hardhat clean

# Compile contracts
npx hardhat compile

# Verify compilation
ls -la artifacts/contracts/
```

### Step 2: Deploy FHE Contract

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy_fhe_v2.js --network sepolia

# Save the contract address from output
# Example: Contract deployed to: 0x1234...
```

### Step 3: Deploy Plaintext Contract (Optional)

```bash
npx hardhat run scripts/deploy_simple.js --network sepolia
```

### Step 4: Verify Contracts on Etherscan

```bash
# Install verification plugin
npm install --save-dev @nomiclabs/hardhat-etherscan

# Verify FHE contract
npx hardhat verify --network sepolia YOUR_CONTRACT_ADDRESS

# Verify Plaintext contract
npx hardhat verify --network sepolia YOUR_PLAINTEXT_CONTRACT_ADDRESS
```

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**:
```bash
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: `Vite`
     - Build Command: `cd frontend && npm run build`
     - Output Directory: `frontend/dist`
     - Install Command: `npm install && cd frontend && npm install`

3. **Add Environment Variables** in Vercel:
   ```
   VITE_FHE_CONTRACT_ADDRESS=0x...
   VITE_PLAINTEXT_CONTRACT_ADDRESS=0x...
   VITE_NETWORK_ID=11155111
   ```

4. **Deploy**: Click "Deploy" button

### Option 2: Netlify

1. **Build Locally**:
```bash
cd frontend
npm run build
```

2. **Deploy**:
   - Drag and drop `frontend/dist` folder to [netlify.com/drop](https://app.netlify.com/drop)
   - Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=frontend/dist
```

### Option 3: GitHub Pages

1. **Update `vite.config.ts`**:
```typescript
export default defineConfig({
  base: '/fhe-guessing-game/', // Your repo name
  // ... rest of config
})
```

2. **Build and Deploy**:
```bash
cd frontend
npm run build
npx gh-pages -d dist
```

### Option 4: IPFS (Decentralized)

```bash
# Install IPFS Desktop or use Pinata/Infura

# Build frontend
cd frontend && npm run build

# Upload dist folder to IPFS
# Get IPFS hash (e.g., Qm...)
```

## 🔍 Post-Deployment Verification

### 1. Contract Verification

```bash
# Check contract on Sepolia Etherscan
open https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

# Verify contract is verified (green checkmark)
# Check recent transactions
```

### 2. Frontend Testing

Test all features:

- [ ] Connect wallet (MetaMask)
- [ ] Switch to Sepolia network
- [ ] Create a game
- [ ] Join a game
- [ ] End a game
- [ ] View game history
- [ ] Check mobile responsiveness
- [ ] Test error handling

### 3. Performance Check

```bash
# Run Lighthouse audit
# Chrome DevTools > Lighthouse > Generate Report

# Target scores:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >90
# - SEO: >90
```

## 📊 Monitoring

### Contract Events

Monitor on-chain events:

```javascript
// Listen for GameCreated events
contract.on("GameCreated", (gameId, creator, entryFee) => {
  console.log(`New game created: #${gameId}`);
});
```

### Analytics

Add analytics (optional):

```javascript
// Google Analytics, Mixpanel, etc.
import ReactGA from 'react-ga4';

ReactGA.initialize('YOUR_GA_TRACKING_ID');
```

## 🔄 Updates and Maintenance

### Contract Updates

**Note**: Smart contracts are immutable. For updates:

1. Deploy new contract version
2. Update frontend to use new address
3. Keep old contract for historical data

### Frontend Updates

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Automatic deployment (Vercel/Netlify)
# Manual: rebuild and redeploy
```

## 🛡️ Security Considerations

### Before Going Live

- [ ] Audit smart contracts
- [ ] Test with small amounts first
- [ ] Set up monitoring alerts
- [ ] Have emergency pause mechanism
- [ ] Backup private keys securely
- [ ] Document recovery procedures

### Ongoing

- [ ] Monitor for unusual activity
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Bug bounty program (optional)

## 📞 Support

If deployment issues occur:

1. Check logs (Vercel/Netlify dashboard)
2. Verify environment variables
3. Test locally first: `npm run build && npm run preview`
4. Check network connectivity
5. Review Hardhat errors

## 🎉 Launch Checklist

- [ ] Smart contracts deployed and verified
- [ ] Frontend deployed and accessible
- [ ] All features tested
- [ ] Documentation updated
- [ ] README.md complete
- [ ] Social media ready
- [ ] Community notified
- [ ] Monitoring in place

---

**Congratulations on your deployment! 🚀**

Share your dApp with the Zama community:
- [Zama Discord](https://discord.fhe.org)
- [Twitter](https://twitter.com/zama_fhe)
- [Reddit](https://reddit.com/r/ethereum)













