import { CommonModule, NgFor } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';
import { EmojiService } from '../../service/emoji.service';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, NgFor],
  templateUrl: './emoji-picker.component.html',
  styleUrls: ['./emoji-picker.component.scss'],
})
export class EmojiPickerComponent {
  @Input() isOwnMessage: boolean = false;
  @Output() emojiSelect = new EventEmitter<any>();
  @Output() mouseStateChange = new EventEmitter<boolean>();
  @Output() emojiListChange = new EventEmitter<any[]>();

  emojiList: any[] = [];

  /**
   * Initializes component with emoji list from service
   */
  constructor(private emojiService: EmojiService) {
    this.emojiList = this.emojiService.emojiList;
  }

  /**
   * Handles emoji selection and emits selected emoji
   * @param emoji Selected emoji object
   */
  onEmojiSelect(emoji: any): void {
    this.emojiSelect.emit(emoji);
    this.emojiListChange.emit(this.emojiList);
  }

  /**
   * Handles mouse enter event on emoji picker
   */
  onMouseEnter(): void {
    this.mouseStateChange.emit(true);
    this.emojiListChange.emit(this.emojiList);
  }

  /**
   * Handles mouse leave event on emoji picker
   */
  onMouseLeave(): void {
    this.mouseStateChange.emit(false);
  }
}
