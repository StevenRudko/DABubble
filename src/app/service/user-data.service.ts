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

  constructor(private firestore: Firestore) {
    this.getUserMessages();
    this.getUsers();
  }

  // Abrufen der Benutzernachrichten
  getUserMessages() {
    try {
      const userCollection = collection(this.firestore, 'userMessages');

      // Live-Updates mit onSnapshot
      onSnapshot(userCollection, (querySnapshot) => {
        const messages = querySnapshot.docs.map((doc) => {
          return {
            userMessageId: doc.id,
            ...doc.data(),
          } as UserMessageInterface;
        });
        this.userMessagesSubject.next(messages);
      });

      // Initialer Abruf der Nachrichten
      // Dieser Schritt ist optional, da onSnapshot bereits immer die neuesten Daten liefert
      // const initialSnapshot = await getDocs(userCollection);
      // const initialMessages = initialSnapshot.docs.map((doc) => {
      //   return { userMessageId: doc.id, ...doc.data() } as UserMessageInterface;
      // });
      // this.userMessagesSubject.next(initialMessages);
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzernachrichten:', error);
      this.userMessagesSubject.next([]); // Leeres Array im Fehlerfall
    }
  }

  // Abrufen der Benutzer
  getUsers() {
    try {
      const userCollection = collection(this.firestore, 'users');

      // Live-Updates mit onSnapshot
      onSnapshot(userCollection, (querySnapshot) => {
        const users = querySnapshot.docs.map((doc) => {
          return {
            localID: doc.id, // Der korrekte Wert für User
            ...doc.data(),
          } as UserInterface;
        });
        this.usersSubject.next(users);
      });

      // Initialer Abruf der Benutzer
      // Dieser Schritt ist optional, da onSnapshot bereits immer die neuesten Daten liefert
      // const initialSnapshot = await getDocs(userCollection);
      // const initialUsers = initialSnapshot.docs.map((doc) => {
      //   return { localID: doc.id, ...doc.data() } as UserInterface;
      // });
      // this.usersSubject.next(initialUsers);
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
      this.usersSubject.next([]); // Leeres Array im Fehlerfall
    }
  }

  // Optional: Methode zum Abrufen der aktuellen Nachrichten
  getCurrentMessages(): UserMessageInterface[] {
    return this.userMessagesSubject.value;
  }

  // Optional: Methode zum Filtern nach Channel
  getMessagesByChannel(channelId: string): Observable<UserMessageInterface[]> {
    return new Observable((observer) => {
      this.userMessages$.subscribe((messages) => {
        const filtered = messages.filter((msg) => msg.channelId === channelId);
        observer.next(filtered);
      });
    });
  }

  // Neue Methode zum Aktualisieren einer Nachricht
  async updateMessage(
    messageId: string,
    updatedMessage: Partial<UserMessageInterface>
  ): Promise<void> {
    try {
      // Die Nachricht in der Firestore-Datenbank aktualisieren
      const messageDocRef = doc(this.firestore, 'userMessages', messageId);
      await updateDoc(messageDocRef, updatedMessage);

      // Lokale Liste der Nachrichten aktualisieren
      const updatedMessages = this.userMessagesSubject.value.map((message) =>
        message.userMessageId === messageId
          ? { ...message, ...updatedMessage } // Nur die geänderten Felder aktualisieren
          : message
      );
      this.userMessagesSubject.next(updatedMessages);

      // console.log(`Nachricht mit ID ${messageId} erfolgreich aktualisiert.`);
    } catch (error) {
      // console.error('Fehler beim Aktualisieren der Nachricht:', error);
    }
  }

  // Neue Funktion zum Löschen einer Nachricht
  async deleteMessage(messageId: string): Promise<void> {
    try {
      // Zuerst das Dokument aus der Firestore-Datenbank löschen
      const messageDocRef = doc(this.firestore, 'userMessages', messageId);
      await deleteDoc(messageDocRef);

      // Lokale Nachrichtensammlung nach dem Löschen der Nachricht aktualisieren
      const updatedMessages = this.userMessagesSubject.value.filter(
        (message) => message.userMessageId !== messageId
      );
      this.userMessagesSubject.next(updatedMessages);

      // console.log(`Nachricht mit ID ${messageId} erfolgreich gelöscht.`);
    } catch (error) {
      // console.error('Fehler beim Löschen der Nachricht:', error);
    }
  }

  async addEmojiReaction(
    messageId: string,
    emojiName: string,
    userId: string
  ): Promise<void> {
    try {
      console.log('Adding emoji reaction:', { messageId, emojiName, userId });
      const messageRef = doc(this.firestore, 'userMessages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (messageSnap.exists()) {
        const messageData = messageSnap.data();
        let currentEmojis = messageData['emojis'] || [];

        // Stellen Sie sicher, dass currentEmojis ein Array ist
        if (!Array.isArray(currentEmojis)) {
          currentEmojis = [];
        }

        console.log('Current emojis before update:', currentEmojis);

        // Prüfen ob der User bereits mit diesem Emoji reagiert hat
        const existingReaction = currentEmojis.find(
          (reaction: any) =>
            reaction.user === userId && reaction.name === emojiName
        );

        let updatedEmojis;
        if (!existingReaction) {
          // Neue Reaktion hinzufügen
          updatedEmojis = [
            ...currentEmojis,
            {
              name: emojiName,
              user: userId,
            },
          ];
          console.log('Adding new reaction:', updatedEmojis);
        } else {
          // Reaktion entfernen
          updatedEmojis = currentEmojis.filter(
            (reaction: any) =>
              !(reaction.user === userId && reaction.name === emojiName)
          );
          console.log('Removing existing reaction:', updatedEmojis);
        }

        // Aktualisiere das Dokument
        await updateDoc(messageRef, {
          emojis: updatedEmojis,
        });

        console.log('Document updated successfully');

        // Aktualisiere den lokalen State
        const updatedMessages = this.userMessagesSubject.value.map(
          (message) => {
            if (message.userMessageId === messageId) {
              return {
                ...message,
                emojis: updatedEmojis,
              };
            }
            return message;
          }
        );

        this.userMessagesSubject.next(updatedMessages);
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Emoji-Reaktion:', error);
      throw error;
    }
  }

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

  async getMessage(messageId: string) {
    const messageRef = doc(this.firestore, `userMessages/${messageId}`);
    const messageSnap = await getDoc(messageRef);
    return messageSnap.exists()
      ? { ...messageSnap.data(), id: messageSnap.id }
      : null;
  }

  async getThreadMessages(parentId: string) {
    const messageRef = doc(this.firestore, `userMessages/${parentId}`);
    const messageSnap = await getDoc(messageRef);

    if (messageSnap.exists()) {
      // Hier die Änderung von .comments zu ['comments']
      const comments = messageSnap.data()?.[`comments`] || [];
      const messagePromises = comments.map(async (commentId: string) => {
        const commentRef = doc(this.firestore, `userMessages/${commentId}`);
        const commentSnap = await getDoc(commentRef);
        return commentSnap.exists()
          ? { ...commentSnap.data(), id: commentSnap.id }
          : null;
      });

      return (await Promise.all(messagePromises)).filter((msg) => msg !== null);
    }
    return [];
  }
}
