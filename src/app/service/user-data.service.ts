import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserMessageInterface } from '../models/user-message';
import { UserInterface } from '../models/user-interface';

@Injectable({
  providedIn: 'root',
})
export class UserData {
  private userMessagesSubject = new BehaviorSubject<UserMessageInterface[]>([]);
  userMessages$ = this.userMessagesSubject.asObservable();
  private usersSubject = new BehaviorSubject<UserInterface[]>([]);
  users$ = this.usersSubject.asObservable();
  private recentEmojisSubject = new BehaviorSubject<{ [key: string]: any[] }>(
    {}
  );
  recentEmojis$ = this.recentEmojisSubject.asObservable();

  /**
   * Initializes service and loads initial data
   */
  constructor(private firestore: Firestore) {
    this.getUserMessages();
    this.getUsers();
  }

  /**
   * Sets up real-time listener for user messages
   */
  getUserMessages() {
    try {
      const userCollection = collection(this.firestore, 'userMessages');
      this.setupMessageListener(userCollection);
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzernachrichten:', error);
      this.userMessagesSubject.next([]);
    }
  }

  /**
   * Sets up snapshot listener for messages collection
   */
  private setupMessageListener(userCollection: any): void {
    onSnapshot(userCollection, (querySnapshot: any) => {
      const messages = querySnapshot.docs.map((doc: any) => ({
        userMessageId: doc.id,
        ...doc.data(),
      }));
      this.userMessagesSubject.next(messages);
    });
  }

  /**
   * Sets up real-time listener for users
   */
  getUsers() {
    try {
      const userCollection = collection(this.firestore, 'users');
      this.setupUserListener(userCollection);
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
      this.usersSubject.next([]);
    }
  }

  /**
   * Sets up snapshot listener for users collection
   */
  private setupUserListener(userCollection: any): void {
    onSnapshot(userCollection, (querySnapshot: any) => {
      const users = querySnapshot.docs.map((doc: any) => ({
        localID: doc.id,
        ...doc.data(),
      }));
      this.usersSubject.next(users);
    });
  }

  /**
   * Gets current messages from subject
   */
  getCurrentMessages(): UserMessageInterface[] {
    return this.userMessagesSubject.value;
  }

  /**
   * Gets messages filtered by channel
   */
  getMessagesByChannel(channelId: string): Observable<UserMessageInterface[]> {
    return new Observable((observer) => {
      this.userMessages$.subscribe((messages) => {
        const filtered = messages.filter((msg) => msg.channelId === channelId);
        observer.next(filtered);
      });
    });
  }

  /**
   * Updates message in Firestore and local state
   */
  async updateMessage(
    messageId: string,
    updatedMessage: Partial<UserMessageInterface>
  ): Promise<void> {
    try {
      await this.updateMessageInFirestore(messageId, updatedMessage);
      this.updateLocalMessages(messageId, updatedMessage);
    } catch (error) {
      console.error('Error updating message:', error);
    }
  }

  /**
   * Updates message document in Firestore
   */
  private async updateMessageInFirestore(
    messageId: string,
    updatedMessage: Partial<UserMessageInterface>
  ): Promise<void> {
    const messageDocRef = doc(this.firestore, 'userMessages', messageId);
    await updateDoc(messageDocRef, updatedMessage);
  }

  /**
   * Updates message in local state
   */
  private updateLocalMessages(
    messageId: string,
    updatedMessage: Partial<UserMessageInterface>
  ): void {
    const updatedMessages = this.userMessagesSubject.value.map((message) =>
      message.userMessageId === messageId
        ? { ...message, ...updatedMessage }
        : message
    );
    this.userMessagesSubject.next(updatedMessages);
  }

  /**
   * Deletes message from Firestore and local state
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.deleteMessageFromFirestore(messageId);
      this.deleteMessageFromLocalState(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  /**
   * Deletes message document from Firestore
   */
  private async deleteMessageFromFirestore(messageId: string): Promise<void> {
    const messageDocRef = doc(this.firestore, 'userMessages', messageId);
    await deleteDoc(messageDocRef);
  }

  /**
   * Removes message from local state
   */
  private deleteMessageFromLocalState(messageId: string): void {
    const updatedMessages = this.userMessagesSubject.value.filter(
      (message) => message.userMessageId !== messageId
    );
    this.userMessagesSubject.next(updatedMessages);
  }

