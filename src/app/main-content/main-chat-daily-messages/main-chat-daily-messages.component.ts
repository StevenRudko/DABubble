import { Component, Output, EventEmitter } from '@angular/core';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { UserMessageComponent } from '../../shared/user-message/user-message.component';

@Component({
  selector: 'app-main-chat-daily-messages',
  standalone: true,
  imports: [MATERIAL_MODULES, UserMessageComponent],
  templateUrl: './main-chat-daily-messages.component.html',
  styleUrl: './main-chat-daily-messages.component.scss',
})
export class MainChatDailyMessagesComponent{
  @Output() openThreadEvent = new EventEmitter<void>();
  months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  messageTimeStamp: number = 0;
  currentTimeStamp: number = 0;
  userMessageDate: any = undefined;

  constructor() {}

  openThread() {
    this.openThreadEvent.emit();
  }

  ngOnInit(): void {
    this.exampleDate();
    let messageTime = this.getFormattedDate(this.messageTimeStamp);
    this.getTimeStampToday();
    let currentTime = this.getFormattedDate(this.currentTimeStamp);
    let resultDate = this.compareBothDate(messageTime, currentTime);
    this.userMessageDate = this.formatedResult(resultDate);
  }


  // Beispiel Datum -> entfernen wenn Datum aus Database kommt
  exampleDate() {
    const messageDate = new Date('2025-01-14T00:00:00');
    this.messageTimeStamp = messageDate.getTime();
    // console.log('TimeStampExample ', this.messageTimeStamp);
  }

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
    const dateParts = resultDate.split(' ');  // Teile das Datum in Tag, Monat und Jahr
    const day = parseInt(dateParts[0], 10);  // Tag (z.B. 25)
    const month = dateParts[1];  // Monat (z.B. Dezember)
    const year = parseInt(dateParts[2], 10);  // Jahr (z.B. 2024)
    const date = new Date(year,this.months.indexOf(month), day); // Jahr, Monat (Index), Tag     // Erstelle ein Date-Objekt aus den extrahierten Teilen
    const weekday = this.days[date.getDay()];  // z.B. "Dienstag"     // Hole den Wochentag
    const formattedMonth = this.months[date.getMonth()];  // z.B. "Januar"     // Hole den Monat als Index
    return `${weekday}, ${day} ${formattedMonth}`;     // Gib das Datum im gewünschten Format zurück
  }
}
