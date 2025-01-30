import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { UserData } from '../../service/user-data.service';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { MessageInputBoxComponent } from '../../shared/message-input-box/message-input-box.component';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MATERIAL_MODULES, UserMessageComponent, MessageInputBoxComponent],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss',
})
export class ThreadComponent implements OnInit {
  @Input() messageId: string | null = null;
  @Output() closeThreadEvent = new EventEmitter<void>();
  parentMessage: any = null;
  threadMessages: any[] = [];
  replyCount: number = 0;

  constructor(private userData: UserData) {}

  ngOnInit() {
    if (this.messageId) {
      this.loadParentMessage(this.messageId);
      this.loadThreadMessages(this.messageId);
    }
  }

  private async loadParentMessage(messageId: string) {
    // Diese Methode musst du noch im UserData Service erstellen
    const message = await this.userData.getMessage(messageId);
    if (message) {
      this.parentMessage = message;
    }
  }

  private async loadThreadMessages(parentId: string) {
    const comments = await this.userData.getThreadMessages(parentId);
    this.threadMessages = comments;
    this.replyCount = comments.length;
  }

  closeThread() {
    this.closeThreadEvent.emit();
  }
}
