import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  txHash?: string;
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public toasts = signal<ToastMessage[]>([]);
  public confettiTrigger = signal<number>(0);

  show(type: 'success' | 'warning' | 'info' | 'error', title: string, message: string, txHash?: string, durationMs = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      id,
      type,
      title,
      message,
      txHash,
      durationMs
    };

    this.toasts.update(list => [newToast, ...list]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  success(title: string, message: string, txHash?: string): void {
    this.show('success', title, message, txHash);
  }

  warning(title: string, message: string): void {
    this.show('warning', title, message);
  }

  error(title: string, message: string): void {
    this.show('error', title, message);
  }

  info(title: string, message: string): void {
    this.show('info', title, message);
  }

  remove(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  triggerCelebration(): void {
    this.confettiTrigger.update(v => v + 1);
  }
}
