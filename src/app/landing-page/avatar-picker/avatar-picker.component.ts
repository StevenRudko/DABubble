import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
// import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-avatar-picker',
  imports: [MATERIAL_MODULES, RouterLink],
  templateUrl: './avatar-picker.component.html',
  styleUrl: './avatar-picker.component.scss'
})
export class AvatarPickerComponent {

  avatarPath: string[] = ['img-placeholder/elias.svg', 'img-placeholder/elise.svg', 'img-placeholder/frederik.svg', 'img-placeholder/noah.svg', 'img-placeholder/sofia.svg', 'img-placeholder/steffen.svg',];
  selectedUserAvatar: string = 'img/person.png';
  // auth: any = getAuth();
  email: string = 'asdas@hotmail.com';
  password: string = '123456abcd';


  selectedAvatar(path: string) {
    this.selectedUserAvatar = path;
  }

  // createNewUser() {
  //   createUserWithEmailAndPassword(this.auth, this.email, this.password);
  // }

  // createUserWithEmailAndPassword(auth: any, email: string, password: string)
  //   .then((userCredential: any) => {
  //     // Signed up 
  //     const user = userCredential.user;
  //     // ...
  //   })
  //   .catch((error: any) => {
  //     const errorCode = error.code;
  //     const errorMessage = error.message;
  //     // ..
  //   });
}
