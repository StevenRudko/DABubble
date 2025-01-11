import { Injectable } from '@angular/core';
import { Database, ref, set, onDisconnect, onValue } from '@angular/fire/database';
import { Auth } from '@angular/fire/auth';
import { BehaviorSubject, map, Observable } from 'rxjs';

/**
 * The PresenceService manages the online/offline status of authenticated users.
 * It uses Firebase Realtime Database to track user presence in real-time and provides
 * observables for accessing the list of online users.
 */
@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  /**
   * Subject to hold the current list of online users and their statuses.
   * Emits updates whenever the `status` node in the Realtime Database changes.
   * @private
   * @type {BehaviorSubject<Record<string, string>>}
   */
  private onlineUsersSubject = new BehaviorSubject<Record<string, string>>({});

  /**
   * Observable that streams the list of online users.
   * Can be subscribed to for real-time updates.
   * @type {Observable<Record<string, string>>}
   */
  onlineUsers$ = this.onlineUsersSubject.asObservable();

  /**
   * Initializes the PresenceService with dependencies and sets up a listener
   * for changes to the `status` node in the Realtime Database.
   * @param {Database} db - The Firebase Realtime Database instance.
   * @param {Auth} auth - The Firebase Authentication instance.
   * @constructor
   */
  constructor(private db: Database, private auth: Auth) {
    const statusRef = ref(this.db, 'status');
    onValue(statusRef, (snapshot) => {
      this.onlineUsersSubject.next(snapshot.val() || {});
    });
  }

  /**
   * Sets the current user's status to "online" and configures automatic status
   * updates for disconnections.
   * - Marks the user as "offline" on disconnect or when the browser unloads.
   * @returns {void}
   */
  setOnlineStatus(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        const userStatusRef = ref(this.db, `status/${user.uid}`);
        set(userStatusRef, 'online');
        onDisconnect(userStatusRef).set('offline');
        window.addEventListener('beforeunload', () => {
          set(userStatusRef, 'offline');
        });
      }
    });
  }

  /**
   * Sets the current user's status to "offline".
   * - Typically called when the user logs out or the session ends.
   * @returns {void}
   */
  setOfflineStatus(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        const userStatusRef = ref(this.db, `status/${user.uid}`);
        set(userStatusRef, 'offline');
      }
    });
  }

  /**
   * Retrieves the list of online users from the Realtime Database.
   * - Uses a callback to provide the data.
   * @param {(users: Record<string, string>) => void} callback - Callback function that receives the list of users.
   * @returns {void}
   */
  // getOnlineUsers(callback: (users: Record<string, string>) => void): void {
  //   const statusRef = ref(this.db, 'status');
  //   onValue(statusRef, (snapshot) => {
  //     callback(snapshot.val());
  //   });
  // }

  getOnlineUsers(): Observable<string[]> {
    return this.onlineUsers$.pipe(
      map((statusData) =>
        Object.keys(statusData || {}).filter(
          (uid) => statusData[uid] === 'online'
        )
      )
    );
  }


  // Funktion zum abrufen der User die online sind
  // this.presenceService.getOnlineUsers().subscribe((onlineUsers) => {
  //   this.string = onlineUsers;
  //   console.log('Online USER' ,this.onlineUsers);
  // });

}