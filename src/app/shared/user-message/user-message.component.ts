import { Component, Input, OnInit } from '@angular/core';
import { HoverService } from '../../../service/hover.service';
import { MessageEmojisComponent } from '../message-emojis/message-emojis.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [MessageEmojisComponent, NgIf],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent implements OnInit {
  @Input() showBottomRow: boolean = true;
  messageTime: number = 0;
  currentTimeStamp: number = 0;

  constructor(private hoverService: HoverService) {}

  ngOnInit() {
   this.exampleDate(); // Beispiel Datum für messageTime -> entfernen wenn Datum aus Database kommt
   this.getCurrentTimeStamp();
   const formattedDateToCompareFromExampleDate = this.getFormattedDate(this.messageTime);
   const formattedDateToCompareFromCurrentTimeStamp = this.getFormattedDate(this.currentTimeStamp);
   this.compareBothDate(formattedDateToCompareFromExampleDate, formattedDateToCompareFromCurrentTimeStamp);
  }

  onMouseEnter() {
    this.hoverService.setHoverStatus(true);
  }

  onMouseLeave() {
    this.hoverService.setHoverStatus(false);
  }

  exampleDate() {
    // Beispiel Datum -> entfernen wenn Datum aus Database kommt
    const messageDate = new Date('2024-12-22T00:00:00');
    this.messageTime = messageDate.getTime();
    console.log('messageTime ', this.messageTime);
  }

  getCurrentTimeStamp() {
        const today = new Date();
        this.currentTimeStamp = today.getTime();;
        console.log('currentTimeStamp ', this.currentTimeStamp);
  }

  getFormattedDate(timestamp: number): string {
    const date = new Date(timestamp);  
    // Array für die Monatsnamen
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    // Extrahiere Tag, Monat und Jahr
    const day = date.getDate();  // Tag des Monats
    const month = months[date.getMonth()];  // Monat (von 0 bis 11)
    const year = date.getFullYear();  // Jahr
  
    // Rückgabe im Format: "Tag Monat Jahr"
    return `${day} ${month} ${year}`;
  }

  compareBothDate(currentDate : any, today: any) {
    console.log('currentDate ', currentDate);
    console.log('today ', today);
    
  }
}
