import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, NgFor],
  templateUrl: './emoji-picker.component.html',
  styleUrls: ['./emoji-picker.component.scss'],
})
export class EmojiPickerComponent implements OnInit {
  emojiList: any[] = [
    { name: 'smile', emoji: '😊' },
    { name: 'thumbs_up', emoji: '👍' },
    { name: 'heart', emoji: '❤️' },
    { name: 'rocket', emoji: '🚀' },
    { name: 'laughing', emoji: '😂' },
    { name: 'clap', emoji: '👏' },
    { name: 'fire', emoji: '🔥' },
    { name: 'star', emoji: '⭐' },
    { name: 'sunglasses', emoji: '😎' },
    { name: 'thinking', emoji: '🤔' },
    { name: 'wink', emoji: '😉' },
    { name: 'crying', emoji: '😭' },
    { name: 'kiss', emoji: '😘' },
    { name: 'celebrate', emoji: '🎉' },
    { name: 'party', emoji: '🥳' },
    { name: 'confetti', emoji: '🎊' },
    { name: 'thumbs_down', emoji: '👎' },
    { name: 'ok_hand', emoji: '👌' },
    { name: 'prayer', emoji: '🙏' },
    { name: 'praise', emoji: '🙌' },
    { name: 'check', emoji: '✅' },
  ];

  selectedEmojis: string[] = [];
  @Input() isOwnMessage: boolean = false;

  @Output() mouseStateChange = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit(): void {}

  // Callback, das aufgerufen wird, wenn ein Emoji ausgewählt wird
  onEmojiSelect(emoji: any): void {
    this.selectedEmojis.push(emoji.emoji);
    console.log('Ausgewähltes Emoji:', emoji.emoji);
  }

  /**
   * Handles the mouseenter event on the emoji picker
   * Used to maintain visibility when hovering over the picker itself
   * @returns {void}
   */
  onMouseEnter(): void {
    this.mouseStateChange.emit(true);
  }

  /**
   * Handles the mouseleave event on the emoji picker
   * Used to hide the picker when mouse leaves the component area
   * @returns {void}
   */
  onMouseLeave(): void {
    this.mouseStateChange.emit(false);
  }
}
