import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule, NgIf } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';
import { MessagesEditOptionsComponent } from '../messages-edit-options/messages-edit-options.component';

@Component({
  selector: 'app-user-msg-options',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, EmojiPickerComponent, MessagesEditOptionsComponent],
  templateUrl: './user-msg-options.component.html',
  styleUrl: './user-msg-options.component.scss'
})

export class UserMsgOptionsComponent {
  hoverFaceTag: boolean = false;
  hoverEdit: boolean = false;

  constructor() {}

  onMouseEnter(obj: string) {
    if(obj === 'tag_face') {
      this.hoverFaceTag = true;
    } else if (obj === 'edit') {
      this.hoverEdit = true;
    }
  }

  onMouseLeave(obj: string) {
    if(obj === 'tag_face') {
      this.hoverFaceTag = false;
    } else if (obj === 'edit') {
      this.hoverEdit = false;
    }
  }
}
