import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule, NgIf } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-msg-options',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, EmojiPickerComponent],
  templateUrl: './user-msg-options.component.html',
  styleUrl: './user-msg-options.component.scss'
})



export class UserMsgOptionsComponent {
  hoverFaceTag: boolean = false;

  constructor() {}

  onMouseEnter() {
    this.hoverFaceTag = true;
  }

  onMouseLeave() {
    this.hoverFaceTag = false;
  }
}
