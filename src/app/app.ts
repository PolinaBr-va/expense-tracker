import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { ThemeService } from './services/theme-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLinkWithHref],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private themeService = inject(ThemeService);

  ngOnInit() {
    this.themeService.initTheme();
  }
}
