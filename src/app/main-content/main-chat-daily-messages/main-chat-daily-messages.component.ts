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
export class MainChatDailyMessagesComponent implements OnInit{
  public threadMessage: boolean = true;
  private inputOutputService = inject(InputOutput); // Service injizieren

  @Output() openThreadEvent = new EventEmitter<void>();

  ngOnInit() {
    // Abonniere den Service, um auf Änderungen von threadMessage zu reagieren
    this.inputOutputService.threadMessage$.subscribe((status) => {
      this.threadMessage = status;
      console.log( this.threadMessage = status);
    });
  }

  openThread() {
    this.openThreadEvent.emit();
  }

}
