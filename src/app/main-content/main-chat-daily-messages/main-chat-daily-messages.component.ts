import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { Observable, Subscription } from 'rxjs';
import { UserData } from '../../service/user-data.service';
import { UserMessageInterface } from '../../models/user-message';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../service/chat.service';

interface MessageItem {
  timestamp: number;
  userId: number; // Änderung von string zu number
  message: string;
  hours: number;
  minutes: number;
  authorId?: string;
  channelId?: string;
  directUserId?: string;
  emojis?: any;
  comments?: any;
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

  allMsgToday: MessageItem[] = [];
  allMsgPast: MessageItem[] = [];
  groupedMessages: { [date: string]: MessageItem[] } = {};

  constructor(
    private userData: UserData,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Behalte existierende UserData Subscription
    this.subscription.add(
      this.userData.userMessages$.subscribe((messages) => {
        this.userMessages = messages;
        this.getTimeToday();
        this.loadMessages();
        this.loadOldMessages();
      })
    );

    // Füge ChatService Subscription hinzu
    this.subscription.add(
      this.chatService.messages$.subscribe((messages) => {
        if (messages && messages.length > 0) {
          this.userMessages = this.mapMessages(messages);
          this.getTimeToday();
          this.loadMessages();
          this.loadOldMessages();
          if (!this.isUserScrolled) {
            this.scrollToBottom();
          }
        }
      })
    );
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

        // Erstelle ein Basis-MessageItem für die UserMessage-Komponente
        const messageItem: MessageItem = {
          timestamp: millis,
          userId: Number(message.directUserId), // Explizite Konvertierung zu number
          message: message.message,
          hours: timeHours,
          minutes: timeMinutes,
          authorId: String(message.authorId || ''),
          channelId: String(message.channelId || ''),
          directUserId: String(message.directUserId || ''),
          emojis: message.emojis,
          comments: message.comments,
        };

        if (msgTime1 < todayTime1) {
          if (!this.allMsgPast.find((msg) => msg.timestamp === millis)) {
            this.allMsgPast.push(messageItem);
          }
        } else if (msgTime1.getTime() === todayTime1.getTime()) {
          if (!this.allMsgToday.find((msg) => msg.timestamp === millis)) {
            this.allMsgToday.push(messageItem);
          }
        }
      });

      this.allMsgToday.sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  loadOldMessages() {
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
