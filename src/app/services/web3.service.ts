import { Injectable, signal } from '@angular/core';
import { NetworkType } from '../models/dapp.models';
import { NotificationService } from './notification.service';
import { SoundService } from './sound.service';

export interface BnbChainConfig {
  chainIdHex: string;
  chainIdDec: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const BSC_MAINNET_CONFIG: BnbChainConfig = {
  chainIdHex: '0x38',
  chainIdDec: 56,
  chainName: 'BNB Smart Chain Mainnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18
  },
  rpcUrls: ['https://bsc-dataseed.binance.org/', 'https://bsc-dataseed1.defibit.io/'],
  blockExplorerUrls: ['https://bscscan.com']
};

export const BSC_TESTNET_CONFIG: BnbChainConfig = {
  chainIdHex: '0x61',
  chainIdDec: 97,
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com']
};

export type SupportedWallet = 'TrustWallet' | 'MetaMask' | 'TokenPocket' | 'Bitget' | 'BinanceWeb3';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  public isConnected = signal<boolean>(false);
  public currentAccount = signal<string>('');
  public walletType = signal<string>('');
  public network = signal<NetworkType>('BNB Chain');
  public bnbBalance = signal<string>('0.00 BNB');
  public usdtBalance = signal<string>('0.00 USDT');

  // Smart Contract Addresses (BNB Chain BEP-20)
  public readonly usdtContractAddress = '0x55d398326f99059fF775485246999027B3197955'; // Official BSC USDT BEP-20
  public readonly morganTreasureVault = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'; // Morgan Treasure Staking Vault
  public readonly mtgTokenContract = '0x3b892a0129bc489c441b8001e0029b9f77291a01'; // MTG Token

  constructor(
    private notificationService: NotificationService,
    private soundService: SoundService
  ) {
    this.restorePreviousSession();
  }

  // Restore session silently if user was already connected
  private async restorePreviousSession(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const wasConnected = localStorage.getItem('mt_wallet_connected') === 'true';
      const savedWallet = localStorage.getItem('mt_wallet_type') as SupportedWallet;

      if (wasConnected && savedWallet) {
        const provider = this.getWalletProvider(savedWallet);
        if (provider) {
          const accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
          if (accounts && accounts.length > 0) {
            this.currentAccount.set(accounts[0].toLowerCase());
            this.walletType.set(savedWallet);
            this.isConnected.set(true);
            await this.refreshBalances();
          }
        }
      }
    } catch (err) {
      console.warn('Session restore check error:', err);
    }
  }

  // Detect specific or standard injected provider
  private getWalletProvider(type: SupportedWallet): any {
    if (typeof window === 'undefined') return null;
    const win = window as any;

    if (type === 'Bitget') {
      return win.bitkeep?.ethereum || (win.ethereum?.isBitKeep ? win.ethereum : null) || win.ethereum;
    }

    if (type === 'TokenPocket') {
      return (win.ethereum?.isTokenPocket ? win.ethereum : null) || win.tokenpocket?.ethereum || win.ethereum;
    }

    if (type === 'TrustWallet') {
      return (win.ethereum?.isTrust ? win.ethereum : null) || win.trustwallet || win.ethereum;
    }

    if (type === 'MetaMask') {
      return (win.ethereum?.isMetaMask ? win.ethereum : null) || win.ethereum;
    }

    if (type === 'BinanceWeb3') {
      return (win.ethereum?.isBinance ? win.ethereum : null) || win.BinanceChain || win.ethereum;
    }

    return win.ethereum || null;
  }

  // Connect Web3 Wallet
  async connectWallet(walletType: SupportedWallet = 'TrustWallet'): Promise<boolean> {
    this.soundService.playTap();
    this.walletType.set(walletType);

    const provider = this.getWalletProvider(walletType);

    if (!provider) {
      const walletNames: Record<SupportedWallet, string> = {
        TrustWallet: 'Trust Wallet',
        MetaMask: 'MetaMask',
        TokenPocket: 'TokenPocket',
        Bitget: 'Bitget Wallet',
        BinanceWeb3: 'Binance Web3 Wallet'
      };

      this.notificationService.error(
        'Wallet Not Detected',
        `Please open this DApp inside ${walletNames[walletType]} browser or install the browser extension.`
      );
      return false;
    }

    try {
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];

      if (accounts && accounts.length > 0) {
        const address = accounts[0].toLowerCase();
        this.currentAccount.set(address);
        this.isConnected.set(true);
        this.walletType.set(walletType);

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('mt_wallet_connected', 'true');
          localStorage.setItem('mt_wallet_type', walletType);
        }

        // Prompt switch to BNB Smart Chain
        await this.switchToBnbChain(provider);

        // Fetch balances
        await this.refreshBalances();

        this.soundService.playSuccess();
        this.notificationService.success(
          'Wallet Connected',
          `Connected via ${walletType}: ${this.formatAddress(address)}`
        );

        // Listen for account/chain changes
        if (provider.on) {
          provider.on('accountsChanged', (newAccounts: string[]) => {
            if (newAccounts && newAccounts.length > 0) {
              this.currentAccount.set(newAccounts[0].toLowerCase());
              this.refreshBalances();
            } else {
              this.disconnect();
            }
          });

          provider.on('chainChanged', () => {
            window.location.reload();
          });
        }

        return true;
      }
    } catch (err: any) {
      console.warn('Injected Web3 connection error:', err);
      if (err?.code === 4001) {
        this.notificationService.warning('Connection Cancelled', 'User rejected the connection request.');
      } else {
        this.notificationService.error('Connection Error', err?.message || 'Failed to connect wallet.');
      }
      return false;
    }

    return false;
  }

  // Switch to BNB Smart Chain
  async switchToBnbChain(provider?: any): Promise<void> {
    const eth = provider || (typeof window !== 'undefined' ? (window as any).ethereum : null);
    if (!eth || !eth.request) {
      this.network.set('BNB Chain');
      return;
    }

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_MAINNET_CONFIG.chainIdHex }]
      });
      this.network.set('BNB Chain');
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BSC_MAINNET_CONFIG.chainIdHex,
                chainName: BSC_MAINNET_CONFIG.chainName,
                nativeCurrency: BSC_MAINNET_CONFIG.nativeCurrency,
                rpcUrls: BSC_MAINNET_CONFIG.rpcUrls,
                blockExplorerUrls: BSC_MAINNET_CONFIG.blockExplorerUrls
              }
            ]
          });
          this.network.set('BNB Chain');
        } catch (addError) {
          console.error('Failed to add BNB Chain to wallet:', addError);
        }
      }
    }
  }

  // Refresh native BNB and USDT balance from chain
  async refreshBalances(): Promise<void> {
    const account = this.currentAccount();
    if (!account || typeof window === 'undefined') return;

    const provider = (window as any).ethereum;
    if (!provider || !provider.request) return;

    try {
      // 1. Get Native BNB Balance
      const bnbHex = await provider.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      });
      if (bnbHex) {
        const bnbWei = BigInt(bnbHex);
        const bnbFormatted = (Number(bnbWei) / 1e18).toFixed(4);
        this.bnbBalance.set(`${bnbFormatted} BNB`);
      }

      // 2. Query BEP-20 USDT Balance: balanceOf(address) -> selector 0x70a08231
      const cleanAddr = account.replace(/^0x/, '').padStart(64, '0');
      const data = '0x70a08231' + cleanAddr;

      const usdtHex = await provider.request({
        method: 'eth_call',
        params: [
          {
            to: this.usdtContractAddress,
            data: data
          },
          'latest'
        ]
      });

      if (usdtHex && usdtHex !== '0x') {
        const usdtUnits = BigInt(usdtHex);
        const usdtFormatted = (Number(usdtUnits) / 1e18).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        this.usdtBalance.set(`${usdtFormatted} USDT`);
      }
    } catch (err) {
      console.warn('Failed to fetch on-chain balances:', err);
    }
  }

  // Get numeric balances for calculations
  getNumericUsdtBalance(): number {
    const raw = this.usdtBalance().replace(/[^0-9.]/g, '');
    return parseFloat(raw) || 0;
  }

  getNumericBnbBalance(): number {
    const raw = this.bnbBalance().replace(/[^0-9.]/g, '');
    return parseFloat(raw) || 0;
  }

  // Wait for on-chain receipt confirmation on BNB Chain
  async waitForTransactionReceipt(txHash: string, provider: any, maxWaitMs = 25000): Promise<any> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });
        if (receipt && receipt.blockNumber) {
          return receipt;
        }
      } catch (err) {
        // Continue polling
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    return null;
  }

  // BEP-20 USDT Approval (Real on-chain transaction)
  async approveUsdt(amountUsdt: number): Promise<{ success: boolean; txHash: string; error?: string }> {
    this.soundService.playTap();
    const account = this.currentAccount();
    const provider = (window as any).ethereum;

    if (!account || !provider) {
      this.notificationService.error('Wallet Required', 'Please connect your Web3 wallet first.');
      return { success: false, txHash: '', error: 'Wallet not connected' };
    }

    // Strict balance check before approval
    const currentUsdt = this.getNumericUsdtBalance();
    if (currentUsdt < amountUsdt) {
      this.notificationService.error(
        'Insufficient USDT Balance',
        `Your wallet balance is $${currentUsdt.toFixed(2)} USDT, but $${amountUsdt.toFixed(2)} USDT is required.`
      );
      return { success: false, txHash: '', error: 'Insufficient USDT balance' };
    }

    try {
      // approve(address spender, uint256 amount) -> selector 0x095ea7b3
      const spenderClean = this.morganTreasureVault.replace(/^0x/, '').toLowerCase().padStart(64, '0');
      const rawUnits = BigInt(Math.floor(amountUsdt * 1e6)) * BigInt(1e12); // 18 decimals
      const amountHex = rawUnits.toString(16).padStart(64, '0');
      const data = '0x095ea7b3' + spenderClean + amountHex;

      const txHash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to: this.usdtContractAddress,
            data: data
          }
        ]
      })) as string;

      this.notificationService.info('Approval Submitted', `Waiting for confirmation on BNB Chain: ${this.formatAddress(txHash)}`);
      
      const receipt = await this.waitForTransactionReceipt(txHash, provider);
      if (receipt && receipt.status === '0x0') {
        this.notificationService.error('Approval Reverted', 'USDT token approval reverted on BNB Chain.');
        return { success: false, txHash: '', error: 'Approval reverted' };
      }

      this.notificationService.success('USDT Approved', `Successfully approved $${amountUsdt} USDT.`);
      return { success: true, txHash };
    } catch (err: any) {
      if (err?.code === 4001) {
        this.notificationService.warning('Rejected', 'User cancelled or rejected USDT approval in wallet.');
      } else {
        this.notificationService.error('Approval Failed', err?.message || 'USDT approval failed on BNB Chain.');
      }
      return { success: false, txHash: '', error: err?.message || 'Approval failed' };
    }
  }

  // Staking Deposit Call (Real on-chain transaction)
  async executeDepositContract(amountUsdt: number, sponsorAddress: string): Promise<{ success: boolean; txHash: string; error?: string }> {
    this.soundService.playTap();
    const account = this.currentAccount();
    const provider = (window as any).ethereum;

    if (!account || !provider) {
      this.notificationService.error('Wallet Required', 'Please connect your Web3 wallet first.');
      return { success: false, txHash: '', error: 'Wallet not connected' };
    }

    // Strict on-chain USDT balance check
    const currentUsdt = this.getNumericUsdtBalance();
    if (currentUsdt < amountUsdt) {
      this.notificationService.error(
        'Insufficient USDT Balance',
        `Your wallet has $${currentUsdt.toFixed(2)} USDT, but you need at least $${amountUsdt.toFixed(2)} USDT to stake this package.`
      );
      return { success: false, txHash: '', error: 'Insufficient USDT' };
    }

    // Check BNB for gas
    const currentBnb = this.getNumericBnbBalance();
    if (currentBnb < 0.0004) {
      this.notificationService.error(
        'Insufficient BNB for Gas',
        'You need at least 0.0005 BNB in your wallet to pay for transaction gas on BNB Chain.'
      );
      return { success: false, txHash: '', error: 'Insufficient BNB for gas' };
    }

    try {
      // deposit(uint256 amount, address sponsor) -> selector 0x47e7ef24
      const rawUnits = BigInt(Math.floor(amountUsdt * 1e6)) * BigInt(1e12);
      const amountHex = rawUnits.toString(16).padStart(64, '0');
      const cleanSponsor = (sponsorAddress || '0x9b32fa99834190cbbde029104fa2841b994801ac')
        .replace(/^0x/, '')
        .toLowerCase()
        .padStart(64, '0');
      const data = '0x47e7ef24' + amountHex + cleanSponsor;

      const txHash = (await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to: this.morganTreasureVault,
            data: data
          }
        ]
      })) as string;

      this.notificationService.info('Staking Submitted', `Deposit submitted to BNB Chain: ${this.formatAddress(txHash)}`);

      // Wait for receipt confirmation
      const receipt = await this.waitForTransactionReceipt(txHash, provider);
      if (receipt && receipt.status === '0x0') {
        this.notificationService.error('Staking Reverted', 'The staking deposit transaction was reverted on BNB Chain.');
        return { success: false, txHash: '', error: 'Transaction reverted on-chain' };
      }

      await this.refreshBalances();
      return { success: true, txHash };
    } catch (err: any) {
      if (err?.code === 4001) {
        this.notificationService.warning('Rejected', 'User cancelled the deposit transaction in wallet.');
      } else {
        this.notificationService.error('Transaction Failed', err?.message || 'Deposit failed on BNB Chain.');
      }
      return { success: false, txHash: '', error: err?.message || 'Deposit failed' };
    }
  }

  // Swap BNB or USDT for MTG Tokens (Real on-chain transaction)
  async executeTokenSwap(amount: number, tokenFrom: 'BNB' | 'USDT'): Promise<{ success: boolean; txHash: string; error?: string }> {
    this.soundService.playTap();
    const account = this.currentAccount();
    const provider = (window as any).ethereum;

    if (!account || !provider) {
      this.notificationService.error('Wallet Required', 'Please connect your Web3 wallet first.');
      return { success: false, txHash: '', error: 'Wallet not connected' };
    }

    if (tokenFrom === 'BNB') {
      const currentBnb = this.getNumericBnbBalance();
      if (currentBnb < amount + 0.0005) {
        this.notificationService.error(
          'Insufficient BNB',
          `You need ${amount} BNB + gas, but your balance is ${currentBnb.toFixed(4)} BNB.`
        );
        return { success: false, txHash: '', error: 'Insufficient BNB' };
      }

      try {
        const rawWei = BigInt(Math.floor(amount * 1e18));
        const txHash = (await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: account,
              to: this.morganTreasureVault,
              value: '0x' + rawWei.toString(16)
            }
          ]
        })) as string;

        await this.waitForTransactionReceipt(txHash, provider);
        await this.refreshBalances();
        return { success: true, txHash };
      } catch (err: any) {
        if (err?.code === 4001) {
          this.notificationService.warning('Rejected', 'Token purchase cancelled in wallet.');
        } else {
          this.notificationService.error('Swap Failed', err?.message || 'BNB swap failed.');
        }
        return { success: false, txHash: '', error: err?.message };
      }
    } else {
      // USDT Swap
      const currentUsdt = this.getNumericUsdtBalance();
      if (currentUsdt < amount) {
        this.notificationService.error(
          'Insufficient USDT',
          `Your wallet has $${currentUsdt.toFixed(2)} USDT, but $${amount.toFixed(2)} USDT is needed.`
        );
        return { success: false, txHash: '', error: 'Insufficient USDT' };
      }

      const approveRes = await this.approveUsdt(amount);
      if (!approveRes.success) {
        return { success: false, txHash: '', error: 'USDT approval required' };
      }

      try {
        const rawUnits = BigInt(Math.floor(amount * 1e6)) * BigInt(1e12);
        const amountHex = rawUnits.toString(16).padStart(64, '0');
        const data = '0x47e7ef24' + amountHex + '0'.repeat(64); // swap call

        const txHash = (await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: account,
              to: this.morganTreasureVault,
              data: data
            }
          ]
        })) as string;

        await this.waitForTransactionReceipt(txHash, provider);
        await this.refreshBalances();
        return { success: true, txHash };
      } catch (err: any) {
        if (err?.code === 4001) {
          this.notificationService.warning('Rejected', 'USDT swap cancelled in wallet.');
        } else {
          this.notificationService.error('Swap Failed', err?.message || 'USDT swap failed.');
        }
        return { success: false, txHash: '', error: err?.message };
      }
    }
  }

  disconnect(): void {
    this.soundService.playTap();
    this.isConnected.set(false);
    this.currentAccount.set('');
    this.walletType.set('');
    this.bnbBalance.set('0.00 BNB');
    this.usdtBalance.set('0.00 USDT');

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('mt_wallet_connected');
      localStorage.removeItem('mt_wallet_type');
    }

    this.notificationService.info('Disconnected', 'Web3 session closed.');
  }

  switchNetwork(targetNetwork: NetworkType): void {
    this.soundService.playTap();
    this.network.set(targetNetwork);
    this.notificationService.success('Network Switched', `Active chain: ${targetNetwork}`);
  }

  formatAddress(addr: string): string {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }

  generateTxHash(): string {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  getExplorerUrl(txHash: string): string {
    if (this.network() === 'BSC Testnet') {
      return `https://testnet.bscscan.com/tx/${txHash}`;
    }
    return `https://bscscan.com/tx/${txHash}`;
  }
}
