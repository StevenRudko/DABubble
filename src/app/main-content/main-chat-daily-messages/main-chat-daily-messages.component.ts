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
import { MatDialog } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../shared/profile-overview/profile-overview.component';
import { UserOverviewComponent } from '../../shared/user-overview/user-overview.component';
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
  emojiList: { [key: string]: string } = {};
  userMessages: UserMessageInterface[] = [];
  userMessages$: Observable<any> = new Observable<any>();
  user: UserInterface[] = [];
  users$: Observable<any> = new Observable<any>();
  subscription!: Subscription; // Das ! sagt TypeScript, dass wir uns um die Initialisierung kümmern

  allMessages: renderMessageInterface[] = [];
  // allMsgPast: renderMessageInterface[] = [];
  groupedMessages: { [date: string]: renderMessageInterface[] } = {};
  currentAuthUser: any;
  currentDirectUser: any;
  currentChannel$: Observable<any>;
  currentDirectUser$: Observable<any>;
  isNewMessage$: Observable<boolean>;

  constructor(
    private userData: UserData,
    private cdr: ChangeDetectorRef,
    public chatService: ChatService, // NEU: ChatService hinzufügen
    private authService: AuthService, // NEU
    private dialog: MatDialog // NEU
  ) {
    this.currentChannel$ = this.chatService.currentChannel$;
    this.currentDirectUser$ = this.chatService.currentDirectUser$;
    this.isNewMessage$ = this.chatService.isNewMessage$;
  }

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
        this.currentAuthUser = currentAuthUser;
        this.currentDirectUser = directUser;

        // Der Rest der Logik bleibt gleich
        if (currentChannel) {
          this.userMessages = messages.filter(
            (msg) =>
              msg.channelId && msg.channelId.toString() === currentChannel.id
          );
        } else if (directUser && currentAuthUser) {
          this.userMessages = messages.filter((msg) => {
            const isDirectMessage = !!msg.directUserId;
            const isMessageBetweenUsers =
              (msg.authorId === currentAuthUser.uid &&
                msg.directUserId === directUser.uid) ||
              (msg.authorId === directUser.uid &&
                msg.directUserId === currentAuthUser.uid);
            return isDirectMessage && isMessageBetweenUsers;
          });
        } else {
          this.userMessages = [];
        }

        this.allMessages = [];
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
    // this.loadOldMessages();
    // console.log(this.emojiList['rocket']);
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
  // Lädt und verarbeitet die Nachrichten, sortiert und gruppiert sie nach Datum
  loadMessages() {
    if (!this.userMessages) {
      console.error('No userMessages found.');
      return;
    }

    // Wenn die Nachrichten bereits geladen wurden, beende die Funktion
    if (this.allMessages.length > 0) {
      return;
    }

    // Arrays vor dem Laden leeren
    this.allMessages = [];
    this.groupedMessages = {};

    this.userMessages.forEach((msg: UserMessageInterface) => {
      this.getMsgTime(msg);
      this.getUserName(msg);
      this.getAllMessages(msg);
    });

    // Sortiere alle Nachrichten nach dem Zeitstempel (älteste zuerst)
    this.sortMessagesByTime();

    // Gruppiere die Nachrichten nach Datum
    this.groupMessagesByDate();
  }

  formatTimeUnit(unit: number): string {
    return unit < 10 ? `0${unit}` : `${unit}`;
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
    this.msgTimeHours = this.formatTimeUnit(exactTime.getHours()); // Formatieren der Stunden
    this.msgTimeMins = this.formatTimeUnit(exactTime.getMinutes()); // Formatieren der Minuten
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

  // lädt alle alten Nachrichten in das Array allMessages
  getAllMessages(msg: UserMessageInterface) {
    if (this.userName) {
      this.allMessages.push({
        timestamp: this.msgTime,
        userMessageId: msg.userMessageId,
        author: this.userName,
        emojis: msg.emojis,
        message: msg.message,
        isOwnMessage: (msg.isOwnMessage = msg.authorId === this.currentAuthUser.uid),
        hours: this.msgTimeHours,
        minutes: this.msgTimeMins,
      });
    }
  }

  sortMessagesByTime() {
    this.allMessages.sort((a, b) => a.timestamp - b.timestamp); // Sortierung in aufsteigender Reihenfolge
  }

  // Funktion zum Gruppieren der Nachrichten nach Datum
  groupMessagesByDate() {
    const today = new Date().setHours(0, 0, 0, 0); // Setzt heute auf Mitternacht (00:00)

    this.allMessages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp).setHours(0, 0, 0, 0); // Setzt die Nachricht auf Mitternacht

      const dateKey = msgDate === today ? 'HEUTE' : msgDate.toString(); // "HEUTE" für Nachrichten vom heutigen Tag

      // Gruppiere Nachrichten nach Datum
      if (!this.groupedMessages[dateKey]) {
        this.groupedMessages[dateKey] = [];
      }
      // Überprüfen, ob die Nachricht bereits hinzugefügt wurde, um Duplikate zu vermeiden
      if (
        !this.groupedMessages[dateKey].some(
          (existingMsg) => existingMsg.userMessageId === msg.userMessageId
        )
      ) {
        this.groupedMessages[dateKey].push(msg);
      }
    });

    // Für das heutige Datum die "HEUTE"-Nachrichten ans Ende verschieben
    if (this.groupedMessages['HEUTE']) {
      const todayMessages = this.groupedMessages['HEUTE'];
      delete this.groupedMessages['HEUTE'];
      this.groupedMessages['HEUTE'] = todayMessages;
    }
  }

  openThread() {
    this.openThreadEvent.emit();
  }

  getMessages(): renderMessageInterface[] {
    return this.allMessages;
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
  // Neue Methoden:
  getCurrentUserPhotoURL(): string {
    if (this.currentDirectUser) {
      return (
        this.currentDirectUser.photoURL || 'img-placeholder/default-avatar.svg'
      );
    }
    return (
      this.currentAuthUser?.photoURL || 'img-placeholder/default-avatar.svg'
    );
  }

  getCurrentUserName(): string {
    if (this.currentDirectUser) {
      return (
        this.currentDirectUser.username ||
        this.currentDirectUser.displayName ||
        'Unbenannter Benutzer'
      );
    }
    return this.currentAuthUser?.displayName || 'Du';
  }

  getCurrentUserEmail(): string {
    if (this.currentDirectUser) {
      return this.currentDirectUser.email || '';
    }
    return this.currentAuthUser?.email || '';
  }

  /**
   * Opens the profile dialog for a user
   * Shows UserOverviewComponent for own profile or ProfileOverviewComponent for other users
   */
  openProfileDialog() {
    const isOwnProfile =
      !this.currentDirectUser ||
      this.currentDirectUser.uid === this.currentAuthUser?.uid;

    if (isOwnProfile) {
      this.dialog.open(UserOverviewComponent, {
        panelClass: ['profile-dialog', 'right-aligned'],
        width: '400px',
      });
      return;
    }

    // Direkt die Daten aus currentDirectUser verwenden
    const userData = {
      username: this.currentDirectUser.username,
      email: this.currentDirectUser.email,
      photoURL:
        this.currentDirectUser.photoURL || 'img-placeholder/default-avatar.svg',
      uid: this.currentDirectUser.uid,
    };

    this.dialog.open(ProfileOverviewComponent, {
      data: userData,
      panelClass: ['profile-dialog', 'center-aligned'],
      width: '400px',
    });
  }

  isOwnProfile(): boolean {
    return (
      !this.currentDirectUser ||
      this.currentDirectUser.uid === this.currentAuthUser?.uid
    );
  }

  /**
   * Gets the formatted creation time string for a channel
   */
  getChannelCreationTime(createdAt: string): string {
    const creationDate = new Date(createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (creationDate >= today) {
      return 'heute';
    } else if (creationDate >= yesterday) {
      return 'gestern';
    } else {
      return `am ${creationDate.getDate()}. ${
        this.months[creationDate.getMonth()]
      } ${creationDate.getFullYear()}`;
    }
  }
}
