import { Injectable } from '@angular/core';
import { Database, ref, set, onDisconnect, onValue } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private onlineUsersSubject = new BehaviorSubject<Record<string, string>>({});
  onlineUsers$ = this.onlineUsersSubject.asObservable();
  
  constructor(private db: Database, private auth: Auth) {
    const statusRef = ref(this.db, 'status');
    onValue(statusRef, (snapshot) => {
      this.onlineUsersSubject.next(snapshot.val() || {});
    });
  }

  setOnlineStatus(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        const userStatusRef = ref(this.db, `status/${user.uid}`);
        set(userStatusRef, 'online');
        onDisconnect(userStatusRef).set('offline');
        window.addEventListener('beforeunload', () => {
          set(userStatusRef, 'offline'); // Optional: Verhindert "Geisterbenutzer" bei Hard-Disconnects
        });
      }
    });
  }

  setOfflineStatus(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        const userStatusRef = ref(this.db, `status/${user.uid}`);
        set(userStatusRef, 'offline');
      }
    });
  }

  getOnlineUsers(callback: (users: Record<string, string>) => void): void {
    const statusRef = ref(this.db, 'status');
    onValue(statusRef, (snapshot) => {
      callback(snapshot.val());
    });
  }
}