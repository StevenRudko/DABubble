import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EmojiService {
  readonly emojiList: any[] = [
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
}
