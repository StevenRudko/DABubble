// service/chat.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Channel,
  ChatMember,
  DirectUser,
  UserMessage,
} from '../models/chat.interfaces';

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

  constructor(private firestore: Firestore) {}

  async selectChannel(channelId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, `channels/${channelId}`);
      const channelSnap = await getDoc(channelRef);

      if (channelSnap.exists()) {
        const channelData = channelSnap.data() as Omit<Channel, 'id'>;
        this.currentChannelSubject.next({
          ...channelData,
          id: channelId,
        });
        this.currentDirectUserSubject.next(null);

        // Messages für diesen Channel laden
        const messagesCollection = collection(this.firestore, 'userMessages');
        const q = query(
          messagesCollection,
          where('channelId', '==', channelId)
        );
        collectionData(q).subscribe((messages) => {
          const sortedMessages = this.sortMessagesByDate(
            messages as UserMessage[]
          );
          this.messagesSubject.next(sortedMessages);
        });
      }
      return;
    } catch (error) {
      console.error('Error loading channel:', error);
      return;
    }
  }

  async selectDirectMessage(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as Omit<DirectUser, 'uid'>;
        this.currentDirectUserSubject.next({
          ...userData,
          uid: userId,
        });
        this.currentChannelSubject.next(null);

        const messagesCollection = collection(this.firestore, 'userMessages');
        const q = query(
          messagesCollection,
          where('directUserId', '==', userId)
        );
        collectionData(q).subscribe((messages) => {
          const sortedMessages = this.sortMessagesByDate(
            messages as UserMessage[]
          );
          this.messagesSubject.next(sortedMessages);
        });
      }
      return;
    } catch (error) {
      console.error('Error loading direct messages:', error);
      return;
    }
  }

  private sortMessagesByDate(messages: UserMessage[]): UserMessage[] {
    return messages.sort((a, b) => {
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
          } else {
            subscriber.next([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching channel members:', error);
          subscriber.next([]);
        });
    });
  }
}
