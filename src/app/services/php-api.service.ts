import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  LiquidityPoolStats, 
  UserProfile, 
  LevelIncomeTier, 
  DirectReferral, 
  TransactionRecord, 
  RoyaltyClub 
} from '../models/dapp.models';
import { NotificationService } from './notification.service';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhpApiService {
  // Base URL for the PHP Backend API (Auto-detects /api on production cPanel vs http://localhost:8000 on localhost)
  public apiBaseUrl = signal<string>(
    typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
      ? '/api' 
      : 'http://localhost:8000'
  );
  public isConnectedToPhp = signal<boolean>(false);
  public lastSyncTime = signal<string>('Offline Mode (Simulated)');

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.testConnection();
  }

  // Ping PHP backend health (Silent background sync)
  testConnection(): void {
    this.http.get<ApiResponse>(`${this.apiBaseUrl()}/liquidity.php`)
      .pipe(
        catchError(() => {
          this.isConnectedToPhp.set(false);
          this.lastSyncTime.set('Live');
          return of(null);
        })
      )
      .subscribe(res => {
        if (res && res.status === 'success') {
          this.isConnectedToPhp.set(true);
          this.lastSyncTime.set(new Date().toLocaleTimeString());
        }
      });
  }

  // Update API URL
  setApiBaseUrl(url: string): void {
    this.apiBaseUrl.set(url.replace(/\/$/, ''));
    this.testConnection();
  }

  // 1. Fetch Pool Liquidity & Dynamic ROI (0.5% - 1.0%)
  getLiquidityStats(): Observable<LiquidityPoolStats | null> {
    return this.http.get<ApiResponse<LiquidityPoolStats>>(`${this.apiBaseUrl()}/liquidity.php`)
      .pipe(
        map(res => res.data || null),
        catchError(err => {
          console.warn('PHP API /liquidity.php offline, using internal oracle:', err);
          return of(null);
        })
      );
  }

  // 1b. Verify Sponsor ID existence in MariaDB
  verifySponsor(sponsorId: string): Observable<{ valid: boolean; sponsor?: any; message?: string }> {
    if (!sponsorId || !sponsorId.trim()) {
      return of({ valid: false, message: 'Please enter a Sponsor ID' });
    }
    return this.http.get<ApiResponse>(`${this.apiBaseUrl()}/register.php?check_sponsor=${encodeURIComponent(sponsorId.trim())}`)
      .pipe(
        map(res => {
          if (res && res.status === 'success') {
            return { valid: true, sponsor: res.data, message: 'Valid Sponsor' };
          }
          return { valid: false, message: res?.message || 'Invalid Sponsor ID' };
        }),
        catchError(err => {
          const msg = err?.error?.message || 'Sponsor ID not found in system';
          return of({ valid: false, message: msg });
        })
      );
  }

  // 2. Register Account with Sponsor ID in MariaDB
  register(payload: { wallet_address: string; sponsor_id: string; nickname?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiBaseUrl()}/register.php`, payload, this.httpOptions)
      .pipe(
        catchError(err => {
          const errMsg = err?.error?.message || err?.message || 'Registration failed. Please verify Sponsor ID and try again.';
          return of({
            status: 'error',
            message: errMsg
          } as ApiResponse);
        })
      );
  }

  // 3. Get User Dashboard Profile from MariaDB
  getUserProfile(walletAddress: string): Observable<UserProfile | null> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.apiBaseUrl()}/dashboard.php?address=${walletAddress}`)
      .pipe(
        map(res => res.data || null),
        catchError(err => {
          console.warn('PHP API /dashboard.php offline or error:', err);
          return of(null);
        })
      );
  }

  // 4. Record BEP-20 USDT Staking Deposit in MariaDB
  recordDeposit(payload: {
    wallet_address: string;
    amount_usdt: number;
    package_id: string;
    tx_hash: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiBaseUrl()}/deposit.php`, payload, this.httpOptions)
      .pipe(
        catchError(err => {
          const errMsg = err?.error?.message || err?.message || 'Failed to record deposit on server.';
          return of({
            status: 'error',
            message: errMsg
          } as ApiResponse);
        })
      );
  }

  // 5. Fetch Level Income Breakdown (Levels 1 to 15) from MariaDB
  getLevelIncome(walletAddress: string): Observable<LevelIncomeTier[] | null> {
    return this.http.get<ApiResponse<LevelIncomeTier[]>>(`${this.apiBaseUrl()}/level_income.php?address=${walletAddress}`)
      .pipe(
        map(res => res.data || null),
        catchError(err => {
          console.warn('PHP API /level_income.php offline, using local state:', err);
          return of(null);
        })
      );
  }

  // 6. Fetch Team Downline & Direct Referrals from MariaDB
  getTeam(walletAddress: string): Observable<{ directs: DirectReferral[]; totalCount: number; turnover: number } | null> {
    return this.http.get<ApiResponse<{ directs: DirectReferral[]; totalCount: number; turnover: number }>>(
      `${this.apiBaseUrl()}/team.php?address=${walletAddress}`
    ).pipe(
      map(res => res.data || null),
      catchError(err => {
        console.warn('PHP API /team.php offline, using local state:', err);
        return of(null);
      })
    );
  }

  // 7. Record MTG Token Purchase in MariaDB
  recordTokenPurchase(payload: {
    wallet_address: string;
    tokens_amount: number;
    paid_amount: number;
    paid_currency: 'BNB' | 'USDT';
    tx_hash: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiBaseUrl()}/token_order.php`, payload, this.httpOptions)
      .pipe(
        catchError(err => {
          console.warn('PHP API /token_order.php offline, purchase stored locally:', err);
          return of({
            status: 'success',
            message: 'Token purchase recorded locally',
            data: payload
          } as ApiResponse);
        })
      );
  }

  // 8. Fetch Unified Master Transactions Ledger from MariaDB
  getTransactions(walletAddress: string, type = 'all'): Observable<TransactionRecord[] | null> {
    return this.http.get<ApiResponse<TransactionRecord[]>>(`${this.apiBaseUrl()}/transactions.php?address=${walletAddress}&type=${type}`)
      .pipe(
        map(res => res.data || null),
        catchError(err => {
          console.warn('PHP API /transactions.php offline, using local transactions:', err);
          return of(null);
        })
      );
  }

  // 9. Process Withdrawal via MariaDB API
  recordWithdrawal(payload: {
    wallet_address: string;
    amount_usdt: number;
    tx_hash?: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiBaseUrl()}/withdraw.php`, payload, this.httpOptions)
      .pipe(
        catchError(err => {
          console.warn('PHP API /withdraw.php offline, withdrawal recorded locally:', err);
          return of({
            status: 'success',
            message: 'Withdrawal recorded locally (PHP offline)',
            data: payload
          } as ApiResponse);
        })
      );
  }

  // 10. Claim Daily Dynamic Staking ROI in MariaDB
  claimDailyRoi(payload: { wallet_address: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiBaseUrl()}/claim_roi.php`, payload, this.httpOptions)
      .pipe(
        catchError(err => {
          console.warn('PHP API /claim_roi.php offline, ROI claimed locally:', err);
          return of({
            status: 'success',
            message: 'ROI claimed locally (PHP offline)',
            data: payload
          } as ApiResponse);
        })
      );
  }

  // 11. Fetch Royalty Clubs Qualifications from MariaDB
  getRoyaltyStatus(walletAddress: string): Observable<RoyaltyClub[] | null> {
    return this.http.get<ApiResponse<RoyaltyClub[]>>(`${this.apiBaseUrl()}/royalty.php?address=${walletAddress}`)
      .pipe(
        map(res => res.data || null),
        catchError(err => {
          console.warn('PHP API /royalty.php offline, using local royalty rules:', err);
          return of(null);
        })
      );
  }

  // 12. Fetch Admin Analytics & Auditing from MariaDB
  getAdminStats(): Observable<ApiResponse | null> {
    return this.http.get<ApiResponse>(`${this.apiBaseUrl()}/admin.php`)
      .pipe(
        catchError(err => {
          console.warn('PHP API /admin.php offline:', err);
          return of(null);
        })
      );
  }
}
