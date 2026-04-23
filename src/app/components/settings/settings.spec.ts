import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings';
import { ThemeMode, ThemeService } from '../../services/theme-service';
import { FormsModule } from '@angular/forms';
import { SelectButton } from 'primeng/selectbutton';
import { By } from '@angular/platform-browser';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    mockThemeService = jasmine.createSpyObj('ThemeService', ['getTheme', 'setTheme']);

    await TestBed.configureTestingModule({
      imports: [FormsModule, SelectButton, SettingsComponent],
      providers: [{ provide: ThemeService, useValue: mockThemeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set selectedTheme from service', () => {
      mockThemeService.getTheme.and.returnValue('dark');
      fixture.detectChanges();

      expect(mockThemeService.getTheme).toHaveBeenCalledTimes(1);
      expect(component.selectedTheme).toBe('dark');
    });
  });

  describe('changeTheme', () => {
    it('should call themeService.setTheme with current selectedTheme', () => {
      component.selectedTheme = 'system';

      component.changeTheme();

      expect(mockThemeService.setTheme).toHaveBeenCalledTimes(1);
      expect(mockThemeService.setTheme).toHaveBeenCalledOnceWith('system');
    });

    it('should work for all modes', () => {
      const themes: ThemeMode[] = ['light', 'dark', 'system'];

      themes.forEach((theme) => {
        component.selectedTheme = theme;
        component.changeTheme();
      });

      expect(mockThemeService.setTheme).toHaveBeenCalledTimes(3);
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('light');
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark');
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('system');
    });
  });

  describe('template integration', () => {
    beforeEach(() => {
      mockThemeService.getTheme.and.returnValue('light');
      fixture.detectChanges();
    });

    it('should integrate with template', () => {
      const selectButtonEl = fixture.debugElement.query(By.css('p-selectButton'));
      expect(selectButtonEl).toBeTruthy();
    });

    it('should update selectedTheme', () => {
      expect(component.selectedTheme).toBe('light');

      component.selectedTheme = 'dark';
      fixture.detectChanges();
      expect(component.selectedTheme).toBe('dark');
    });

    it('should call changeTheme when selection changes', () => {
      spyOn(component, 'changeTheme');

      const selectButtonEl = fixture.debugElement.query(By.css('p-selectButton'));
      expect(selectButtonEl).toBeTruthy();

      selectButtonEl.triggerEventHandler('ngModelChange', 'dark');
      expect(component.changeTheme).toHaveBeenCalled();
    });
  });
});
