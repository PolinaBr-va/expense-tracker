import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileComponent } from './profile';
import { ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        ReactiveFormsModule,
        InputTextModule,
        FloatLabelModule,
        InputMaskModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with values', () => {
    expect(component.profileForm).toBeDefined();

    const form = component.profileForm;

    expect(form.value).toEqual({
      fullName: '',
      email: '',
      phone: '',
    });

    expect(form.valid).toBeFalse();
  });

  describe('initForm', () => {
    it('should validate required fields', () => {
      const form = component.profileForm;

      form.setValue({
        fullName: '',
        email: '',
        phone: '',
      });

      expect(form.invalid).toBeTrue();
    });

    it('should validate email format', () => {
      const email = component.profileForm.get('email');

      email?.setValue('invalid-email');
      expect(email?.invalid).toBeTrue();

      email?.setValue('test@mail.com');
      expect(email?.valid).toBeTrue();
    });

    it('should patch form from localStorage', () => {
      const mockData = {
        fullName: 'John Doe',
        email: 'john@mail.com',
        phone: '9999999999',
      };

      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockData));

      fixture = TestBed.createComponent(ProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.profileForm.value).toEqual(mockData);
    });
  });

  describe('onSubmit', () => {
    it('should save data to localStorage when form is valid', () => {
      spyOn(localStorage, 'setItem');
      spyOn(window, 'alert');

      component.profileForm.setValue({
        fullName: 'John Doe',
        email: 'john@mail.com',
        phone: '9999999999',
      });

      component.onSubmit();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'userProfile',
        JSON.stringify(component.profileForm.value),
      );

      expect(window.alert).toHaveBeenCalledWith('Данные профиля успешно сохранены!');
    });

    it('should error alert when form is invalid', () => {
      spyOn(window, 'alert');

      component.profileForm.setValue({
        fullName: '',
        email: 'invalid-email',
        phone: '',
      });

      component.onSubmit();

      expect(window.alert).toHaveBeenCalledWith(
        'Пожалуйста, заполните все обязательные поля правильно.',
      );
    });
  });

  it('should disable button when form is invalid', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTrue();
  });
});
