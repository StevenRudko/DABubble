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
  private userMessagesSubject = new BehaviorSubject<UserMessage[]>([]);    // BehaviorSubjects verwenden, um die Daten zu verwalten und zu abonnieren
  userMessages$ = this.userMessagesSubject.asObservable();     // Observable für den Zugriff auf den aktuellen Status

  constructor(private firestore: Firestore) {
  }
  
  // Funktion, um Nachrichten zu laden
  async getUserMessages() {
    try {
      const userCollection = collection(this.firestore, 'userMessages');
      const querySnapshot = await getDocs(userCollection);
      const messages: UserMessage[] = querySnapshot.docs.map(doc => new UserMessage({
        id: doc.id,  // Firebase ID als `id` setzen
        ...doc.data()  // Restliche Daten des Dokuments
      }));

      // BehaviorSubject mit den abgerufenen Nachrichten aktualisieren
      this.userMessagesSubject.next(messages);

      // Echtzeit-Updates für die Sammlung
      onSnapshot(userCollection, (snapshot) => {
        const updatedMessages: UserMessage[] = snapshot.docs.map(doc => new UserMessage({
          id: doc.id,  // Firebase ID als `id` setzen
          ...doc.data()  // Restliche Daten des Dokuments
        }));

        // Aktualisiere die Nachrichten bei Änderungen in der Firebase
        this.userMessagesSubject.next(updatedMessages);
        console.log('Echtzeit-Updates der Benutzer-Nachrichten:', updatedMessages);
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerdaten:', error);
    }
  }
}