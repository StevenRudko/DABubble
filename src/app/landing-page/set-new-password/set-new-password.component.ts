import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ValidatorService } from '../../service/validator.service';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-set-new-password',
  imports: [MATERIAL_MODULES, ReactiveFormsModule, RouterLink],
  templateUrl: './set-new-password.component.html',
  styleUrl: './set-new-password.component.scss'
})
export class SetNewPasswordComponent {
  fb = inject(FormBuilder);
  validatorService = inject(ValidatorService);
  error: boolean = false;
  auth = inject(Auth);
  router = inject(Router);
  route = inject(ActivatedRoute);

  loading = true;
  errorMessage = '';
  email: string | null = null;

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, this.validatorService.passwordValidator()]],
    confirmPassword: ['', [Validators.required, this.validatorService.passwordValidator()]],
  },
    { validators: this.validatorService.passwordMatchValidator() }
  );

  //onInit function to check the Verify the password reset code is valid.
  ngOnInit() {
    const actionCode = this.route.snapshot.queryParamMap.get('oobCode');

    if (!actionCode) {
      this.errorMessage = 'Ungültiger Link.';
      console.log('Ungültiger Link.');
      return;
    }

    // Verify the password reset code and retrieve the email address.
    verifyPasswordResetCode(this.auth, actionCode)
      .then((email) => {
        this.email = email;
      })
      .catch((error) => {
        this.errorMessage = 'Der Link ist ungültig oder abgelaufen.';
        console.log('Der Link ist ungültig oder abgelaufen.');
      });
  }

  onSubmit() {
    if (this.form.invalid || this.form.value.password !== this.form.value.confirmPassword) {
      this.errorMessage = 'Die Passwörter stimmen nicht überein.';
      console.log(this.errorMessage, this.form.invalid, this.form.value.password !== this.form.value.confirmPassword);

      return;
    }

    const actionCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (!actionCode) {
      this.errorMessage = 'Ungültiger Link.';
      console.log(this.errorMessage);
      return;
    }

    const rawForm = this.form.getRawValue();

    this.loading = true;
    confirmPasswordReset(this.auth, actionCode, rawForm.password)
      .then(() => {
        this.loading = false;
        // Costum Alert from Figma
        alert('Passwort wurde erfolgreich zurückgesetzt.');
        // setTimeOut
        this.router.navigate(['']);
      })
      .catch((error) => {
        // Costum Alert from Figma
        this.errorMessage = 'Fehler beim Zurücksetzen des Passworts. Bitte versuchen Sie es erneut.';
        console.log(this.errorMessage);
        this.loading = false;
      });
  }
}
