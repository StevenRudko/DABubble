import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { Observable, Subscription } from 'rxjs';
import { UserData } from '../../service/user-data.service';
import { UserMessageInterface } from '../../models/user-message';
import { CommonModule, NgIf } from '@angular/common';
import { ChatService } from '../../service/chat.service';

interface MessageItem {
  timestamp: number;
  userId: number;
  message: string;
  hours: number;
  minutes: number;
}

@Component({
  selector: 'app-main-chat-daily-messages',
  standalone: true,
  imports: [MATERIAL_MODULES, CommonModule, UserMessageComponent],
  templateUrl: './main-chat-daily-messages.component.html',
  styleUrl: './main-chat-daily-messages.component.scss',
})
export class MainChatDailyMessagesComponent implements OnInit, OnDestroy {
  @Output() openThreadEvent = new EventEmitter<void>();
  @ViewChild('chatContainer') chatContainer!: ElementRef;

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

  dateToday = new Date();
  timeToday: any;
  messageTime: any;
  userMessageDate: any = undefined;
  userMessages: UserMessageInterface[] = [];
  private subscription = new Subscription();
  private isUserScrolled = false;

  // Message arrays
  allMsgToday: MessageItem[] = [];
  allMsgPast: MessageItem[] = [];
  groupedMessages: { [date: string]: MessageItem[] } = {};

  constructor(
    private userData: UserData,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.userData.userMessages$.subscribe((messages) => {
        this.userMessages = messages;
        this.getTimeToday();
        this.loadMessages();
        this.loadOldMessages();
      })
    );

    this.subscription.add(
      this.chatService.messages$.subscribe((messages) => {
        if (messages && messages.length > 0) {
          this.userMessages = this.mapMessages(messages);
          this.getTimeToday();
          this.loadMessages();
          this.loadOldMessages();
        }
      })
    );
  }

  private mapMessages(messages: any[]): UserMessageInterface[] {
    return messages.map((msg) => ({
      ...msg,
      comments: msg.comments || {},
      emojis: msg.emojis || {},
    }));
  }

  // Deine bestehenden Methoden bleiben unverändert...
  getTimeToday() {
    const todayTimeStamp = this.dateToday.getTime();
    this.timeToday = this.formatTimeStamp(todayTimeStamp);
  }

  getMsgTime(timeStamp: any): void {
    this.messageTime = this.formatTimeStamp(timeStamp);
  }

  formatTimeStamp(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = this.months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  loadMessages() {
    console.log('Hier sind die user Messages endlich: ', this.userMessages);
    if (this.userMessages) {
      const timestampArr: any = [];
      this.userMessages.forEach((message: UserMessageInterface) => {
        const timestamp: any = message.time;
        const msgTimeStampSeconds = timestamp.seconds;
        const msgTimeStampNano = timestamp.nanoseconds;
        const millis = msgTimeStampSeconds * 1000 + msgTimeStampNano / 1000000;

        const msgTime1 = new Date(millis);
        const todayTime1 = new Date(this.timeToday);
        msgTime1.setHours(0, 0, 0, 0);
        todayTime1.setHours(0, 0, 0, 0);

        const exactTime = new Date(millis);
        const timeHours = exactTime.getHours();
        const timeMinutes = exactTime.getMinutes();

        if (msgTime1 < todayTime1) {
          console.log('Älter');

          if (!this.allMsgPast.find((msg) => msg.timestamp === millis)) {
            this.allMsgPast.push({
              timestamp: millis,
              userId: message.directUserId,
              message: message.message,
              hours: timeHours,
              minutes: timeMinutes,
            });
          }
        } else if (msgTime1.getTime() === todayTime1.getTime()) {
          if (!this.allMsgToday.find((msg) => msg.timestamp === millis)) {
            this.allMsgToday.push({
              timestamp: millis,
              userId: message.directUserId,
              message: message.message,
              hours: timeHours,
              minutes: timeMinutes,
            });

            this.allMsgToday.sort((a, b) => a.timestamp - b.timestamp);
          }
        }
      });
    }

    this.loadMessagesToday();
  }

  loadMessagesToday() {}

  loadOldMessages() {
    console.log('Das sind die alten Nachrichten: ', this.allMsgPast);
    this.allMsgPast.sort((a, b) => a.timestamp - b.timestamp);
    this.groupedMessages = {};

    this.allMsgPast.forEach((msg) => {
      const time = this.formatTimeStamp(msg.timestamp);
      if (!this.groupedMessages[time]) {
        this.groupedMessages[time] = [];
      }
      this.groupedMessages[time].push(msg);
    });
  }

  getMessagesToday(): MessageItem[] {
    return this.allMsgToday;
  }

  getGroupedMessages(): MessageItem[] {
    return this.allMsgPast;
  }

  onScroll() {
    const container = this.chatContainer.nativeElement;
    this.isUserScrolled =
      container.scrollTop + container.clientHeight <
      container.scrollHeight - 10;
  }

  openThread() {
    this.openThreadEvent.emit();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const container = this.chatContainer?.nativeElement;
    if (container && !this.isUserScrolled) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
