import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Web3Service } from '../services/web3.service';
import { DappStateService } from '../services/dapp-state.service';
import { NotificationService } from '../services/notification.service';

/**
 * Morgan Treasure - Production Authentication & Registration Guard
 * Restricts access to protocol dashboards, staking, income, team, and withdrawal pages
 * unless the wallet is actively connected AND registered in the MariaDB database.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const web3Service = inject(Web3Service);
  const dappState = inject(DappStateService);
  const router = inject(Router);
  const notifications = inject(NotificationService);

  // 1. Check if Web3 wallet is connected
  if (!web3Service.isConnected() || !web3Service.currentAccount()) {
    notifications.info(
      'Wallet Required',
      'Please connect your BEP-20 Web3 wallet to access Morgan Treasure.'
    );
    return router.createUrlTree(['/connect']);
  }

  // 2. Check if user is registered in MariaDB
  if (!dappState.user().isRegistered) {
    notifications.warning(
      'Registration Required',
      'This wallet is not yet registered. Please register with a verified Sponsor ID.'
    );
    return router.createUrlTree(['/connect']);
  }

  return true;
};
