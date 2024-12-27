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
import { MatDialog } from '@angular/material/dialog';
import { AddPeopleDialogSidebarComponent } from './add-people-dialog-sidebar/add-people-dialog-sidebar.component';

@Component({
  selector: 'app-create-create-channel-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './create-channel-dialog.component.html',
  styleUrl: './create-channel-dialog.component.scss',
})
export class ChannelDialogComponent {
  constructor(
    @Optional() public dialogRef: MatDialogRef<ChannelDialogComponent>,
    private dialog: MatDialog
  ) {}

  @Input() isOpen = false;
  @Output() closeDialog = new EventEmitter<void>();

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

  openAddPeopleDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.afterClosed().subscribe(() => {
        this.dialog.open(AddPeopleDialogSidebarComponent);
      });

      this.dialogRef.close();
    }
  }
}
