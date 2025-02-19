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
  private messageSentSubject = new BehaviorSubject<boolean>(false);
  messageSent$ = this.messageSentSubject.asObservable();
  private channelMembersUpdatedSource = new Subject<string>();
  channelMembersUpdated$ = this.channelMembersUpdatedSource.asObservable();
  private currentUser: any = null;
  private threadOpenSubject = new BehaviorSubject<boolean>(false);
  threadOpen$ = this.threadOpenSubject.asObservable();

  /**
   * Initializes chat service and sets up user authentication listener
   */
  constructor(private firestore: Firestore, private authService: AuthService) {
    this.setupAuthListener();
  }

  /**
   * Sets up authentication listener and handles user login
   */
  private setupAuthListener(): void {
    this.authService.user$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.openSelfChat();
      }
    });
  }

  /**
   * Opens self chat for current user and loads messages
   */
  async openSelfChat(): Promise<void> {
    if (!this.currentUser) return;

    const selfUserData = this.createSelfUserData();
    this.resetChatState(selfUserData);
    await this.loadSelfChatMessages();
  }

  /**
   * Creates user data object for self chat
   */
  private createSelfUserData(): DirectUser {
    return {
      uid: this.currentUser.uid,
      email: this.currentUser.email,
      photoURL: this.currentUser.photoURL,
      displayName: this.currentUser.displayName,
      online: true,
    };
  }

  /**
   * Resets chat state for self chat
   */
  private resetChatState(selfUserData: DirectUser): void {
    this.currentChannelSubject.next(null);
    this.isNewMessageSubject.next(false);
    this.currentDirectUserSubject.next(selfUserData);
  }

  /**
   * Loads messages for self chat
   */
  private async loadSelfChatMessages(): Promise<void> {
    const messagesCollection = collection(this.firestore, 'userMessages');
    const q = query(
      messagesCollection,
      where('authorId', '==', this.currentUser.uid),
      where('directUserId', '==', this.currentUser.uid)
    );

    this.subscribeToChatMessages(q);
  }

  /**
   * Subscribes to chat messages query
   */
  private subscribeToChatMessages(q: any): void {
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

  /**
   * Handles message sent event
   */
  messageWasSent(): void {
    this.isNewMessageSubject.next(false);
    this.selectedSearchResultSubject.next(null);
    this.messageSentSubject.next(true);
  }

  /**
   * Toggles new message mode
   */
  toggleNewMessage(): void {
    this.isNewMessageSubject.next(true);
    this.currentChannelSubject.next(null);
    this.currentDirectUserSubject.next(null);
  }

  /**
   * Sets selected search result
   */
  setSelectedSearchResult(result: SearchResult | null): void {
    this.selectedSearchResultSubject.next(result);
  }

  /**
   * Selects channel and loads channel messages
   */
  async selectChannel(channelId: string): Promise<void> {
    this.threadOpenSubject.next(false);
    await this.loadChannelData(channelId);
  }

  /**
   * Loads channel data and messages
   */
  private async loadChannelData(channelId: string): Promise<void> {
    try {
      const channelRef = doc(this.firestore, `channels/${channelId}`);
      const channelSnap = await getDoc(channelRef);

      if (channelSnap.exists()) {
        await this.updateChannelState(channelId, channelSnap);
        await this.loadChannelMessages(channelId);
      }
    } catch (error) {
      console.error('Error loading channel:', error);
    }
  }

  /**
   * Updates channel state with new data
   */
  private async updateChannelState(
    channelId: string,
    channelSnap: any
  ): Promise<void> {
    this.isNewMessageSubject.next(false);
    const channelData = channelSnap.data() as Omit<Channel, 'id'>;
    this.currentChannelSubject.next({
      ...channelData,
      id: channelId,
    });
    this.currentDirectUserSubject.next(null);
  }

  /**
   * Loads messages for selected channel
   */
  private async loadChannelMessages(channelId: string): Promise<void> {
    const messagesCollection = collection(this.firestore, 'userMessages');
    const q = query(messagesCollection, where('channelId', '==', channelId));
    this.subscribeToChatMessages(q);
  }

  /**
   * Selects direct message chat and loads messages
   */
  async selectDirectMessage(userId: string): Promise<void> {
    this.threadOpenSubject.next(false);
    await this.loadDirectMessageData(userId);
  }

  /**
   * Loads direct message data and messages
   */
  private async loadDirectMessageData(userId: string): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${userId}`);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await this.updateDirectMessageState(userId, userSnap);
        await this.loadDirectMessages(userId);
      }
    } catch (error) {
      console.error('Error loading direct messages:', error);
    }
  }

  /**
   * Updates direct message state with new data
   */
  private async updateDirectMessageState(
    userId: string,
    userSnap: any
  ): Promise<void> {
    this.isNewMessageSubject.next(false);
    const userData = userSnap.data() as Omit<DirectUser, 'uid'>;
    this.currentChannelSubject.next(null);
    this.currentDirectUserSubject.next({
      ...userData,
      uid: userId,
    });
  }

  /**
   * Loads direct messages between users
   */
  private async loadDirectMessages(userId: string): Promise<void> {
    const messagesCollection = collection(this.firestore, 'userMessages');
    const q = query(
      messagesCollection,
      where('directUserId', 'in', [userId, this.currentUser?.uid])
    );

    this.subscribeToDirectMessages(q, userId);
  }

  /**
   * Subscribes to direct messages
   */
  private subscribeToDirectMessages(q: any, userId: string): void {
    collectionData(q, { idField: 'id' })
      .pipe(
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        )
      )
      .subscribe((messages) => {
        const filteredMessages = this.filterDirectMessages(
          messages as UserMessage[],
          userId
        );
        const sortedMessages = this.sortMessagesByDate(filteredMessages);
        this.messagesSubject.next(sortedMessages);
      });
  }

  /**
   * Filters direct messages between two users
   */
  private filterDirectMessages(
    messages: UserMessage[],
    userId: string
  ): UserMessage[] {
    return messages.filter(
      (msg) =>
        (msg.authorId === userId &&
          msg.directUserId === this.currentUser?.uid) ||
        (msg.authorId === this.currentUser?.uid && msg.directUserId === userId)
    );
  }

  /**
   * Sorts messages by date
   */
  private sortMessagesByDate(messages: UserMessage[]): UserMessage[] {
    return [...messages].sort((a, b) => {
      const timeA = a.time?.seconds || 0;
      const timeB = b.time?.seconds || 0;
      return timeA - timeB;
    });
  }

  /**
   * Gets channel members
   */
  getChannelMembers(channelId: string): Observable<ChatMember[]> {
    return new Observable<ChatMember[]>((subscriber) => {
      this.loadAndUpdateChannelMembers(channelId, subscriber);
    });
  }

  /**
   * Loads and updates channel members
   */
  private async loadAndUpdateChannelMembers(
    channelId: string,
    subscriber: any
  ): Promise<void> {
    try {
      const channelRef = doc(this.firestore, `channels/${channelId}`);
      const channelSnap = await getDoc(channelRef);

      if (channelSnap.exists()) {
        const members = await this.fetchChannelMembers(channelSnap);
        this.updateMembersState(members, subscriber);
      } else {
        this.updateMembersState([], subscriber);
      }
    } catch (error) {
      console.error('Error fetching channel members:', error);
      this.updateMembersState([], subscriber);
    }
  }

  /**
   * Fetches channel members data
   */
  private async fetchChannelMembers(channelSnap: any): Promise<ChatMember[]> {
    const channelData = channelSnap.data();
    const memberIds = Object.keys(channelData['members'] || {}).filter(
      (key) => channelData['members'][key] === true
    );

    const memberPromises = memberIds.map((memberId) =>
      this.fetchMemberData(memberId)
    );
    return (await Promise.all(memberPromises)).filter(
      (member): member is ChatMember => member !== null
    );
  }

  /**
   * Fetches individual member data
   */
  private async fetchMemberData(memberId: string): Promise<ChatMember | null> {
    const userRef = doc(this.firestore, `users/${memberId}`);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return { ...userData, uid: memberId } as ChatMember;
    }
    return null;
  }

  /**
   * Updates members state
   */
  private updateMembersState(members: ChatMember[], subscriber: any): void {
    subscriber.next(members);
    this.currentChannelMembersSubject.next(members);
  }

  /**
   * Loads channel members data
   */
  private async loadChannelMembers(channelId: string): Promise<ChatMember[]> {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    const channelSnap = await getDoc(channelRef);

    if (channelSnap.exists()) {
      return await this.fetchChannelMembers(channelSnap);
    }
    return [];
  }

  /**
   * Updates channel members state
   */
  private updateChannelMembersState(
    members: ChatMember[],
    channelId: string
  ): void {
    this.channelMembersSubject.next(members);
    this.channelMembersUpdatedSource.next(channelId);
  }

  /**
   * Updates channel information
   */
  async updateChannel(
    channelId: string,
    updates: { name?: string; description?: string }
  ): Promise<void> {
    try {
      await this.updateChannelDoc(channelId, updates);
      await this.selectChannel(channelId);
    } catch (error) {
      console.error('Error updating channel:', error);
      throw error;
    }
  }

  /**
   * Updates channel document in Firestore
   */
  private async updateChannelDoc(
    channelId: string,
    updates: { name?: string; description?: string }
  ): Promise<void> {
    const channelRef = doc(this.firestore, `channels/${channelId}`);
    await updateDoc(channelRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Removes user from channel
   */
  async removeUserFromChannel(
    channelId: string,
    userId: string
  ): Promise<void> {
    try {
      await this.removeUserFromChannelDoc(channelId, userId);
      this.currentChannelSubject.next(null);
    } catch (error) {
      console.error('Error removing user from channel:', error);
      throw error;
    }
  }

  /**
   * Removes user from channel document in Firestore
   */
  private async removeUserFromChannelDoc(
    channelId: string,
    userId: string
  ): Promise<void> {
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
    }
  }

  /**
   * Closes thread view
   */
  closeThread(): void {
    this.threadOpenSubject.next(false);
  }

  /**
   * Opens thread view
   */
  openThread(): void {
    this.threadOpenSubject.next(true);
  }
}
