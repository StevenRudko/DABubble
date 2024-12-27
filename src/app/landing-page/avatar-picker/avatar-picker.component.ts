import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

@Component({
  selector: 'app-avatar-picker',
  imports: [MATERIAL_MODULES],
  templateUrl: './avatar-picker.component.html',
  styleUrl: './avatar-picker.component.scss'
})
export class AvatarPickerComponent {

  avatarPath: string[] = ['img-placeholder/elias.svg', 'img-placeholder/elise.svg', 'img-placeholder/frederik.svg', 'img-placeholder/noah.svg', 'img-placeholder/sofia.svg', 'img-placeholder/steffen.svg',]
  selectedUserAvatar: string = 'img/person.png';

//   constructor(createUserWithEmailAndPassword) {}

  selectedAvatar(path: string) {
    this.selectedUserAvatar = path;
  }

// const auth = getAuth();
// createUserWithEmailAndPassword(auth, email, password)
//   .then((userCredential) => {
//     // Signed up 
//     const user = userCredential.user;
//     // ...
//   })
//   .catch((error) => {
//     const errorCode = error.code;
//     const errorMessage = error.message;
//     // ..
//   });
}
