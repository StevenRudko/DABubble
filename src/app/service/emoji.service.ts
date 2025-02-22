import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EmojiService {
  readonly emojiList: any[] = [
    { name: 'smile', emoji: '😊' },
    { name: 'thumbs_up', emoji: '👍' },
    { name: 'heart', emoji: '❤️' },
    { name: 'laughing', emoji: '😂' },
    { name: 'fire', emoji: '🔥' },
    { name: 'star', emoji: '⭐' },
    { name: 'sunglasses', emoji: '😎' },
    { name: 'thinking', emoji: '🤔' },
    { name: 'wink', emoji: '😉' },
    { name: 'party', emoji: '🥳' },
    { name: 'ok_hand', emoji: '👌' },
    { name: 'check', emoji: '✅' },
    { name: 'love_eyes', emoji: '😍' },
    { name: 'hundred', emoji: '💯' },
    { name: 'clap', emoji: '👏' },
    { name: 'rocket', emoji: '🚀' },
    { name: 'heart_eyes', emoji: '🥰' },
    { name: 'tada', emoji: '🎉' },
  ];
}
