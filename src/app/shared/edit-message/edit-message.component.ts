import { CommonModule, NgIf } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, } from '@angular/material/dialog';
import { MATERIAL_MODULES } from '../material-imports';

@Component({
  selector: 'app-edit-message',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, NgIf],
  templateUrl: './edit-message.component.html',
  styleUrl: './edit-message.component.scss',
})
export class EditMessageComponent {
  editedMessage: string;

  constructor(
    public dialogRef: MatDialogRef<EditMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {
    this.editedMessage = data.message;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.editedMessage); 
  }
}
