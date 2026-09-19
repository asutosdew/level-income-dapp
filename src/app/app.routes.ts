import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { IncomeDetailComponent } from './pages/income-detail/income-detail.component';
import { DepositFundComponent } from './pages/deposit-fund/deposit-fund.component';
import { WithdrawOptionComponent } from './pages/withdraw-option/withdraw-option.component';
import { TeamComponent } from './pages/team/team.component';
import { SmartContractComponent } from './pages/smart-contract/smart-contract.component';
import { ConnectRegisterComponent } from './pages/connect-register/connect-register.component';

export const routes: Routes = [
  
  { path: 'dashboard', component: DashboardComponent },
  { path: 'deposit', component: DepositFundComponent },
  { path: 'income', component: IncomeDetailComponent },
  { path: 'team', component: TeamComponent },
  { path: 'connect', component: ConnectRegisterComponent },
  { path: 'withdraw', component: WithdrawOptionComponent },
  { path: 'contract', component: SmartContractComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
