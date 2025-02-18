import { CommonModule, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { FormsModule } from '@angular/forms';
import { UserMessageComponent } from '../user-message/user-message.component';
import { EmojiReaction } from '../../models/user-message';

@Component({
  selector: 'app-emoji-overview',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, FormsModule],
  templateUrl: './emoji-overview.component.html',
  styleUrl: './emoji-overview.component.scss',
})
export class EmojiOverviewComponent {
  @Input() usedEmoji: any;
  @Input() emojiAuthor: string[] = [];
  @Input() currentUserName: any;

  formatTextAfter: string = '';

  /**
   * Formats list of emoji reaction authors
   * @param authors Array of author names
   * @returns Formatted string of authors
   */
  formatAuthors(authors: string[]): string {
    if (!authors || authors.length === 0) {
      this.formatTextAfter = 'hat reagiert';
      return '';
    }

    const formattedAuthors = this.getFormattedAuthors(authors);
    this.setFormatTextAfter(formattedAuthors);
    return this.getFormattedString(formattedAuthors);
  }

  /**
   * Formats author names, replacing current user with 'Du'
   */
  private getFormattedAuthors(authors: string[]): string[] {
    return authors.map((author) =>
      author === this.currentUserName ? 'Du' : author
    );
  }

  /**
   * Sets reaction text based on authors
   */
  private setFormatTextAfter(formattedAuthors: string[]): void {
    const isCurrentUserInList = formattedAuthors.includes('Du');
    if (formattedAuthors.length === 1) {
      this.formatTextAfter = isCurrentUserInList
        ? 'hast reagiert'
        : 'hat reagiert';
    } else {
      this.formatTextAfter = 'haben reagiert';
    }
  }

  /**
   * Creates formatted author string based on number of authors
   */
  private getFormattedString(formattedAuthors: string[]): string {
    if (formattedAuthors.length === 1) return formattedAuthors[0];
    if (formattedAuthors.length === 2) {
      return `${formattedAuthors[0]} und ${formattedAuthors[1]}`;
    }
    return `${formattedAuthors.slice(0, -1).join(', ')} und ${
      formattedAuthors[formattedAuthors.length - 1]
    }`;
  }
}
