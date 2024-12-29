import { Component, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-avatar-picker',
  imports: [MATERIAL_MODULES, RouterLink],
  templateUrl: './avatar-picker.component.html',
  styleUrl: './avatar-picker.component.scss'
})
export class AvatarPickerComponent {
  authService = inject(AuthService);
  router = inject(Router);

  avatarPath: string[] = ['img-placeholder/elias.svg', 'img-placeholder/elise.svg', 'img-placeholder/frederik.svg', 'img-placeholder/noah.svg', 'img-placeholder/sofia.svg', 'img-placeholder/steffen.svg',];
  selectedUserAvatar: string = 'img/person.png';
  formData: any;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    this.formData = navigation?.extras?.state?.['formData'] || null;    
    if (!this.formData) {
      this.router.navigateByUrl('/')
    }
  }

  selectedAvatar(path: string) {
    this.selectedUserAvatar = path;
  }

  onSubmit(): void {
    this.authService.register(this.formData.email, this.formData.username, this.formData.password, this.selectedUserAvatar)
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/login')
        }
      })
  }
}
