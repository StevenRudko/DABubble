import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewInit,
  AfterViewChecked,
} from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { Observable, Subscription } from 'rxjs';
import { UserData } from '../../service/user-data.service';
import { UserMessageInterface } from '../../models/user-message';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../../models/user-interface';

@Component({
  selector: 'app-main-chat-daily-messages',
  standalone: true,
  imports: [MATERIAL_MODULES, CommonModule, UserMessageComponent],
  templateUrl: './main-chat-daily-messages.component.html',
  styleUrl: './main-chat-daily-messages.component.scss',
})
export class MainChatDailyMessagesComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked
{
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
  timeToday: string = '';
  messageTime: string = '';
  userMessageDate: any = undefined;
  userMessages: UserMessageInterface[] = [];
  userMessages$: Observable<any> = new Observable<any>();
  user: UserInterface[] = [];
  users$: Observable<any> = new Observable<any>();
  private subscription: Subscription = new Subscription();
  isUserScrolled: boolean = false;

  allMsgToday: {
    timestamp: number;
    userMessageId: string;
    author: string;
    message: string;
    hours: number;
    minutes: number;
  }[] = [];

  allMsgPast: {
    timestamp: number;
    userMessageId: string;
    author: string;
    message: string;
    hours: number;
    minutes: number;
  }[] = [];

  groupedMessages: {
    [date: string]: {
      timestamp: number;
      userMessageId: string;
      author: string;
      message: string;
      hours: number;
      minutes: number;
    }[];
  } = {};

  constructor(private userData: UserData, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscription.add(
      this.userData.users$.subscribe((users) => {
        this.user = users;

        this.subscription.add(
          this.userData.userMessages$.subscribe((messages) => {
            this.userMessages = messages;
            this.getTimeToday();
            this.loadMessages();
            this.loadOldMessages();
          })
        );
      })
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private mapMessages(messages: any[]): UserMessageInterface[] {
    return messages.map((msg) => ({
      ...msg,
      comments: msg.comments || {},
      emojis: msg.emojis || {},
      time: msg.time || { seconds: Date.now() / 1000, nanoseconds: 0 },
      directUserId: String(msg.directUserId || ''),
      channelId: String(msg.channelId || ''),
      authorId: String(msg.authorId || ''),
    }));
  }

  getTimeToday(): void {
    const todayTimeStamp = this.dateToday.getTime();
    this.timeToday = this.formatTimeStamp(todayTimeStamp);
  }

  getMsgTime(timeStamp: number): void {
    this.messageTime = this.formatTimeStamp(timeStamp);
  }

  formatTimeStamp(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = this.months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  loadMessages(): void {
    if (this.userMessages) {
      this.allMsgToday = [];
      this.allMsgPast = [];

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
        let userName: string = '';

        const user = this.user.find(
          (user: UserInterface) => user.localID === message.authorId
        );

        if (user) {
          userName = user.username;
        }

        if (msgTime1 < todayTime1) {
          if (!this.allMsgPast.find((msg) => msg.timestamp === millis)) {
            this.allMsgPast.push({
              timestamp: millis,
              userMessageId: message.userMessageId,
              author: userName,
              message: message.message,
              hours: timeHours,
              minutes: timeMinutes,
            });
          }
        } else if (msgTime1.getTime() === todayTime1.getTime()) {
          if (!this.allMsgToday.find((msg) => msg.timestamp === millis)) {
            this.allMsgToday.push({
              timestamp: millis,
              userMessageId: message.userMessageId,
              author: userName,
              message: message.message,
              hours: timeHours,
              minutes: timeMinutes,
            });

            this.allMsgToday.sort((a, b) => a.timestamp - b.timestamp);
          }
        }
      });
    }
  }

  loadOldMessages(): void {
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

  onScroll(): void {
    const container = this.chatContainer.nativeElement;
    this.isUserScrolled =
      container.scrollTop + container.clientHeight <
      container.scrollHeight - 10;
  }

  openThread(): void {
    this.openThreadEvent.emit();
  }

  getMessagesToday() {
    return this.allMsgToday;
  }

  getMessagesPast() {
    return this.allMsgPast;
  }

  getGroupedMessages() {
    const allGroupedMessages: {
      timestamp: number;
      userMessageId: string;
      author: string;
      message: string;
      hours: number;
      minutes: number;
    }[] = [];

    Object.values(this.groupedMessages).forEach((group) => {
      allGroupedMessages.push(...group);
    });
    return allGroupedMessages;
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    const container = this.chatContainer?.nativeElement;
    if (container && !this.isUserScrolled) {
      container.scrollTop = container.scrollHeight;
    }
  }

  trackByDate(index: number, group: any): string {
    return group[0]?.timestamp;
  }

  trackByMessage(index: number, msg: any): number {
    return msg.timestamp;
  }
}
