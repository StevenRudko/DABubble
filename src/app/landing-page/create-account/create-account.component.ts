import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, NgForm, FormsModule } from '@angular/forms';
// import { HttpClient } from '@angular/common/http';
// import { AuthService } from '../../service/auth.service';
import { ValidatorService } from '../../service/validator.service';

@Component({
  selector: 'app-create-account',
  imports: [MATERIAL_MODULES, CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss'
})
export class CreateAccountComponent {
  loading: boolean = false;
  isHovered: boolean = false;
  privatPolicy: boolean = false;

  fb= inject(FormBuilder);
  // http = inject(HttpClient);
  // authService = inject(AuthService);
  router = inject(Router);
  validatorService = inject(ValidatorService)

  // errorMessage: string | null = null;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.pattern(/^[A-Za-zÄÖÜäöüß]{2,}\s[A-Za-zÄÖÜäöüß]{2,}$/)]],
    email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    password: ['', [Validators.required, this.validatorService.passwordValidator()]],
    agreeToTerms: [false, Validators.requiredTrue],
  });

  onSubmit() {
    if (this.form.valid) {
      this.router.navigateByUrl('/avat', { state: { formData: this.form.value } });
    }
  }

  // onSubmit(): void {
  //   const rawForm = this.form.getRawValue();
  //   this.authService.register(rawForm.email, rawForm.username, rawForm.password)
  //   .subscribe({
  //     next: () => {
  //     this.router.navigateByUrl('/login')
  //   }
  // })
  // }
}
