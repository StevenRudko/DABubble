import { Component, Input, OnInit, inject } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { InputOutput } from '../../service/input-output.service';

@Component({
  selector: 'app-message-emojis',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './message-emojis.component.html',
  styleUrls: ['./message-emojis.component.scss'],
})
export class MessageEmojisComponent implements OnInit{
  threadMessage: boolean = true;
  private inputOutputService = inject(InputOutput);

  constructor() {}

  ngOnInit() {
    // Abonniere den Service, um auf Änderungen von threadMessage zu reagieren
    this.inputOutputService.threadMessage$.subscribe((status) => {
      this.threadMessage = status;
      console.log( this.threadMessage = status);
    });
  }
}