  /**
   * Handles emoji reactions to messages
   */
  async addEmojiReaction(
    messageId: string,
    emojiName: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(this.firestore, 'userMessages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (messageSnap.exists()) {
        const updatedEmojis = this.processEmojiReaction(
          messageSnap,
          emojiName,
          userId
        );
        await this.updateEmojiReactions(messageRef, messageId, updatedEmojis);
      }
    } catch (error) {
      console.error('Error updating emoji reaction:', error);
      throw error;
    }
  }

  /**
   * Processes emoji reaction changes
   */
  private processEmojiReaction(
    messageSnap: any,
    emojiName: string,
    userId: string
  ): any[] {
    const messageData = messageSnap.data();
    let currentEmojis = Array.isArray(messageData['emojis'])
      ? messageData['emojis']
      : [];

    const existingReaction = currentEmojis.find(
      (reaction: any) => reaction.user === userId && reaction.name === emojiName
    );

    return existingReaction
      ? currentEmojis.filter(
          (reaction: any) =>
            !(reaction.user === userId && reaction.name === emojiName)
        )
      : [...currentEmojis, { name: emojiName, user: userId }];
  }

  /**
   * Updates emoji reactions in Firestore and local state
   */
  private async updateEmojiReactions(
    messageRef: any,
    messageId: string,
    updatedEmojis: any[]
  ): Promise<void> {
    await updateDoc(messageRef, { emojis: updatedEmojis });

    const updatedMessages = this.userMessagesSubject.value.map((message) =>
      message.userMessageId === messageId
        ? { ...message, emojis: updatedEmojis }
        : message
    );
    this.userMessagesSubject.next(updatedMessages);
  }

  /**
   * Gets recent emojis for user
   */
  async getRecentEmojis(userId: string): Promise<any[]> {
    const docRef = doc(this.firestore, 'users', userId, 'recentEmojis', 'data');
    const docSnap = await getDoc(docRef);
    const emojis = docSnap.exists() ? docSnap.data()?.['emojis'] || [] : [];

    this.recentEmojisSubject.next({
      ...this.recentEmojisSubject.value,
      [userId]: emojis,
    });
    return emojis;
  }

  /**
   * Updates recent emojis for user
   */
  async updateRecentEmojis(userId: string, newEmoji: any): Promise<void> {
    const recentEmojis = await this.getRecentEmojis(userId);
    const updatedEmojis = [
      newEmoji,
      ...recentEmojis.filter((e) => e.name !== newEmoji.name),
    ].slice(0, 2);

    const docRef = doc(this.firestore, 'users', userId, 'recentEmojis', 'data');
    await setDoc(docRef, { emojis: updatedEmojis }, { merge: true });

    this.recentEmojisSubject.next({
      ...this.recentEmojisSubject.value,
      [userId]: updatedEmojis,
    });
  }

  /**
   * Gets single message by ID
   */
  async getMessage(messageId: string): Promise<any> {
    const messageRef = doc(this.firestore, `userMessages/${messageId}`);
    const messageSnap = await getDoc(messageRef);
    return messageSnap.exists()
      ? { ...messageSnap.data(), id: messageSnap.id }
      : null;
  }

  /**
   * Gets thread messages for parent message
   */
  async getThreadMessages(parentId: string) {
    const messageRef = doc(this.firestore, `userMessages/${parentId}`);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) return [];
    return this.fetchThreadComments(messageSnap);
  }

  /**
   * Fetches comments for thread
   */
  private async fetchThreadComments(messageSnap: any) {
    const comments = messageSnap.data()?.[`comments`] || [];
    const messagePromises = comments.map(async (commentId: string) => {
      const commentSnap = await getDoc(
        doc(this.firestore, `userMessages/${commentId}`)
      );
      return commentSnap.exists()
        ? { ...commentSnap.data(), id: commentSnap.id }
        : null;
    });

    return (await Promise.all(messagePromises)).filter((msg) => msg !== null);
  }

  /**
   * Gets user by ID
   */
  async getUserById(userId: string) {
    try {
      const userRef = doc(this.firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      return userSnap.exists()
        ? { ...userSnap.data(), localID: userSnap.id }
        : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Adds new thread message and updates parent
   */
  async addThreadMessage(
    parentMessageId: string,
    messageText: string,
    authorId: string
  ) {
    try {
      const newMessageId = await this.createThreadMessage(
        messageText,
        authorId
      );
      await this.updateParentMessage(parentMessageId, newMessageId);
      return newMessageId;
    } catch (error) {
      console.error('Error adding thread message:', error);
      throw error;
    }
  }

  /**
   * Creates new thread message document
   */
  private async createThreadMessage(
    messageText: string,
    authorId: string
  ): Promise<string> {
    const messagesCollection = collection(this.firestore, 'userMessages');
    const messageData = {
      message: messageText,
      authorId: authorId,
      time: serverTimestamp(),
      emojis: [],
      comments: [],
    };

    const newMessageRef = await addDoc(messagesCollection, messageData);
    return newMessageRef.id;
  }

  /**
   * Updates parent message with new comment
   */
  private async updateParentMessage(
    parentMessageId: string,
    newMessageId: string
  ): Promise<void> {
    const parentMessageRef = doc(
      this.firestore,
      'userMessages',
      parentMessageId
    );
    const parentMessageSnap = await getDoc(parentMessageRef);

    if (parentMessageSnap.exists()) {
      const currentComments = parentMessageSnap.data()?.[`comments`] || [];
      await updateDoc(parentMessageRef, {
        comments: [...currentComments, newMessageId],
      });
    }
  }
}
