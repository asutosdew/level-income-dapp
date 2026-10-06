import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { IncomeDetailComponent } from './pages/income-detail/income-detail.component';
import { DepositFundComponent } from './pages/deposit-fund/deposit-fund.component';
import { WithdrawOptionComponent } from './pages/withdraw-option/withdraw-option.component';
import { TeamComponent } from './pages/team/team.component';
import { SmartContractComponent } from './pages/smart-contract/smart-contract.component';
import { ConnectRegisterComponent } from './pages/connect-register/connect-register.component';
import { AdminComponent } from './pages/admin/admin.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public Bootstrap Gateway: Connect Wallet & Register with Sponsor ID
  { path: 'connect', component: ConnectRegisterComponent },

  // Executive Management Portal: Protocol Financial Status & Master Control
  { path: 'admin', component: AdminComponent },

  // Protected Protocol Pages: Require Connected Wallet & MariaDB Registered Account
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'deposit', component: DepositFundComponent, canActivate: [authGuard] },
  { path: 'income', component: IncomeDetailComponent, canActivate: [authGuard] },
  { path: 'team', component: TeamComponent, canActivate: [authGuard] },
  { path: 'withdraw', component: WithdrawOptionComponent, canActivate: [authGuard] },
  { path: 'contract', component: SmartContractComponent, canActivate: [authGuard] },

  // Default Entry Point: Always bootstrap to Connect / Register gateway
  { path: '', redirectTo: 'connect', pathMatch: 'full' },
  { path: '**', redirectTo: 'connect' }
];
