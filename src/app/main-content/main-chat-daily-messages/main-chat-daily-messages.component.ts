import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { Observable, Subscription } from 'rxjs';
import { UserData } from '../../service/user-data.service';
import { UserMessageInterface } from '../../models/user-message';

@Component({
  selector: 'app-main-chat-daily-messages',
  standalone: true,
  imports: [MATERIAL_MODULES, UserMessageComponent],
  templateUrl: './main-chat-daily-messages.component.html',
  styleUrl: './main-chat-daily-messages.component.scss',
})

export class MainChatDailyMessagesComponent implements OnInit, OnDestroy {
  @Output() openThreadEvent = new EventEmitter<void>();

  months = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];
  days = [
    'Sonntag',
    'Montag',
    'Dienstag',
    'Mittwoch',
    'Donnerstag',
    'Freitag',
    'Samstag',
  ];

  messageTimeStamp: number = 0;
  currentTimeStamp: number = 0;
  userMessageDate: any = undefined;
  userMessages: UserMessageInterface[] = [];
  userMessages$: Observable<any> = new Observable<any>();
  private subscription!: Subscription; // Das ! sagt TypeScript, dass wir uns um die Initialisierung kümmern

  constructor(private userData: UserData) {
    this.subscription = this.userData.userMessages$.subscribe((messages) => {
      this.userMessages = messages;
      this.next();
    });
  }

  ngOnInit(): Promise<void> {
    this.next();
    return Promise.resolve();
  }

  next() {
    console.log('Hier sind die user Messages endlich: ', this.userMessages);
    // let messageTime = this.getFormattedDate(this.messageTimeStamp);
    // this.getTimeStampToday();
    // let currentTime = this.getFormattedDate(this.currentTimeStamp);
    // let resultDate = this.compareBothDate(messageTime, currentTime);
    // this.userMessageDate = this.formatedResult(resultDate);
  }

  openThread() {
    this.openThreadEvent.emit();
  }

  // getTime(): void {
  //   if (this.userMessages) {
  //     this.userMessages.forEach((message: UserMessage) => {
  //       const timestamp = message.time;
  //       const messageId = message.userMessageId;
  //       console.log('Timestamp:', timestamp);
  //       console.log('messageId:', messageId);
  //     });
  //   } else {
  //     console.log('No userMessages found.');
  //   }
  // }

  // bestimmteUserMessageFinden() {
  //   if (this.userMessages.length > 0) {
  //     console.log('Erste Nachricht:', this.userMessages[0]);
  //   } else {
  //     console.log('Keine Nachrichten vorhanden.');
  //   }
  // }

  // userMessagesFilternNachChannel(channelId: number) {
  //   const filteredMessages = this.userMessages.filter(
  //     (message) => message.channelId === channelId
  //   );
  //   console.log(
  //     'Gefilterte Nachrichten mit channelId',
  //     channelId,
  //     ':',
  //     filteredMessages
  //   );
  //   return filteredMessages;
  // }

  // getTimeStampToday() {
  //   const today = new Date();
  //   this.currentTimeStamp = today.getTime();
  // }

  // getFormattedDate(timestamp: number): string {
  //   const date = new Date(timestamp);

  //   const day = date.getDate();
  //   const month = this.months[date.getMonth()];
  //   const year = date.getFullYear();

  //   return `${day} ${month} ${year}`;
  // }

  // compareBothDate(messageTime: any, currentTime: any) {
  //   if (messageTime < currentTime) {
  //     return messageTime;
  //   } else if (messageTime === currentTime) {
  //     return 'Heute';
  //   } else {
  //     return console.error('Fehler beim Vergleichen der Daten');
  //   }
  // }

  // formatedResult(resultDate: string) {
  //   if (resultDate === 'Heute') {
  //     return resultDate;
  //   }

  //   const dateParts = resultDate.split(' ');
  //   const day = parseInt(dateParts[0], 10);
  //   const month = dateParts[1];
  //   const year = parseInt(dateParts[2], 10);
  //   const date = new Date(year, this.months.indexOf(month), day);
  //   const weekday = this.days[date.getDay()];
  //   const formattedMonth = this.months[date.getMonth()];

  //   return `${weekday}, ${day} ${formattedMonth}`;
  // }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
