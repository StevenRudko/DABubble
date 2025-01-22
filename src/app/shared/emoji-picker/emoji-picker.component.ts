import { CommonModule, NgFor } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MATERIAL_MODULES } from '../material-imports';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES, NgFor],
  templateUrl: './emoji-picker.component.html',
  styleUrls: ['./emoji-picker.component.scss'],
})
export class EmojiPickerComponent {
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

  @Input() isOwnMessage: boolean = false;
  @Output() emojiSelect = new EventEmitter<any>();
  @Output() mouseStateChange = new EventEmitter<boolean>();
  @Output() emojiListChange = new EventEmitter<any[]>();

  onEmojiSelect(emoji: any): void {
    console.log('EmojiPicker - emoji selected:', emoji);
    this.emojiSelect.emit(emoji);
    this.emojiListChange.emit(this.emojiList);
  }

  onMouseEnter(): void {
    console.log('Mouse entered emoji picker');
    this.mouseStateChange.emit(true);
    this.emojiListChange.emit(this.emojiList);
  }

  onMouseLeave(): void {
    console.log('Mouse left emoji picker');
    this.mouseStateChange.emit(false);
  }
}
