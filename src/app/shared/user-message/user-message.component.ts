import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { MATERIAL_MODULES } from '../material-imports';
import { InputOutput } from '../../service/input-output.service';

@Component({
  selector: 'app-user-message',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, NgIf],
  templateUrl: './user-message.component.html',
  styleUrl: './user-message.component.scss',
})
export class UserMessageComponent {
  @Input() threadMessage: boolean = false;
  @Input() ownMessage: boolean = false;
  @Input() showReactionEmojis: boolean = false;
  @Input() showAnswerDetails: boolean = true;
  @Input() showReactionIcons: boolean = true;

  messageTime: number = 0;
  currentTimeStamp: number = 0;
  isHoveredActive: boolean = false;
  isThreadContext: boolean = false;
  @Output() openThreadEvent = new EventEmitter<void>();

  private inputOutputService = inject(InputOutput);

  ngOnInit() {
    this.isThreadContext = this.isThread;
  }

  onMouseEnter() {
    this.isHoveredActive = true;
    this.showReactionEmojis = true;
  }

  onMouseLeave() {
    this.isHoveredActive = false;
    this.showReactionEmojis = false;
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
