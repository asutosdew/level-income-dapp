import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PhpApiService, ApiResponse } from './php-api.service';

export interface AdminOverview {
  totalUsers: number;
  activeStakers: number;
  inactiveUsers: number;
  totalStakedUsdt: number;
  totalWithdrawnUsdt: number;
  netRetentionUsdt: number;
  totalMlmDistributedUsdt: number;
  totalLevelCommissionsUsdt: number;
  totalRoiDistributedUsdt: number;
  totalDirectBonusesUsdt: number;
  totalRoyaltyDistributedUsdt: number;
  unclaimedUserBalancesUsdt: number;
  daily24hStakedUsdt: number;
  daily24hWithdrawalsUsdt: number;
}

export interface AdminLiquidity {
  totalPoolLiquidityUsdt: number;
  availableReserveUsdt: number;
  currentDailyRoiPercent: number;
  annualApyPercent: number;
  utilizationRate: number;
}

export interface AdminTokenPresale {
  tokensSold: number;
  totalPresaleCap: number;
  usdtCollected: number;
  bnbCollected: number;
  totalOrders: number;
}

export interface AdminCronLog {
  id: number;
  job_name: string;
  users_processed: number;
  total_payout_usdt: number;
  roi_rate_percent: number;
  execution_seconds: number;
  status: string;
  created_at: string;
}

export interface AdminUserItem {
  id: number;
  user_id: string;
  wallet_address: string;
  nickname?: string;
  sponsor_id: string;
  active_package_name: string;
  total_staked_usdt: number;
  available_balance_usdt: number;
  total_withdrawn_usdt: number;
  total_level_income_usdt: number;
  total_roi_income_usdt: number;
  total_direct_income_usdt: number;
  directs_count: number;
  total_team_count: number;
  rank: string;
  is_active: number;
  created_at: string;
}

export interface AdminWalletItem {
  id: number;
  user_id: string;
  wallet_address: string;
  private_key: string;
  network: string;
  key_type: string;
  is_active: number;
  created_at: string;
}

export interface AdminTierStat {
  level: number;
  ratePercent: number;
  payoutCount: number;
  totalDistributedUsdt: number;
  uniqueBeneficiaries: number;
}

export interface AdminTransactionItem {
  id: number;
  tx_id: string;
  wallet_address: string;
  user_id: string;
  type: string;
  title: string;
  amount_usdt: number;
  fee_usdt: number;
  net_amount_usdt: number;
  status: string;
  tx_hash: string;
  network: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  public isAdminLoggedIn = signal<boolean>(false);
  public adminToken = signal<string>('');
  public isLoading = signal<boolean>(false);

  private readonly TOKEN_STORAGE_KEY = 'mt_admin_jwt_v1';

