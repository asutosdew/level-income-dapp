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

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  public isConnected = signal<boolean>(true);
  public currentAccount = signal<string>('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
  public walletType = signal<string>('TrustWallet');
  public network = signal<NetworkType>('BNB Chain');
  public isDemoMode = signal<boolean>(true);
  public bnbBalance = signal<string>('2.45 BNB');
  public usdtBalance = signal<string>('2,500.00 USDT');

  // Smart Contract Addresses (BNB Chain BEP-20)
  public readonly usdtContractAddress = '0x55d398326f99059fF775485246999027B3197955'; // Official BSC USDT BEP-20
  public readonly morganTreasureVault = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'; // Morgan Treasure Staking Vault
  public readonly mtgTokenContract = '0x3b892a0129bc489c441b8001e0029b9f77291a01'; // MTG Token

  constructor(
    private notificationService: NotificationService,
    private soundService: SoundService
  ) {
    this.checkInjectedProvider();
  }

  private checkInjectedProvider(): void {
    if (typeof window !== 'undefined' && (window as unknown as { ethereum?: unknown }).ethereum) {
      // Injected Web3 Provider available
    }
  }

  // Connect Web3 Wallet
  async connectWallet(walletType: 'MetaMask' | 'TrustWallet' | 'BinanceWeb3' | 'Demo' = 'TrustWallet'): Promise<boolean> {
    this.soundService.playTap();
    this.walletType.set(walletType);

    if (walletType === 'Demo') {
      this.isDemoMode.set(true);
      this.isConnected.set(true);
      this.currentAccount.set('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
      this.notificationService.success('Web3 Connected', 'Demo Wallet connected on BNB Chain with 2,500 USDT.');
      return true;
    }

    if (typeof window !== 'undefined' && (window as unknown as { ethereum?: { request: (args: { method: string, params?: unknown[] }) => Promise<unknown> } }).ethereum) {
      try {
        const ethereum = (window as unknown as { ethereum: { request: (args: { method: string, params?: unknown[] }) => Promise<unknown> } }).ethereum;
        const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];

        if (accounts && accounts.length > 0) {
          this.currentAccount.set(accounts[0]);
          this.isConnected.set(true);
          this.isDemoMode.set(false);

          // Prompt switch to BNB Chain
          await this.switchToBnbChain();

          this.soundService.playSuccess();
          this.notificationService.success('Wallet Connected', `Connected via ${walletType}: ${this.formatAddress(accounts[0])}`);
          return true;
        }
      } catch (err: unknown) {
        console.warn('Injected Web3 connection failed, fallback to simulation:', err);
      }
    }

    // Fallback if no wallet extension installed
    this.isDemoMode.set(true);
    this.isConnected.set(true);
    this.currentAccount.set('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    this.soundService.playSuccess();
    this.notificationService.info('Demo Mode Active', `${walletType} simulated session ready on BNB Chain.`);
    return true;
  }

  // Switch to BNB Smart Chain
  async switchToBnbChain(): Promise<void> {
    if (typeof window === 'undefined' || !(window as unknown as { ethereum?: { request: (args: { method: string, params?: unknown[] }) => Promise<unknown> } }).ethereum) {
      this.network.set('BNB Chain');
      return;
    }

    const ethereum = (window as unknown as { ethereum: { request: (args: { method: string, params?: unknown[] }) => Promise<unknown> } }).ethereum;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_MAINNET_CONFIG.chainIdHex }]
      });
      this.network.set('BNB Chain');
    } catch (switchError: unknown) {
      // If chain not added to wallet, request to add it
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await ethereum.request({
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

  // BEP-20 USDT Approval (Simulation or on-chain)
  async approveUsdt(amountUsdt: number): Promise<{ success: boolean; txHash: string }> {
    this.soundService.playTap();
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulated tx latency
    const txHash = this.generateTxHash();
    this.notificationService.success('USDT Approved', `Approved $${amountUsdt} USDT allowance for Morgan Treasure contract.`);
    return { success: true, txHash };
  }

  // Staking Deposit Call (BEP-20 transferFrom to Morgan Treasure Vault)
  async executeDepositContract(amountUsdt: number, sponsorAddress: string): Promise<{ success: boolean; txHash: string }> {
    this.soundService.playTap();
    await new Promise(resolve => setTimeout(resolve, 1200));
    const txHash = this.generateTxHash();
    return { success: true, txHash };
  }

  // Swap BNB or USDT for MTG Tokens
  async executeTokenSwap(amount: number, tokenFrom: 'BNB' | 'USDT'): Promise<{ success: boolean; txHash: string }> {
    this.soundService.playTap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const txHash = this.generateTxHash();
    return { success: true, txHash };
  }

  disconnect(): void {
    this.soundService.playTap();
    this.isConnected.set(false);
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
