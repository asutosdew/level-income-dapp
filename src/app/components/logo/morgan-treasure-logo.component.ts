import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-morgan-treasure-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="brand-logo-container" [ngClass]="['size-' + size, layout]">
      <!-- SVG Crest / Emblem -->
      <div class="logo-emblem" [style.width.px]="iconSize" [style.height.px]="iconSize">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full filter-glow">
          <defs>
            <!-- 24K Radiant Gold Metallic Gradients -->
            <linearGradient id="goldSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFF4CC" />
              <stop offset="25%" stop-color="#F59E0B" />
              <stop offset="50%" stop-color="#D97706" />
              <stop offset="75%" stop-color="#FBBF24" />
              <stop offset="100%" stop-color="#B45309" />
            </linearGradient>

            <linearGradient id="goldBorder" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#78350F" />
              <stop offset="50%" stop-color="#FCD34D" />
              <stop offset="100%" stop-color="#92400E" />
            </linearGradient>

            <linearGradient id="emeraldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#34D399" />
              <stop offset="100%" stop-color="#059669" />
            </linearGradient>

            <linearGradient id="darkShield" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#1E293B" />
              <stop offset="100%" stop-color="#0A0F1D" />
            </linearGradient>

            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Outer Hexagonal / Diamond Shield Frame -->
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            fill="url(#darkShield)"
            stroke="url(#goldBorder)"
            stroke-width="2.5"
            stroke-linejoin="round"
          />

          <!-- Inner Golden Faceted Polygon -->
          <polygon
            points="50,11 85,29 85,71 50,89 15,71 15,29"
            fill="none"
            stroke="url(#goldSheen)"
            stroke-width="1.2"
            stroke-dasharray="3,2"
            opacity="0.75"
          />

          <!-- Geometric Diamond Vault Facets (Background) -->
          <path d="M50,11 L50,89" stroke="url(#goldSheen)" stroke-width="0.8" opacity="0.35" />
          <path d="M15,29 L85,71" stroke="url(#goldSheen)" stroke-width="0.8" opacity="0.25" />
          <path d="M15,71 L85,29" stroke="url(#goldSheen)" stroke-width="0.8" opacity="0.25" />

          <!-- Interlocking Monogram 'M' & 'T' -->
          <!-- Letter 'M' Form -->
          <path
            d="M26,67 L26,35 L40,51 L50,39 L60,51 L74,35 L74,67"
            stroke="url(#goldSheen)"
            stroke-width="5"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />

          <!-- Letter 'T' Crown Form Overlay -->
          <path
            d="M36,33 L64,33"
            stroke="#FFF4CC"
            stroke-width="4.5"
            stroke-linecap="round"
          />
          <path
            d="M50,33 L50,67"
            stroke="#FFF4CC"
            stroke-width="4.5"
            stroke-linecap="round"
          />

          <!-- Radiant Treasure Gem / Blockchain Node at Center -->
          <circle cx="50" cy="51" r="4.5" fill="url(#emeraldAccent)" stroke="#FFF4CC" stroke-width="1.5" filter="url(#goldGlow)" />

          <!-- Golden Sparkle / Star at top apex -->
          <polygon
            points="50,16 52,21 57,21 53,24 55,29 50,26 45,29 47,24 43,21 48,21"
            fill="#FFFBEB"
          />
        </svg>
      </div>

      <!-- Brand Typography Wordmark -->
      <div class="brand-text" *ngIf="showWordmark">
        <div class="brand-title">
          <span class="gold-text">MORGAN</span>
          <span class="treasure-text">TREASURE</span>
        </div>
        <div class="brand-subtitle" *ngIf="showTagline">
          <span class="crypto-tag">0.5% - 1% DAILY ROI</span>
          <span class="divider">•</span>
          <span class="chain-tag">BNB CHAIN</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .brand-logo-container {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      user-select: none;
      text-decoration: none;

      &.layout-vertical {
        flex-direction: column;
        text-align: center;
        gap: 8px;
      }
    }

    .logo-emblem {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        transform: scale(1.06) rotate(1deg);
      }
    }

    .filter-glow {
      filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.45));
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      line-height: 1.15;
    }

    .brand-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;

      .gold-text {
        background: linear-gradient(135deg, #FFF4CC 0%, #F59E0B 50%, #D97706 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 16px rgba(245, 158, 11, 0.3);
      }

      .treasure-text {
        color: #F8FAFC;
        letter-spacing: 0.16em;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
    }

    .brand-subtitle {
      font-size: 0.68rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #94A3B8;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 3px;

      .crypto-tag {
        color: #10B981;
      }

      .divider {
        color: #475569;
      }

      .chain-tag {
        color: #F59E0B;
      }
    }

    /* Size variants */
    .size-sm {
      gap: 10px;
      .logo-emblem { width: 32px; height: 32px; }
      .brand-title { font-size: 1.05rem; }
      .brand-subtitle { font-size: 0.62rem; }
    }

    .size-md {
      .logo-emblem { width: 42px; height: 42px; }
      .brand-title { font-size: 1.25rem; }
    }

    .size-lg {
      .logo-emblem { width: 56px; height: 56px; }
      .brand-title { font-size: 1.55rem; }
      .brand-subtitle { font-size: 0.76rem; }
    }

    .size-xl {
      .logo-emblem { width: 78px; height: 78px; }
      .brand-title { font-size: 2.1rem; }
      .brand-subtitle { font-size: 0.88rem; }
    }
  `]
})
export class MorganTreasureLogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() layout: 'layout-horizontal' | 'layout-vertical' = 'layout-horizontal';
  @Input() showWordmark = true;
  @Input() showTagline = true;

  get iconSize(): number {
    switch (this.size) {
      case 'sm': return 34;
      case 'lg': return 56;
      case 'xl': return 78;
      case 'md':
      default: return 44;
    }
  }
}
