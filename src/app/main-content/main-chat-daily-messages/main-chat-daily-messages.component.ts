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
threadMessage: boolean = true;

  @Output() openThreadEvent = new EventEmitter<void>();

  constructor(public inputOutputService: InputOutput) {}

  ngOnInit() {
    // this.inputOutputService.threadMessage$.subscribe((status) => {
    //   this.threadMessage = status;
    // });
  }

  openThread() {
    this.openThreadEvent.emit();
  }

}