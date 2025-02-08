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
  @Input() emojiAuthor: string[] = [];
  @Input() currentUserName: any;
  
  formatTextAfter: string = ''

  constructor() {
    // setTimeout(() => {
    //   console.log('currentUserName ', this.currentUserName);
    // }, 700);
  }

  formatAuthors(authors: string[]): string {
    if (!authors || authors.length === 0) {
      this.formatTextAfter = 'hat reagiert';
      return '';
    }
  
    // Prüfen, ob der aktuelle Benutzer in der Liste ist
    let isCurrentUserInList = authors.includes(this.currentUserName);
  
    // Ersetze den Namen des aktuellen Benutzers durch "Du"
    const formattedAuthors = authors.map(author => 
      author === this.currentUserName ? 'Du' : author
    );
  
    // Fall: Nur eine Person hat reagiert
    if (formattedAuthors.length === 1) {
      this.formatTextAfter = isCurrentUserInList ? 'hast reagiert' : 'hat reagiert';
      return formattedAuthors[0];
    }
  
    // Fall: Zwei Personen haben reagiert
    if (formattedAuthors.length === 2) {
      this.formatTextAfter = 'haben reagiert';
      return `${formattedAuthors[0]} und ${formattedAuthors[1]}`;
    }
  
    // Fall: Mehr als zwei Personen haben reagiert
    this.formatTextAfter = 'haben reagiert';
    return `${formattedAuthors.slice(0, -1).join(', ')} und ${formattedAuthors[formattedAuthors.length - 1]}`;
  }
  
  

}
