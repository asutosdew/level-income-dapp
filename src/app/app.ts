import { Component } from '@angular/core';
import { MobileShellComponent } from './components/mobile-shell/mobile-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MobileShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'Morgan Treasure | Web3 Investment Plan';
}
