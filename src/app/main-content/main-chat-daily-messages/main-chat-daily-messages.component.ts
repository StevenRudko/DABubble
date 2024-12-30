import { Component, Output, EventEmitter } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';
import { InputOutput } from '../../service/input-output.service';
import { UserMessage } from '../../models/user-message';
import { Observable } from 'rxjs';
import { UserData } from '../../service/user-data.service';
import { Firestore } from '@angular/fire/firestore';
@Component({
  selector: 'app-main-chat-daily-messages',
  standalone: true,
  imports: [MATERIAL_MODULES, UserMessageComponent],
  templateUrl: './main-chat-daily-messages.component.html',
  styleUrl: './main-chat-daily-messages.component.scss',
})
export class MainChatDailyMessagesComponent {
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
  // userMessages$: Observable<UserMessage[]>; // Observable, das in der Template mit async benutzt wird
  // userMessages: UserMessage[] = [];
  userMessage = new UserMessage();
  userMessages: any[] = [];

  constructor(private UserData : UserData) {
    // private inputOutputService: InputOutput
    this.UserData.getUserMessages(); // Wir holen die Nachrichten beim Initialisieren der Komponente
    this.userMessages = this.UserData.userMessages; // Setzen des Observables für die Nachrichten
    console.log('data: ', this.UserData.userMessages);
  }

  async ngOnInit(): Promise<void> {
    // await this.loadUserMessages();
    this.next();
  }

  // async loadUserMessages() {
  //   // Abonnieren des Observables und Loggen der geladenen Nachrichten
  //   this.userMessages$.subscribe((messages) => {
  //     this.userMessages = messages;
  //     console.log('Alle Nachrichten: ', this.userMessages);
  //     // console.log('Alle Nachrichten: ', this.userMessages); // Konsolen-Log, sobald Nachrichten geladen sind
  //   });
  // }

  next() {

    // Logik nach dem Laden der Nachrichten
    let messageTime = this.getFormattedDate(this.messageTimeStamp);
    this.getTimeStampToday();
    let currentTime = this.getFormattedDate(this.currentTimeStamp);
    let resultDate = this.compareBothDate(messageTime, currentTime);
    this.userMessageDate = this.formatedResult(resultDate);
  }

  openThread() {
    this.openThreadEvent.emit();
  }

  // getTime(): void {
  //   console.log('userMessages:', this.userMessages); // Überprüfen, ob die Daten nun vorhanden sind

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

  // Eine bestimmte userMessage finden
  // bestimmteUserMessageFinden() {
  //   this.userMessages$.subscribe((messages) => {
  //     if (messages.length > 0) {
  //       console.log('Erste Nachricht: ', messages[0]);
  //     } else {
  //       console.log('Keine Nachrichten vorhanden.');
  //     }
  //   });
  // }

  // // Nachrichten filtern nach ChannelId
  // userMessagesFilternNachChannel() {
  //   // Filtere die Nachrichten mit channelId == 1
  //   this.filteredMessages$ = this.userMessages$.pipe(
  //     map((messages) => messages.filter((message) => message.channelId === 1))
  //   );

  //   // Logge die gefilterten Nachrichten
  //   this.filteredMessages$.subscribe((filteredMessages) => {
  //     console.log('Gefilterte Nachrichten mit channelId 1: ', filteredMessages);
  //   });
  // }

  getTimeStampToday() {
    const today = new Date();
    this.currentTimeStamp = today.getTime();
    // console.log('TimeStampToday ', this.currentTimeStamp);
  }

  getFormattedDate(timestamp: number): string {
    const date = new Date(timestamp);

    // Extrahiere Tag, Monat und Jahr
    const day = date.getDate(); // Tag des Monats
    const month = this.months[date.getMonth()]; // Monat (von 0 bis 11)
    const year = date.getFullYear(); // Jahr

    // Rückgabe im Format: "Tag Monat Jahr"
    return `${day} ${month} ${year}`;
  }

  compareBothDate(messageTime: any, currentTime: any) {
    // console.log('messageTime ', messageTime);
    // console.log('currentTime ', currentTime);

    if (messageTime < currentTime) {
      // console.log('Älter');
      return messageTime;
    } else if (messageTime === currentTime) {
      // console.log('Heute');
      return 'Heute';
    } else {
      return console.error('Fehler beim Verlgeichen der Daten');
    }
  }

  formatedResult(resultDate: string) {
    // Wenn resultDate 'Heute' ist, gib es einfach zurück
    if (resultDate === 'Heute') {
      return resultDate;
    }

    // Umwandlung des resultDate in ein Date-Objekt
    const dateParts = resultDate.split(' '); // Teile das Datum in Tag, Monat und Jahr
    const day = parseInt(dateParts[0], 10); // Tag (z.B. 25)
    const month = dateParts[1]; // Monat (z.B. Dezember)
    const year = parseInt(dateParts[2], 10); // Jahr (z.B. 2024)
    const date = new Date(year, this.months.indexOf(month), day); // Jahr, Monat (Index), Tag     // Erstelle ein Date-Objekt aus den extrahierten Teilen
    const weekday = this.days[date.getDay()]; // z.B. "Dienstag"     // Hole den Wochentag
    const formattedMonth = this.months[date.getMonth()]; // z.B. "Januar"     // Hole den Monat als Index
    return `${weekday}, ${day} ${formattedMonth}`; // Gib das Datum im gewünschten Format zurück
  }
}
