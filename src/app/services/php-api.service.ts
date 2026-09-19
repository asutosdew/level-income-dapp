import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LiquidityPoolStats, UserProfile, LevelIncomeTier, DirectReferral } from '../models/dapp.models';
import { NotificationService } from './notification.service';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class PhpApiService {
  // Base URL for the PHP Backend API (Configurable)
  // By default, points to local PHP dev server or relative /api path
  public apiBaseUrl = signal<string>('http://localhost:8000/api');
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

  // Ping PHP backend health
  testConnection(): void {
    this.http.get<ApiResponse>(`${this.apiBaseUrl()}/liquidity.php`)
      .pipe(
        catchError(() => {
          this.isConnectedToPhp.set(false);
          this.lastSyncTime.set('Standalone Mode (Built-in Demo Engine)');
          return of(null);
        })
      )
      .subscribe(res => {
        if (res && res.status === 'success') {
          this.isConnectedToPhp.set(true);
          this.lastSyncTime.set(new Date().toLocaleTimeString());
          this.notificationService.success('PHP API Connected', 'Synchronized with Morgan Treasure Backend.');
        }
      });
  }

  // Update API URL (e.g. from user settings or admin panel)
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

  // 2. Register Account with Sponsor ID
  register(payload: { wallet_address: string; sponsor_id: string; nickname?: string }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiBaseUrl()}/register.php`, payload, this.httpOptions)
      .pipe(
        catchError(err => {
          console.warn('PHP API /register.php offline, falling back to local registration:', err);
          return of({
            status: 'success',
            message: 'Registered in local session (PHP backend offline)',
            data: {
              userId: 'MT-' + Math.floor(10000 + Math.random() * 90000),
              sponsorId: payload.sponsor_id || 'MT-10024',
              wallet_address: payload.wallet_address
            }
          } as ApiResponse);
        })
      );
  }

  // 3. Get User Dashboard Profile
  getUserProfile(walletAddress: string): Observable<UserProfile | null> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.apiBaseUrl()}/dashboard.php?address=${walletAddress}`)
      .pipe(
        map(res => res.data || null),
        catchError(err => {
          console.warn('PHP API /dashboard.php offline, using local state:', err);
          return of(null);
        })
      );
  }

  // 4. Record BEP-20 USDT Staking Deposit
  recordDeposit(payload: {
    wallet_address: string;
    amount_usdt: number;
    package_id: string;
    tx_hash: string;
  }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiBaseUrl()}/deposit.php`, payload, this.httpOptions)
      .pipe(
        catchError(err => {
          console.warn('PHP API /deposit.php offline, deposit stored locally:', err);
          return of({
            status: 'success',
            message: 'Deposit confirmed in local state (PHP offline)',
            data: payload
          } as ApiResponse);
        })
      );
  }

  // 5. Fetch Level Income Breakdown (Levels 1 to 15)
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

  // 6. Fetch Team Downline & Direct Referrals
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

  // 7. Record MTG Token Purchase
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
}
