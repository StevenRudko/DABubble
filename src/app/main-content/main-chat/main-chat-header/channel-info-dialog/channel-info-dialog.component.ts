import {
  Component,
  Inject,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatService } from '../../../../service/chat.service';

/**
 * Interface defining the required data structure for the channel dialog
 */
interface ChannelDialogData {
  channelId: string;
  name: string;
  description: string;
  userId: string;
  createdBy?: string;
}

/**
 * Component for displaying and editing channel information in a dialog
 */
@Component({
  selector: 'app-channel-info-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './channel-info-dialog.component.html',
  styleUrls: ['./channel-info-dialog.component.scss'],
})
export class ChannelInfoDialogComponent implements AfterViewInit {
  @ViewChildren('autosize') textareas!: QueryList<ElementRef>;

  isEditingName = false;
  isEditingDescription = false;
  channelName: string;
  channelDescription: string;
  createdBy: string;

  /**
   * Initializes the component with channel data
   */
  constructor(
    public dialogRef: MatDialogRef<ChannelInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChannelDialogData,
    private chatService: ChatService
  ) {
    this.channelName = data.name;
    this.channelDescription = data.description || '';
    this.createdBy = data.createdBy || 'Unknown';
  }

  /**
   * Sets up textarea auto-resize after view initialization
   */
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.adjustAllTextareas();
      this.setupTextareaListeners();
    });
  }

  /**
   * Adjusts height of all textareas to fit content
   */
  private adjustAllTextareas(): void {
    this.textareas.forEach((textarea) =>
      this.adjustTextareaHeight(textarea.nativeElement)
    );
  }

  /**
   * Sets up input event listeners for textarea auto-resize
   */
  private setupTextareaListeners(): void {
    this.textareas.forEach((textarea) => {
      textarea.nativeElement.addEventListener('input', () =>
        this.adjustTextareaHeight(textarea.nativeElement)
      );
    });
  }

  /**
   * Adjusts the height of a single textarea element
   */
  private adjustTextareaHeight(element: HTMLTextAreaElement): void {
    element.style.height = 'auto';
    element.style.height = `${Math.max(60, element.scrollHeight)}px`;
  }

  /**
   * Toggles channel name editing mode
   */
  toggleEditName(): void {
    this.isEditingName = !this.isEditingName;
    if (!this.isEditingName) this.channelName = this.data.name;
  }

  /**
   * Toggles channel description editing mode and adjusts textarea
   */
  toggleEditDescription(): void {
    this.isEditingDescription = !this.isEditingDescription;
    if (!this.isEditingDescription) {
      this.channelDescription = this.data.description || '';
    }
    if (this.isEditingDescription) {
      setTimeout(() => this.adjustAllTextareas());
    }
  }

  /**
   * Saves changes to channel name and/or description
   */
  async saveChanges(): Promise<void> {
    try {
      const updates = this.getUpdates();
      await this.chatService.updateChannel(this.data.channelId, updates);
      this.applyUpdates();
    } catch (error) {
      console.error('Error updating channel:', error);
    }
  }

  /**
   * Gets the updates object based on edited fields
   */
  private getUpdates(): Partial<ChannelDialogData> {
    const updates: Partial<ChannelDialogData> = {};
    if (this.isEditingName) updates.name = this.channelName;
    if (this.isEditingDescription)
      updates.description = this.channelDescription;
    return updates;
  }

  /**
   * Applies updates to local data and resets edit states
   */
  private applyUpdates(): void {
    if (this.isEditingName) {
      this.data.name = this.channelName;
      this.isEditingName = false;
    }
    if (this.isEditingDescription) {
      this.data.description = this.channelDescription;
      this.isEditingDescription = false;
    }
  }

  /**
   * Removes current user from the channel
   */
  async leaveChannel(): Promise<void> {
    try {
      await this.chatService.removeUserFromChannel(
        this.data.channelId,
        this.data.userId
      );
      this.dialogRef.close('channelLeft');
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  }
}
