import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, FormsModule, InputTextModule, FloatLabelModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;

  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
    });
    const savedProfile = localStorage.getItem('userProfile');
    if(savedProfile) {
      this.profileForm.patchValue(JSON.parse(savedProfile));
    }
  }

  onSubmit(): void {
    if(this.profileForm.valid) {
      const formData = this.profileForm.value;
      localStorage.setItem('userProfile', JSON.stringify(formData));
      alert('Данные профиля успешно сохранены!');
    }
    else {
      alert('Пожалуйста, заполните все обязательные поля правильно.');
    }
  }

}
