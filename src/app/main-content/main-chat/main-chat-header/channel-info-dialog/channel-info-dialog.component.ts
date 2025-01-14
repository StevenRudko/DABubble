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

interface ChannelDialogData {
  channelId: string;
  name: string;
  description: string;
  userId: string;
  createdBy?: string;
}

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

  constructor(
    public dialogRef: MatDialogRef<ChannelInfoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChannelDialogData,
    private chatService: ChatService
  ) {
    this.channelName = data.name;
    this.channelDescription = data.description || '';
    this.createdBy = data.createdBy || 'Unbekannt';
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.adjustAllTextareas();
      this.setupTextareaListeners();
    });
  }

  adjustAllTextareas() {
    this.textareas.forEach((textarea) => {
      this.adjustTextareaHeight(textarea.nativeElement);
    });
  }

  setupTextareaListeners() {
    this.textareas.forEach((textarea) => {
      textarea.nativeElement.addEventListener('input', () => {
        this.adjustTextareaHeight(textarea.nativeElement);
      });
    });
  }

  adjustTextareaHeight(element: HTMLTextAreaElement) {
    element.style.height = 'auto';
    const scrollHeight = element.scrollHeight;
    element.style.height = Math.max(60, scrollHeight) + 'px';
  }

  toggleEditName(): void {
    this.isEditingName = !this.isEditingName;
    if (!this.isEditingName) {
      this.channelName = this.data.name;
    }
  }

  toggleEditDescription(): void {
    this.isEditingDescription = !this.isEditingDescription;
    if (!this.isEditingDescription) {
      this.channelDescription = this.data.description || '';
    }
    if (this.isEditingDescription) {
      setTimeout(() => {
        this.adjustAllTextareas();
      });
    }
  }

  async saveChanges(): Promise<void> {
    try {
      const updates: any = {};
      if (this.isEditingName) {
        updates.name = this.channelName;
      }
      if (this.isEditingDescription) {
        updates.description = this.channelDescription;
      }

      await this.chatService.updateChannel(this.data.channelId, updates);

      if (this.isEditingName) {
        this.data.name = this.channelName;
        this.isEditingName = false;
      }
      if (this.isEditingDescription) {
        this.data.description = this.channelDescription;
        this.isEditingDescription = false;
      }
    } catch (error) {
      console.error('Error updating channel:', error);
    }
  }

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
