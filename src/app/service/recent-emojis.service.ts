import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserData } from './user-data.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecentEmojisService {
  private recentEmojisSubject = new BehaviorSubject<any[]>([]);
  recentEmojis$ = this.recentEmojisSubject.asObservable();

  constructor(private authService: AuthService, private userData: UserData) {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.loadRecentEmojis(user.uid);
      }
    });
  }

  private defaultEmojis = [
    { name: 'thumbs_up', emoji: '👍' },
    { name: 'smile', emoji: '😊' },
  ];

  private async loadRecentEmojis(userId: string) {
    let recentEmojis = await this.userData.getRecentEmojis(userId);
    if (!recentEmojis || recentEmojis.length === 0) {
      recentEmojis = this.defaultEmojis;
    }
    this.recentEmojisSubject.next(recentEmojis.slice(0, 2));
  }

  async updateRecentEmoji(emoji: any) {
    const user = await firstValueFrom(this.authService.user$);
    if (user) {
      await this.userData.updateRecentEmojis(user.uid, emoji);
      await this.loadRecentEmojis(user.uid);
    }
  }
}