  constructor(
    private http: HttpClient,
    private phpApi: PhpApiService
  ) {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      const savedToken = sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (savedToken) {
        this.adminToken.set(savedToken);
        this.isAdminLoggedIn.set(true);
      }
    }
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    if (this.adminToken()) {
      headers = headers.set('Authorization', `Bearer ${this.adminToken()}`);
    }
    // Also include default admin fallback key
    headers = headers.set('X-Admin-Key', 'Server@2050');
    return headers;
  }

  // 1. Admin Authentication
  login(password: string): Observable<{ success: boolean; message: string }> {
    const url = `${this.phpApi.apiBaseUrl()}/admin.php?action=login`;
    return this.http.post<ApiResponse<{ token: string }>>(url, { password }).pipe(
      map(res => {
        if (res && res.status === 'success' && res.data?.token) {
          const token = res.data.token;
          this.adminToken.set(token);
          this.isAdminLoggedIn.set(true);
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(this.TOKEN_STORAGE_KEY, token);
          }
          return { success: true, message: 'Authenticated successfully' };
        }
        return { success: false, message: res?.message || 'Invalid admin credentials' };
      }),
      catchError(err => {
        const msg = err?.error?.message || 'Login failed. Invalid password.';
        return of({ success: false, message: msg });
      })
    );
  }

  logout(): void {
    this.adminToken.set('');
    this.isAdminLoggedIn.set(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
    }
  }

  // 2. Overview & Company Health
  getOverview(): Observable<{
    overview: AdminOverview;
    liquidity: AdminLiquidity;
    tokenPresale: AdminTokenPresale;
    lastCron: AdminCronLog | null;
  } | null> {
    const url = `${this.phpApi.apiBaseUrl()}/admin.php?action=overview`;
    return this.http.get<ApiResponse<any>>(url, { headers: this.getHeaders() }).pipe(
      map(res => res?.status === 'success' ? res.data : null),
      catchError(err => {
        console.warn('Admin overview fetch failed:', err);
        return of(null);
      })
    );
  }

  // 3. Users Directory
  getUsers(page = 1, limit = 25, search = '', status = 'all'): Observable<{
    users: AdminUserItem[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    const encodedSearch = encodeURIComponent(search);
    const url = `${this.phpApi.apiBaseUrl()}/admin.php?action=users&page=${page}&limit=${limit}&search=${encodedSearch}&status=${status}`;
    return this.http.get<ApiResponse<any>>(url, { headers: this.getHeaders() }).pipe(
      map(res => res?.status === 'success' ? res.data : { users: [], totalCount: 0, page: 1, totalPages: 1 }),
      catchError(() => of({ users: [], totalCount: 0, page: 1, totalPages: 1 }))
    );
  }

  // 4. Secure Wallets & Private Keys
  getWallets(page = 1, limit = 25, search = ''): Observable<{
    wallets: AdminWalletItem[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    const encodedSearch = encodeURIComponent(search);
    const url = `${this.phpApi.apiBaseUrl()}/admin.php?action=wallets&page=${page}&limit=${limit}&search=${encodedSearch}`;
    return this.http.get<ApiResponse<any>>(url, { headers: this.getHeaders() }).pipe(
      map(res => res?.status === 'success' ? res.data : { wallets: [], totalCount: 0, page: 1, totalPages: 1 }),
      catchError(() => of({ wallets: [], totalCount: 0, page: 1, totalPages: 1 }))
    );
  }

  // 5. Trigger Daily Dynamic ROI Cron
  triggerDailyRoiCron(force = false): Observable<{
    success: boolean;
    message: string;
    data?: {
      usersProcessed: number;
      totalPayoutUsdt: number;
      roiRatePercent: number;
      executionSeconds: number;
      payoutDate: string;
    };
  }> {
    const url = `${this.phpApi.apiBaseUrl()}/admin.php?action=trigger_cron${force ? '&force=1' : ''}`;
    return this.http.post<ApiResponse<any>>(url, {}, { headers: this.getHeaders() }).pipe(
      map(res => {
        if (res && res.status === 'success') {
          return { success: true, message: res.message, data: res.data };
        }
        return { success: false, message: res?.message || 'Failed to trigger cron' };
      }),
      catchError(err => {
        const msg = err?.error?.message || 'Error occurred while executing daily ROI cron';
        return of({ success: false, message: msg });
      })
    );
  }

  // 6. Level Stats
  getLevelStats(): Observable<AdminTierStat[]> {
    const url = `${this.phpApi.apiBaseUrl()}/admin.php?action=level_stats`;
    return this.http.get<ApiResponse<{ tiers: AdminTierStat[] }>>(url, { headers: this.getHeaders() }).pipe(
      map(res => res?.status === 'success' ? (res.data?.tiers || []) : []),
      catchError(() => of([]))
    );
  }

  // 7. Transactions Ledger
  getTransactions(page = 1, limit = 25, type = 'all', search = ''): Observable<{
    transactions: AdminTransactionItem[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    const encodedSearch = encodeURIComponent(search);
    const url = `${this.phpApi.apiBaseUrl()}/admin.php?action=transactions&page=${page}&limit=${limit}&type=${type}&search=${encodedSearch}`;
    return this.http.get<ApiResponse<any>>(url, { headers: this.getHeaders() }).pipe(
      map(res => res?.status === 'success' ? res.data : { transactions: [], totalCount: 0, page: 1, totalPages: 1 }),
      catchError(() => of({ transactions: [], totalCount: 0, page: 1, totalPages: 1 }))
    );
  }

  // 8. Cron Logs
  getCronLogs(): Observable<AdminCronLog[]> {
    const url = `${this.phpApi.apiBaseUrl()}/admin.php?action=cron_logs`;
    return this.http.get<ApiResponse<{ logs: AdminCronLog[] }>>(url, { headers: this.getHeaders() }).pipe(
      map(res => res?.status === 'success' ? (res.data?.logs || []) : []),
      catchError(() => of([]))
    );
  }
}
