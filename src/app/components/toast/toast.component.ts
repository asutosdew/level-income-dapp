import { Component, effect, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { Web3Service } from '../../services/web3.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Celebration Canvas for Confetti -->
    <canvas #confettiCanvas class="confetti-canvas pointer-events-none"></canvas>

    <!-- Floating Toasts Container -->
    <div class="fixed-toast-container">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div class="toast-item glass-card" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <i class="fa-solid fa-circle-check text-emerald-400"></i> }
              @case ('warning') { <i class="fa-solid fa-triangle-exclamation text-amber-400"></i> }
              @case ('error') { <i class="fa-solid fa-circle-xmark text-rose-400"></i> }
              @default { <i class="fa-solid fa-circle-info text-cyan-400"></i> }
            }
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-msg">{{ toast.message }}</div>
            @if (toast.txHash) {
              <a [href]="web3Service.getExplorerUrl(toast.txHash)" target="_blank" class="toast-tx-link">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> View on Explorer
              </a>
            }
          </div>
          <button (click)="notificationService.remove(toast.id)" class="toast-close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .confetti-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 99999;
    }

    .fixed-toast-container {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 32px);
      max-width: 440px;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      animation: slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .toast-success {
      border: 1px solid rgba(16, 185, 129, 0.5);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.25);
    }

    .toast-warning {
      border: 1px solid rgba(245, 158, 11, 0.5);
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.25);
    }

    .toast-error {
      border: 1px solid rgba(239, 68, 68, 0.5);
      box-shadow: 0 8px 25px rgba(239, 68, 68, 0.25);
    }

    .toast-info {
      border: 1px solid rgba(6, 182, 212, 0.5);
      box-shadow: 0 8px 25px rgba(6, 182, 212, 0.25);
    }

    .toast-icon {
      font-size: 1.2rem;
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
    }

    .toast-msg {
      font-size: 0.82rem;
      color: #94a3b8;
      line-height: 1.35;
    }

    .toast-tx-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #38bdf8;
      margin-top: 6px;
      text-decoration: underline;
    }

    .toast-close-btn {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 0.9rem;
      cursor: pointer;
      padding: 4px;
      transition: color 0.2s;
    }

    .toast-close-btn:hover {
      color: #fff;
    }

    @keyframes slideInDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements AfterViewInit {
  @ViewChild('confettiCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(
    public notificationService: NotificationService,
    public web3Service: Web3Service
  ) {
    effect(() => {
      const trigger = this.notificationService.confettiTrigger();
      if (trigger > 0) {
        this.runConfetti();
      }
    });
  }

  ngAfterViewInit(): void {
    this.resizeCanvas();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }

  private resizeCanvas(): void {
    if (this.canvasRef?.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  private runConfetti(): void {
    if (!this.canvasRef?.nativeElement) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.resizeCanvas();

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      vx: number;
      vy: number;
      rotation: number;
      vRot: number;
      opacity: number;
    }> = [];

    const colors = ['#f59e0b', '#fbbf24', '#10b981', '#34d399', '#06b6d4', '#8b5cf6', '#ffffff'];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 120,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 50,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -12 - 4,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      let alive = 0;
      for (const p of particles) {
        if (p.opacity > 0) {
          alive++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35; // gravity
          p.rotation += p.vRot;
          p.opacity -= 0.012;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (alive > 0 && frame < 120) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(animate);
  }
}
