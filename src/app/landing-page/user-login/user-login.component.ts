import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { FormsModule, Validators, ReactiveFormsModule, FormBuilder, } from '@angular/forms';
import { AuthService } from '../../service/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-login',
  imports: [MATERIAL_MODULES, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-login.component.html',
  styleUrl: './user-login.component.scss'
})
export class UserLoginComponent {

  error: boolean = false;

  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    const rawForm = this.form.getRawValue();
    this.authService.login(rawForm.email, rawForm.password)
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/login')
        },
        error: (error) => {
        this.error = true;
          console.error('Email/Password Sign-In error:', error);
        }
      })
  }

  onGoogleSignIn(): void {
    this.authService.googleLogin().subscribe({
      next: (result) => {
        console.log('Google Sign-In success:', result);
        this.router.navigateByUrl('/login'); // Weiterleitung nach erfolgreicher Anmeldung
      },
      error: (error) => {
        console.error('Google Sign-In error:', error);
      },
    });
  }

  guestLogin(): void {
    const values = {
      email: 'test@mail.com',
      password: 'ABCD1234@'
    };
  
    this.form.patchValue(values);
  
    const subscription = this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        subscription.unsubscribe(); // Beende den Listener, um Memory Leaks zu vermeiden
        this.onSubmit();
      }
    });
  }
}