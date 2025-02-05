import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  Channel,
  ChatMember,
  DirectUser,
  UserMessage,
} from '../models/chat.interfaces';
import { distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface SearchResult {
  id: string;
  type: 'channel' | 'user';
  name: string;
  email?: string;
  photoURL?: string;
  description?: string;
  online?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private currentChannelSubject = new BehaviorSubject<Channel | null>(null);
  currentChannel$ = this.currentChannelSubject.asObservable();
  private currentDirectUserSubject = new BehaviorSubject<DirectUser | null>(
    null
  );
  currentDirectUser$ = this.currentDirectUserSubject.asObservable();
  private messagesSubject = new BehaviorSubject<UserMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();
  private channelMembersSubject = new BehaviorSubject<ChatMember[]>([]);
  channelMembers$ = this.channelMembersSubject.asObservable();
  private currentChannelMembersSubject = new BehaviorSubject<ChatMember[]>([]);
  currentChannelMembers$ = this.currentChannelMembersSubject.asObservable();
  private isNewMessageSubject = new BehaviorSubject<boolean>(false);
  isNewMessage$ = this.isNewMessageSubject.asObservable();
  private selectedSearchResultSubject =
    new BehaviorSubject<SearchResult | null>(null);
  selectedSearchResult$ = this.selectedSearchResultSubject.asObservable();
  /** Subject to handle message sent events */
  private messageSentSubject = new BehaviorSubject<boolean>(false);
  /** Observable for message sent events */
  messageSent$ = this.messageSentSubject.asObservable();

  private channelMembersUpdatedSource = new Subject<string>();
  channelMembersUpdated$ = this.channelMembersUpdatedSource.asObservable();

  private currentUser: any = null;

  private threadOpenSubject = new BehaviorSubject<boolean>(false);
  threadOpen$ = this.threadOpenSubject.asObservable();

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        // Wenn ein User eingeloggt ist, öffnen wir automatisch seinen eigenen Chat
        this.openSelfChat();
      }
    });
  }

  async openSelfChat(): Promise<void> {
    if (this.currentUser) {
      // Setze den aktuellen User als Direct Message Partner
      const selfUserData = {
        uid: this.currentUser.uid,
        email: this.currentUser.email,
        photoURL: this.currentUser.photoURL,
        displayName: this.currentUser.displayName,
        username: this.currentUser.username,
        online: true,
      };

      // Reset channel und setze Direct Message
      this.currentChannelSubject.next(null);
      this.isNewMessageSubject.next(false);
      this.currentDirectUserSubject.next(selfUserData);

      // Lade die Nachrichten für den Self-Chat
      const messagesCollection = collection(this.firestore, 'userMessages');
      const q = query(
        messagesCollection,
        where('authorId', '==', this.currentUser.uid),
        where('directUserId', '==', this.currentUser.uid)
      );

      collectionData(q, { idField: 'id' })
        .pipe(
          distinctUntilChanged(
            (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
          )
        )
        .subscribe((messages) => {
          const sortedMessages = this.sortMessagesByDate(
            messages as UserMessage[]
          );
          this.messagesSubject.next(sortedMessages);
        });
    }
  }

  /**
   * Deactivates new message mode after message is sent
   */
  messageWasSent(): void {
    this.isNewMessageSubject.next(false);
    this.selectedSearchResultSubject.next(null);
    this.messageSentSubject.next(true);
  }

  /**
   * Activates new message mode and resets current selections
   */
  toggleNewMessage(): void {
    this.isNewMessageSubject.next(true);
    this.currentChannelSubject.next(null);
    this.currentDirectUserSubject.next(null);
  }

  setSelectedSearchResult(result: SearchResult | null): void {
    this.selectedSearchResultSubject.next(result);
  }

  async selectChannel(channelId: string): Promise<void> {
    this.threadOpenSubject.next(false); // Close thread

    try {
      const channelRef = doc(this.firestore, `channels/${channelId}`);
      const channelSnap = await getDoc(channelRef);

      if (channelSnap.exists()) {
        this.isNewMessageSubject.next(false);
        const channelData = channelSnap.data() as Omit<Channel, 'id'>;
        this.currentChannelSubject.next({
          ...channelData,
          id: channelId,
        });
        this.currentDirectUserSubject.next(null);

        const messagesCollection = collection(this.firestore, 'userMessages');
        const q = query(
          messagesCollection,
          where('channelId', '==', channelId)
        );

        collectionData(q, { idField: 'id' })
          .pipe(
            distinctUntilChanged(
              (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
            )
          )
          .subscribe((messages) => {
            const sortedMessages = this.sortMessagesByDate(
              messages as UserMessage[]
            );
            this.messagesSubject.next(sortedMessages);
          });
      }
    } catch (error) {
      console.error('Error loading channel:', error);
    }
  }

  async selectDirectMessage(userId: string): Promise<void> {
    this.threadOpenSubject.next(false); // Close thread

    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        this.isNewMessageSubject.next(false);
        const userData = userSnap.data() as Omit<DirectUser, 'uid'>;

        this.currentChannelSubject.next(null);
        this.currentDirectUserSubject.next({
          ...userData,
          uid: userId,
        });

        const messagesCollection = collection(this.firestore, 'userMessages');
        const q = query(
          messagesCollection,
          where('directUserId', 'in', [userId, this.currentUser?.uid])
        );

        collectionData(q, { idField: 'id' })
          .pipe(
            distinctUntilChanged(
              (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
            )
          )
          .subscribe((messages) => {
            const filteredMessages = (messages as UserMessage[]).filter(
              (msg) =>
                (msg.authorId === userId &&
                  msg.directUserId === this.currentUser?.uid) ||
                (msg.authorId === this.currentUser?.uid &&
                  msg.directUserId === userId)
            );
            const sortedMessages = this.sortMessagesByDate(filteredMessages);
            this.messagesSubject.next(sortedMessages);
          });
      }
    } catch (error) {
      console.error('Error loading direct messages:', error);
    }
  }

  private sortMessagesByDate(messages: UserMessage[]): UserMessage[] {
    return [...messages].sort((a, b) => {
      const timeA = a.time?.seconds || 0;
      const timeB = b.time?.seconds || 0;
      return timeA - timeB;
    });
  }

  getChannelMembers(channelId: string): Observable<ChatMember[]> {
    return new Observable<ChatMember[]>((subscriber) => {
      const channelRef = doc(this.firestore, `channels/${channelId}`);

      getDoc(channelRef)
        .then(async (channelSnap) => {
          if (channelSnap.exists()) {
            const channelData = channelSnap.data();
            const memberIds = Object.keys(channelData['members'] || {}).filter(
              (key) => channelData['members'][key] === true
            );

            const memberPromises = memberIds.map(async (memberId) => {
              const userRef = doc(this.firestore, `users/${memberId}`);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                  ...userData,
                  uid: memberId,
                } as ChatMember;
              }
              return null;
            });

            const members = (await Promise.all(memberPromises)).filter(
              (member): member is ChatMember => member !== null
            );

            subscriber.next(members);
            this.currentChannelMembersSubject.next(members);
          } else {
            subscriber.next([]);
            this.currentChannelMembersSubject.next([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching channel members:', error);
          subscriber.next([]);
          this.currentChannelMembersSubject.next([]);
        });
    });
  }

  async refreshChannelMembers(channelId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, `channels/${channelId}`);
      const channelSnap = await getDoc(channelRef);

      if (channelSnap.exists()) {
        const channelData = channelSnap.data();
        const memberIds = Object.keys(channelData['members'] || {}).filter(
          (key) => channelData['members'][key] === true
        );

        const memberPromises = memberIds.map(async (memberId) => {
          const userRef = doc(this.firestore, `users/${memberId}`);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            return { ...userData, uid: memberId } as ChatMember;
          }
          return null;
        });

        const members = (await Promise.all(memberPromises)).filter(
          (member): member is ChatMember => member !== null
        );

        this.channelMembersSubject.next(members);
        this.channelMembersUpdatedSource.next(channelId);
      }
    } catch (error) {
      console.error('Error refreshing channel members:', error);
    }
  }

  async updateChannel(
    channelId: string,
    updates: { name?: string; description?: string }
  ): Promise<void> {
    try {
      const channelRef = doc(this.firestore, `channels/${channelId}`);
      await updateDoc(channelRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      await this.selectChannel(channelId);
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }

  async removeUserFromChannel(
    channelId: string,
    userId: string
  ): Promise<void> {
    try {
      const channelRef = doc(this.firestore, `channels/${channelId}`);
      const channelSnap = await getDoc(channelRef);

      if (channelSnap.exists()) {
        const data = channelSnap.data();
        const members = { ...data['members'] };
        delete members[userId];

        await updateDoc(channelRef, {
          members,
          updatedAt: serverTimestamp(),
        });

        this.currentChannelSubject.next(null);
      }
    } catch (error) {
      console.error('Error removing user from channel:', error);
      throw error;
    }
  }

  closeThread(): void {
    this.threadOpenSubject.next(false);
  }

  openThread(): void {
    this.threadOpenSubject.next(true);
  }
}
