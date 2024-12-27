import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { InputOutput } from '../../service/input-output.service';

@Component({
  selector: 'app-main-chat-daily-messages',
  standalone: true,
  imports: [MATERIAL_MODULES, UserMessageComponent],
  templateUrl: './main-chat-daily-messages.component.html',
  styleUrl: './main-chat-daily-messages.component.scss',
})
export class MainChatDailyMessagesComponent implements OnInit {
  public threadMessage: boolean = false; // Geändert zu false
  private inputOutputService = inject(InputOutput);

  @Output() openThreadEvent = new EventEmitter<void>();

  ngOnInit(): void {
    this.inputOutputService.setThreadMessageStyle(this.threadMessage);
  }

  openThread() {
    this.openThreadEvent.emit();
  }
}
