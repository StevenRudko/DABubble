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

  constructor(private emojiService: EmojiService) {
    this.emojiList = this.emojiService.emojiList;
  }

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
