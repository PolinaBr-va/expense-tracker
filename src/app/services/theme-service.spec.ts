import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme-service';
import { PrimeNG } from 'primeng/config';
import { DarkTheme } from '../../themes/dark-theme';
import { LightTheme } from '../../themes/light-theme';

describe('ThemeService', () => {
  let service: ThemeService;
  let primengMock: any;

  beforeEach(() => {
    primengMock = {
      theme: {
        set: jasmine.createSpy('set'),
      },
    };

    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: PrimeNG, useValue: primengMock }],
    });

    service = TestBed.inject(ThemeService);
  });

  it('should return saved theme from localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue('dark');

    const result = service.getTheme();

    expect(result).toBe('dark');
  });

  it('should return light theme if nothing saved', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);

    const result = service.getTheme();

    expect(result).toBe('light');
  });

  it('should save theme and apply dark theme', () => {
    spyOn(localStorage, 'setItem');

    service.setTheme('dark');

    expect(localStorage.setItem).toHaveBeenCalledWith('theme-mode', 'dark');
    expect(primengMock.theme.set).toHaveBeenCalled();
  });

  it('should save theme, apply it and listen system theme', () => {
    spyOn(localStorage, 'setItem');
    const listenSpy = spyOn<any>(service, 'listenSystemTheme');

    service.setTheme('system');

    expect(localStorage.setItem).toHaveBeenCalledWith('theme-mode', 'system');
    expect(primengMock.theme.set).toHaveBeenCalled();
    expect(listenSpy).toHaveBeenCalled();
  });

  it('should apply dark theme', () => {
    spyOn(document.documentElement.classList, 'toggle');
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      addEventListener: () => {},
    } as any);

    service['applyTheme']('dark');

    expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('p-dark', true);
    expect(primengMock.theme.set).toHaveBeenCalledWith({
      preset: DarkTheme,
    });
  });

  it('should apply light theme', () => {
    spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
      addEventListener: () => {},
    } as any);

    service['applyTheme']('light');

    expect(document.documentElement.classList.contains('p-dark')).toBeFalse();
    expect(primengMock.theme.set).toHaveBeenCalledWith({
      preset: LightTheme,
    });
  });

  it('should apply system theme based on matchMedia', () => {
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      addEventListener: () => {},
    } as any);

    service['applyTheme']('system');

    expect(document.documentElement.classList.contains('p-dark')).toBeTrue();
    expect(primengMock.theme.set).toHaveBeenCalledOnceWith({
      preset: DarkTheme,
    });
  });

  it('should init theme from localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue('dark');

    const applySpy = spyOn<any>(service, 'applyTheme');
    service.initTheme();

    expect(applySpy).toHaveBeenCalledWith('dark');
  });

  it('should listen to system theme if saved mode is system', () => {
    spyOn(localStorage, 'getItem').and.returnValue('system');

    const listenSpy = spyOn<any>(service, 'listenSystemTheme');
    service.initTheme();

    expect(listenSpy).toHaveBeenCalled();
  });

  it('should listen to system theme changes', () => {
    const addEventListenerSpy = jasmine.createSpy('addEventListener');
    spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
      addEventListener: addEventListenerSpy,
    } as any);

    service['listenSystemTheme']();

    expect(addEventListenerSpy).toHaveBeenCalledWith('change', jasmine.any(Function));
  });
});
