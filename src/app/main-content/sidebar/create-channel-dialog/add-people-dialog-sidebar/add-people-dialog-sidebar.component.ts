import {
  Component,
  Input,
  Output,
  EventEmitter,
  Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-people-dialog-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './add-people-dialog-sidebar.component.html',
  styleUrl: './add-people-dialog-sidebar.component.scss',
})
export class AddPeopleDialogSidebarComponent {
  constructor(
    @Optional() public dialogRef: MatDialogRef<AddPeopleDialogSidebarComponent>
  ) {}

  @Input() isOpen = false;
  @Output() closeDialog = new EventEmitter<void>();

  selectedOption: 'all' | 'specific' = 'all';

  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
