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

@Component({
  selector: 'app-main-chat-daily-messages',
  standalone: true,
  imports: [MATERIAL_MODULES, CommonModule, UserMessageComponent],
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

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  private isUserScrolled = false;

  dateToday = new Date();
  timeToday: any;
  messageTime: any;
  userMessageDate: any = undefined;
  userMessages: UserMessageInterface[] = [];
  userMessages$: Observable<any> = new Observable<any>();
  private subscription!: Subscription; // Das ! sagt TypeScript, dass wir uns um die Initialisierung kümmern
  allMsgToday: {
    timestamp: number;
    userId: number;
    message: string;
    hours: number;
    minutes: number;
  }[] = [];
  allMsgPast: {
    timestamp: number;
    userId: number;
    message: string;
    hours: number;
    minutes: number;
  }[] = [];
  groupedMessages: {
    [date: string]: {
      timestamp: number;
      userId: number;
      message: string;
      hours: number;
      minutes: number;
    }[];
  } = {};

  constructor(private userData: UserData, private cdr: ChangeDetectorRef) {}

  ngOnInit(): Promise<void> {
    this.subscription = this.userData.userMessages$.subscribe((messages) => {
      this.userMessages = messages;
      this.getTimeToday();
      this.loadMessages();
      this.loadOldMessages();
      // this.loadMessagesByTime();
      // this.getTime();
    });
    return Promise.resolve();
  }

  getTimeToday() {
    const todayTimeStamp = this.dateToday.getTime();
    this.timeToday = this.formatTimeStamp(todayTimeStamp);
    // console.log('getFormatTime: ', this.timeToday);
  }

  getMsgTime(timeStamp: any): void {
    this.messageTime = this.formatTimeStamp(timeStamp);
    // console.log('getFormatTime: ', this.messageTime);
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
        // this.getMsgTime(millis);
        // console.log('Datum heute: ', this.timeToday);
        // console.log('Datum message: ', this.messageTime);

        const msgTime1 = new Date(millis);
        const todayTime1 = new Date(this.timeToday);
        // Uhrzeit auf Mitternacht setzen, da nur der Tag für uns relevant ist
        msgTime1.setHours(0, 0, 0, 0);
        todayTime1.setHours(0, 0, 0, 0);
        // console.log('msgTime1: ', msgTime1);
        // console.log('todayTime1: ', todayTime1);
        const exactTime = new Date(millis);
        const timeHours = exactTime.getHours();
        const timeMinutes = exactTime.getMinutes();

        // Vergleiche nur das Datum
        if (msgTime1 < todayTime1) {
          console.log('Älter');

          if (!this.allMsgPast.find((msg) => msg.timestamp === millis)) {
            // Damit sich Nachrichten nicht doppeln
            this.allMsgPast.push({
              timestamp: millis,
              userId: message.directUserId,
              message: message.message,
              hours: timeHours,
              minutes: timeMinutes,
            });
          }

          // console.log('Alle Nachrichten aus der Vergangenheit: ', this.allMsgPast);
        } else if (msgTime1.getTime() === todayTime1.getTime()) {
          if (!this.allMsgToday.find((msg) => msg.timestamp === millis)) {
            // Damit sich Nachrichten nicht doppeln
            this.allMsgToday.push({
              timestamp: millis,
              userId: message.directUserId,
              message: message.message,
              hours: timeHours,
              minutes: timeMinutes,
            });

            this.allMsgToday.sort((a, b) => a.timestamp - b.timestamp); // Nachrichten werden dem Datum nach sortiert
          }
        } else if (msgTime1 > todayTime1) {
          console.log('Zukunft');
        } else {
          return console.error('Fehler beim Vergleichen der Daten');
        }

        // console.log('Timestamp:', timestampSeconds);
        // console.log('messageId:', messageId);
        // timestampArr.push(timestampSeconds);
        // console.log('timestampArr: ', timestampArr);
      });
    } else {
      console.error('No userMessages found.');
    }

    // this.getFormattedDate(this.currentTimeStamp);
    // let messageTime = this.getFormattedDate(this.messageTimeStamp);
    // this.getTimeStampToday();
    //
    // let resultDate = this.compareBothDate(messageTime, currentTime);
    // this.userMessageDate = this.formatedResult(resultDate);
    this.loadMessagesToday();
  }

  loadMessagesToday() {}

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

  loadOldMessages() {
    console.log('Das sind die alten Nachrichten: ', this.allMsgPast);
    this.allMsgPast.sort((a, b) => a.timestamp - b.timestamp);
    this.groupedMessages = {};

    this.allMsgPast.forEach((msg) => {
      const time = this.formatTimeStamp(msg.timestamp);
      console.log('time der alten Nachrichten: ', time);
      if (!this.groupedMessages[time]) {
        this.groupedMessages[time] = [];
      }
      this.groupedMessages[time].push(msg);
      console.log('groupedMessages: ', this.groupedMessages);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  openThread() {
    this.openThreadEvent.emit();
  }

  getMessagesToday(): {
    timestamp: number;
    userId: number;
    message: string;
    hours: number;
    minutes: number;
  }[] {
    return this.allMsgToday;
  }

  getMessagesPast(): {
    timestamp: number;
    userId: number;
    message: string;
    hours: number;
    minutes: number;
  }[] {
    return this.allMsgPast;
  }

  getGroupedMessages(): {
    timestamp: number;
    userId: number;
    message: string;
    hours: number;
    minutes: number;
  }[] {
    // Extrahiere alle Nachrichten aus den Gruppen und flache sie in ein einzelnes Array ab
    const allGroupedMessages: {
      timestamp: number;
      userId: number;
      message: string;
      hours: number;
      minutes: number;
    }[] = [];

    // Iteriere über alle Gruppen (Die Werte der gruppierten Nachrichten)
    Object.values(this.groupedMessages).forEach((group) => {
      allGroupedMessages.push(...group); // Alle Nachrichten der aktuellen Gruppe hinzufügen
    });

    return allGroupedMessages;
  }

  // Methode, um festzustellen, ob der Benutzer nach oben gescrollt hat
  onScroll() {
    const container = this.chatContainer.nativeElement;
    // Überprüfen, ob der Benutzer fast am unteren Ende des Containers ist
    if (
      container.scrollTop + container.clientHeight <
      container.scrollHeight - 10
    ) {
      this.isUserScrolled = true;
    } else {
      this.isUserScrolled = false;
    }
  }

  // Scrollt nach unten, aber nur, wenn der Benutzer nicht nach oben gescrollt hat
  private scrollToBottom(): void {
    const container = this.chatContainer?.nativeElement;
    if (container && !this.isUserScrolled) {
      container.scrollTop = container.scrollHeight;
    }
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    this.scrollToBottom(); // Initiales Scrollen nach unten
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom(); // Nach jeder Änderung das Scrollen ausführen, wenn nötig
  }
}
