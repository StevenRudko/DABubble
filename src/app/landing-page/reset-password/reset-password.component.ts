import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';

@Component({
  selector: 'app-reset-password',
  imports: [MATERIAL_MODULES, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  loading: boolean = false;
  fb = inject(FormBuilder);
  router = inject(Router);
  auth = inject(Auth);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const email = this.form.value.email!;

    sendPasswordResetEmail(this.auth, email)
      .then(() => {
        this.loading = false;
        // Costum Alert from Figma
        alert('Ein Link zum Zurücksetzen des Passworts wurde gesendet.');
        // setTimeOut
        this.router.navigate(['']);
      })
      .catch((error) => {
        this.loading = false;
        // Costum Alert from Figma
        console.error('Fehler beim Zurücksetzen des Passworts:', error);
        // setTimeOut
        alert('Fehler: ' + error.message);
      });
  }
}
