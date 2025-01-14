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
  minNameLength = 3;
  @Input() isOpen = false;
  @Output() closeDialog = new EventEmitter<void>();

  /**
   * Initializes the channel dialog component
   */
  constructor(
    @Optional() public dialogRef: MatDialogRef<ChannelDialogComponent>,
    private dialog: MatDialog,
    private firestore: Firestore
  ) {}

  /**
   * Validates if channel name meets minimum length requirement
   */
  get isChannelNameValid(): boolean {
    return this.channelName.trim().length >= this.minNameLength;
  }

  /**
   * Closes the dialog
   */
  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  /**
   * Handles backdrop click to close dialog
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  /**
   * Creates channel data object
   */
  private createChannelData(): any {
    return {
      name: this.channelName.trim(),
      description: this.channelDescription.trim(),
      type: 'public',
      createdAt: new Date().toISOString(),
      members: {},
    };
  }

  /**
   * Opens add people dialog after channel creation
   */
  private openPeopleDialog(channelId: string): void {
    this.dialog.open(AddPeopleDialogSidebarComponent, {
      data: { channelId },
    });
  }

  /**
   * Creates new channel and opens people dialog
   */
  async openAddPeopleDialog(): Promise<void> {
    if (!this.isChannelNameValid || !this.dialogRef) return;

    try {
      const channelRef = collection(this.firestore, 'channels');
      const newChannel = await addDoc(channelRef, this.createChannelData());
      this.dialogRef.close(newChannel.id);
      this.openPeopleDialog(newChannel.id);
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  }
}
