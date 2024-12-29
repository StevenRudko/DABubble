// input-output.service.ts
import { Injectable, Input } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { UserMessage } from '../models/user-message';

interface EmojiConfig {
  icon: string;
  type: 'material' | 'emoji';
}

@Injectable({
  providedIn: 'root',
})
export class InputOutput {

  private userMessagesSubject = new BehaviorSubject<UserMessage[]>([]); // BehaviorSubject für die Nachrichten
  userMessages$ = this.userMessagesSubject.asObservable(); // Observable, um auf den aktuellen Status der Nachrichten zuzugreifen

  constructor(private firestore: Firestore) {}

  // Funktion zum Laden der Nachrichten aus Firestore
  async getUserMessages() {
    try {
      const userCollection = collection(this.firestore, 'userMessages');
      const querySnapshot = await getDocs(userCollection);
      
      const messages: UserMessage[] = querySnapshot.docs.map((doc) => new UserMessage({
        id: doc.id,
        ...doc.data(),
      }));

      this.userMessagesSubject.next(messages); // Update der BehaviorSubject

      // Echtzeit-Updates abonnieren
      onSnapshot(userCollection, (snapshot) => {
        const updatedMessages: UserMessage[] = snapshot.docs.map((doc) => new UserMessage({
          id: doc.id,
          ...doc.data(),
        }));

        this.userMessagesSubject.next(updatedMessages); // Echtzeit-Updates
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Nachrichten:', error);
    }
  }
}