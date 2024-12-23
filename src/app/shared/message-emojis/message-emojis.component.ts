import { Component } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';

@Component({
  selector: 'app-message-emojis',
  standalone: true,
  imports: [MATERIAL_MODULES],
  templateUrl: './message-emojis.component.html',
  styleUrls: ['./message-emojis.component.scss']
})
export class MessageEmojisComponent {

  constructor() {}

}
