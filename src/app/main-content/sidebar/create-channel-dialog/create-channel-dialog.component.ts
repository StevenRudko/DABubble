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
import {
  Firestore,
  addDoc,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

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
  nameExists = false;
  @Input() isOpen = false;
  @Output() closeDialog = new EventEmitter<void>();

  /**
   * Initializes the channel dialog component
   */
  constructor(
    @Optional() public dialogRef: MatDialogRef<ChannelDialogComponent>,
    private dialog: MatDialog,
    private firestore: Firestore,
    private auth: Auth
  ) {}

  /**
   * Checks if channel name already exists
   */
  private async checkChannelNameExists(name: string): Promise<boolean> {
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(channelsRef, where('name', '==', name.trim()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  /**
   * Validates channel name including duplicate check
   */
  async validateChannelName(name: string): Promise<void> {
    if (name.trim().length >= this.minNameLength) {
      this.nameExists = await this.checkChannelNameExists(name);
    }
  }

  /**
   * Validates if channel name meets minimum length requirement
   */
  get isChannelNameValid(): boolean {
    return (
      this.channelName.trim().length >= this.minNameLength && !this.nameExists
    );
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
   * Creates channel data object including creator information
   */
  private createChannelData(): any {
    const currentUser = this.auth.currentUser;
    return {
      name: this.channelName.trim(),
      description: this.channelDescription.trim(),
      type: 'public',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.uid,
      members: {
        [currentUser?.uid || '']: true,
      },
    };
  }

  /**
   * Opens add people dialog after channel creation
   */
  private openPeopleDialog(channelId: string): void {
    this.dialog.open(AddPeopleDialogSidebarComponent, {
      data: {
        channelId,
        creatorId: this.auth.currentUser?.uid,
      },
    });
  }

  /**
   * Creates new channel and opens people dialog
   */
  async openAddPeopleDialog(): Promise<void> {
    if (!this.isChannelNameValid || this.nameExists || !this.dialogRef) return;

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
