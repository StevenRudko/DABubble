import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, deleteDoc, doc, getDocs, onSnapshot } from 'firebase/firestore';
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
  getMessagesByChannel(channelId: number): Observable<UserMessageInterface[]> {
    return new Observable((observer) => {
      this.userMessages$.subscribe((messages) => {
        const filtered = messages.filter((msg) => msg.channelId === channelId);
        observer.next(filtered);
      });
    });
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

      console.log(`Nachricht mit ID ${messageId} erfolgreich gelöscht.`);
    } catch (error) {
      console.error('Fehler beim Löschen der Nachricht:', error);
    }
  }
}
