// input-output.service.ts
import { Injectable, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface EmojiConfig {
  icon: string;
  type: 'material' | 'emoji';
}

@Injectable({
  providedIn: 'root',
})
export class InputOutput {
  // Bestehender Code
  private threadMessageSubject = new BehaviorSubject<boolean>(false);
  threadMessage$ = this.threadMessageSubject.asObservable();

  constructor() {
  }

  setThreadMessageStyle(active: boolean): void {
    this.threadMessageSubject.next(active);
    console.log(this.threadMessage$);
  }

  // Neue Methode für Emojis
  getEmojis(isThread: boolean): EmojiConfig[] {
    if (isThread) {
      return [{ icon: 'tag_faces', type: 'material' }];
    } else {
      return [
        { icon: 'check_circle', type: 'material' },
        { icon: '🙌', type: 'emoji' },
        { icon: 'tag_faces', type: 'material' },
        { icon: 'insert_comment', type: 'material' },
      ];
    }
  }
}


