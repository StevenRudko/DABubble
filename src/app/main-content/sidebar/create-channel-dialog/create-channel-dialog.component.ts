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
import { Firestore, addDoc, collection } from '@angular/fire/firestore';

@Component({
  selector: 'app-create-create-channel-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './create-channel-dialog.component.html',
  styleUrl: './create-channel-dialog.component.scss',
})
export class ChannelDialogComponent {
  channelName: string = '';
  channelDescription: string = '';

  constructor(
    @Optional() public dialogRef: MatDialogRef<ChannelDialogComponent>,
    private dialog: MatDialog,
    private firestore: Firestore
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

  async openAddPeopleDialog(): Promise<void> {
    if (this.dialogRef) {
      try {
        const channelRef = collection(this.firestore, 'channels');
        const newChannel = await addDoc(channelRef, {
          name: this.channelName,
          description: this.channelDescription,
          type: 'public',
          createdAt: new Date().toISOString(),
          members: {},
        });

        this.dialogRef.close(newChannel.id);
        this.dialog.open(AddPeopleDialogSidebarComponent, {
          data: { channelId: newChannel.id },
        });
      } catch (error) {
        console.error('Error creating channel:', error);
      }
    }
  }
}
