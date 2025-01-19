import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { CommonModule, NgIf } from '@angular/common';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-msg-options',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './user-msg-options.component.html',
  styleUrl: './user-msg-options.component.scss'
})

export class UserMsgOptionsComponent {

  constructor(private dialog: MatDialog) {}

  openEmojiPicker(): void {
    const dialogRef = this.dialog.open(EmojiPickerComponent, {backdropClass: 'custom-backdrop'});
    dialogRef.afterClosed().subscribe((result) => {
      // console.log('The dialog was closed');
    });
  }
}
