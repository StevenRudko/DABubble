import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MATERIAL_MODULES } from '../material-imports';

@Component({
  selector: 'app-message-input-box',
  standalone: true,
  imports: [FormsModule, MATERIAL_MODULES],
  templateUrl: './message-input-box.component.html',
  styleUrl: './message-input-box.component.scss',
})
export class MessageInputBoxComponent {
  @Input() placeholder: string = 'Nachricht an #Entwicklerteam';

  constructor() {}
}
