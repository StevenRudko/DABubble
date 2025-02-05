import { CommonModule, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { FormsModule } from '@angular/forms';
import { UserMessageComponent } from '../user-message/user-message.component';
import { EmojiReaction } from '../../models/user-message';

@Component({
  selector: 'app-emoji-overview',
  standalone: true,
  imports: [
    CommonModule,
    MATERIAL_MODULES,
    FormsModule,
  ],
  templateUrl: './emoji-overview.component.html',
  styleUrl: './emoji-overview.component.scss'
})

export class EmojiOverviewComponent {
  @Input() usedEmoji: any;
  @Input() emojiAuthor: string = '';

  constructor() {}

}
