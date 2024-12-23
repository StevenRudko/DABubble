import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MessageEmojisComponent } from '../message-emojis/message-emojis.component';
import { NgIf } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [MessageEmojisComponent, MATERIAL_MODULES, NgIf],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  @Input() showBottomRow: boolean = true;
  messageTime: number = 0;
  currentTimeStamp: number = 0;
  isHoveredActive: boolean = false;
  @Output() openThreadEvent = new EventEmitter<void>();

  constructor() {}

  onMouseEnter() {
    this.isHoveredActive = true;
  }

  onMouseLeave() {
    this.isHoveredActive = false;
  }

  exampleDate() {
    // Beispiel Datum -> entfernen wenn Datum aus Database kommt
    const messageDate = new Date('2024-12-22T00:00:00');
    this.messageTime = messageDate.getTime();
    console.log('messageTime ', this.messageTime);
  }

  getCurrentTimeStamp() {
    const today = new Date();
    this.currentTimeStamp = today.getTime();
    console.log('currentTimeStamp ', this.currentTimeStamp);
  }

  getFormattedDate(timestamp: number): string {
    const date = new Date(timestamp);
    // Array für die Monatsnamen
    const months = [
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

    // Extrahiere Tag, Monat und Jahr
    const day = date.getDate(); // Tag des Monats
    const month = months[date.getMonth()]; // Monat (von 0 bis 11)
    const year = date.getFullYear(); // Jahr

    // Rückgabe im Format: "Tag Monat Jahr"
    return `${day} ${month} ${year}`;
  }

  compareBothDate(currentDate: any, today: any) {
    console.log('currentDate ', currentDate);
    console.log('today ', today);
  }

  openThread() {
    this.openThreadEvent.emit();
  }
}
