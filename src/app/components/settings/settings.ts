import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectButton } from 'primeng/selectbutton';
import { ThemeMode, ThemeService } from '../../services/theme-service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, SelectButton],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent implements OnInit {
  private themeService = inject(ThemeService);

  selectedTheme!: ThemeMode;

  themeOptions = [
    { label: 'Светлая', value: 'light' },
    { label: 'Тёмная', value: 'dark' },
    { label: 'Системная', value: 'system' },
  ];

  ngOnInit() {
    this.selectedTheme = this.themeService.getTheme();
  }

  changeTheme() {
    this.themeService.setTheme(this.selectedTheme);
  }
}
