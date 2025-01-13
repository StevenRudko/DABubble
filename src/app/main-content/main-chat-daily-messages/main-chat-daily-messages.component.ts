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
import { Observable, Subscription, combineLatest } from 'rxjs';
import { UserData } from '../../service/user-data.service';
import {
  UserMessageInterface,
  renderMessageInterface,
} from '../../models/user-message';
import { CommonModule } from '@angular/common';
import { UserInterface } from '../../models/user-interface';
import { ChatService } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';

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

  emojiList: { [key: string]: string } = {
    rocket: '🚀',
    smile: '😊',
    heart: '❤️',
    laughing: '😂',
    thumbsUp: '👍',
    star: '⭐',
  };

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  private isUserScrolled = false;

  timeDateToday: any;
  msgTime: any;
  msgDateTime: any;
  todayDateTime: any;
  msgTimeHours: any;
  msgTimeMins: any;
  userName: string = '';
  currentUser: string = '';
  ownMessageStyle: boolean = false;
  // userMessageDate: any = undefined;
  userMessages: UserMessageInterface[] = [];
  userMessages$: Observable<any> = new Observable<any>();
  user: UserInterface[] = [];
  users$: Observable<any> = new Observable<any>();
  subscription!: Subscription; // Das ! sagt TypeScript, dass wir uns um die Initialisierung kümmern

  allMsgToday: renderMessageInterface[] = [];
  allMsgPast: renderMessageInterface[] = [];
  groupedMessages: { [date: string]: renderMessageInterface[] } = {};

  constructor(
    private userData: UserData,
    private cdr: ChangeDetectorRef,
    private chatService: ChatService, // NEU: ChatService hinzufügen
    private authService: AuthService // NEU
  ) {}

  // abonniert die Daten aus der DB und ruft die init-Funtkion auf
  ngOnInit(): Promise<void> {
    this.subscription = combineLatest([
      this.userData.users$,
      this.userData.userMessages$,
      this.chatService.currentChannel$,
      this.chatService.currentDirectUser$,
      this.authService.user$,
    ]).subscribe(
      ([users, messages, currentChannel, directUser, currentAuthUser]) => {
        this.user = users;

        if (currentChannel) {
          // Channel Nachrichten
          this.userMessages = messages.filter(
            (msg) =>
              msg.channelId && msg.channelId.toString() === currentChannel.id
          );
        } else if (directUser && currentAuthUser) {
          // Direkt Nachrichten
          this.userMessages = messages.filter((msg) => {
            const isDirectMessage = !!msg.directUserId; // Prüfen ob directUserId existiert
            const isMessageBetweenUsers =
              // Ich sende an den anderen
              (msg.authorId === currentAuthUser.uid &&
                msg.directUserId === directUser.uid) ||
              // Der andere sendet an mich
              (msg.authorId === directUser.uid &&
                msg.directUserId === currentAuthUser.uid);
            return isDirectMessage && isMessageBetweenUsers;
          });
        } else {
          this.userMessages = [];
        }

        // Arrays leeren vor dem Neuladen
        this.allMsgToday = [];
        this.allMsgPast = [];

        this.initChat();
      }
    );
    return Promise.resolve();
  }

  // Abo auflösen
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Alle Funktionen werden hier initialisiert
  initChat() {
    this.getTimeToday();
    this.loadMessages();
    this.loadOldMessages();
    console.log(this.emojiList['rocket']);
  }

  // ruft das heutige Datum ab und wandelt es ins entsprechende Format um
  getTimeToday() {
    const todayTimeStamp = new Date().getTime();
    this.timeDateToday = this.formatTimeStamp(todayTimeStamp);
  }

  // nimmt nur die brauchbaren Elemente vom Datum heraus
  formatTimeStamp(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getDate()} ${
      this.months[date.getMonth()]
    } ${date.getFullYear()}`;
  }

  // lädt und verarbeitet die Daten aus der DB weiter
  loadMessages() {
    if (!this.userMessages) {
      console.error('No userMessages found.');
      return;
    }

    // Arrays vor dem Laden leeren
    this.allMsgToday = [];
    this.allMsgPast = [];

    this.userMessages.forEach((msg: UserMessageInterface) => {
      this.getMsgTime(msg);
      this.getUserName(msg);
      this.getAllMessagesPast(msg);
      this.getAllMessagesToday(msg);
      this.changeMessageStyle(msg);
    });
  }

  // vearbeitet die msg time in verschiedene Formate um
  getMsgTime(msg: UserMessageInterface) {
    const timestamp: any = msg.time;
    const msgTimeStampSeconds = timestamp.seconds;
    const msgTimeStampNano = timestamp.nanoseconds;
    this.msgTime = msgTimeStampSeconds * 1000 + msgTimeStampNano / 1000000;

    this.msgDateTime = new Date(this.msgTime);
    this.msgDateTime.setHours(0, 0, 0, 0); // Uhrzeit auf Mitternacht setzen, da nur der Tag für uns relevant ist

    this.todayDateTime = new Date(this.timeDateToday);
    this.todayDateTime.setHours(0, 0, 0, 0);

    const exactTime = new Date(this.msgTime);
    this.msgTimeHours = exactTime.getHours();
    this.msgTimeMins = exactTime.getMinutes();
  }

  // holt sich den usernamen aus der anderen Sammlung entsprechend der authorId
  getUserName(msg: UserMessageInterface) {
    // console.log('dies sind die user: ', this.user);
    const userFound = this.user.find(
      (user: UserInterface) => user.localID === msg.authorId
    );
    if (userFound) {
      // console.log('authorId: ', msg.authorId);
      // console.log('loaclId ', userFound.localID);
      this.userName = userFound.username;
      // console.log('UserName: ', this.userName);
    } else {
      // return console.error('leider konnte der User nicht gefunden werden');
    }
  }

  // lädt alle alten Nachrichten in das Array allMsgPast
  getAllMessagesPast(msg: UserMessageInterface) {
    if (this.userName) {
      if (this.msgDateTime < this.todayDateTime) {
        if (!this.allMsgPast.find((msg) => msg.timestamp === this.msgTime)) {
          // Damit sich Nachrichten nicht doppeln
          this.allMsgPast.push({
            timestamp: this.msgTime,
            userMessageId: msg.userMessageId,
            author: this.userName,
            emojis: msg.emojis,
            message: msg.message,
            hours: this.msgTimeHours,
            minutes: this.msgTimeMins,
          });
        }
      }
    } else {
      // console.error('userName nicht vorhanden');
    }

    // console.log('Alle Nachrichten aus der Vergangenheit: ', this.allMsgPast);
  }

  // lädt alle alten Nachrichten in das Array allMsgToday
  getAllMessagesToday(msg: UserMessageInterface) {
    if (this.userName) {
      if (this.msgDateTime.getTime() === this.todayDateTime.getTime()) {
        if (!this.allMsgToday.find((msg) => msg.timestamp === this.msgTime)) {
          // Damit sich Nachrichten nicht doppeln
          this.allMsgToday.push({
            timestamp: this.msgTime,
            author: this.userName,
            userMessageId: msg.userMessageId,
            message: msg.message,
            emojis: msg.emojis,
            hours: this.msgTimeHours,
            minutes: this.msgTimeMins,
          });
          this.allMsgToday.sort((a, b) => a.timestamp - b.timestamp); // Nachrichten werden dem Datum nach sortiert
        }
      }
    } else {
      // console.error('userName nicht vorhanden');
    }
    // console.log('Alle Nachrichten von Heute: ', this.allMsgToday);
  }

  changeMessageStyle(msg: UserMessageInterface) {
    if (msg.authorId === this.currentUser) {
      this.ownMessageStyle = true;
    } else {
      this.ownMessageStyle = false;
    }
  }

  loadOldMessages() {
    // console.log('Das sind die alten Nachrichten: ', this.allMsgPast);
    this.allMsgPast.sort((a, b) => a.timestamp - b.timestamp);
    this.groupedMessages = {};

    this.allMsgPast.forEach((msg) => {
      const time = this.formatTimeStamp(msg.timestamp);
      // console.log('time der alten Nachrichten: ', time);
      if (!this.groupedMessages[time]) {
        this.groupedMessages[time] = [];
      }
      this.groupedMessages[time].push(msg);
      // console.log('groupedMessages: ', this.groupedMessages);
    });
  }

  openThread() {
    this.openThreadEvent.emit();
  }

  getMessagesToday(): renderMessageInterface[] {
    return this.allMsgToday;
  }

  getMessagesPast(): renderMessageInterface[] {
    return this.allMsgPast;
  }

  getGroupedMessages(): renderMessageInterface[] {
    // Extrahiere alle Nachrichten aus den Gruppen und flache sie in ein einzelnes Array ab
    const allGroupedMessages: renderMessageInterface[] = [];

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

  trackByDate(index: number, group: any): string {
    return group[0]?.timestamp; // Einzigartiger Schlüssel für die Datumsgruppe
  }

  trackByMessage(index: number, msg: any): number {
    return msg.timestamp; // Einzigartiger Schlüssel für jede Nachricht
  }
}
