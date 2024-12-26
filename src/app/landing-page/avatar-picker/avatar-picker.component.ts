import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';

@Component({
  selector: 'app-avatar-picker',
  imports: [MATERIAL_MODULES],
  templateUrl: './avatar-picker.component.html',
  styleUrl: './avatar-picker.component.scss'
})
export class AvatarPickerComponent {

  avatarPath: string[] = ['img-placeholder/elias.svg', 'img-placeholder/elise.svg', 'img-placeholder/frederik.svg', 'img-placeholder/noah.svg', 'img-placeholder/sofia.svg', 'img-placeholder/steffen.svg',]
  selectedUserAvatar: string = 'img/person.png';

  selectedAvatar(path: string) {
    this.selectedUserAvatar = path;
  }
}
