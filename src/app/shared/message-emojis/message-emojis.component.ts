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
export class MessageEmojisComponent {
  private inputOutputService = inject(InputOutput);
  showEmojis: boolean = this.inputOutputService.showEmojis; 

  constructor() {}
}
