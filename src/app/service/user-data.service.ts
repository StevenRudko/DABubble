import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserMessage } from '../models/user-message';

@Injectable({
  providedIn: 'root',
})
export class UserData {
  private userMessagesSubject = new BehaviorSubject<any[]>([]);
  userMessages$ = this.userMessagesSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.getUserMessages(); // Direkt im Constructor aufrufen statt in ngOnInit
  }

  // Methode, um alle Benutzer aus Firestore zu laden
  async getUserMessages() {
    try {
      const userCollection = collection(this.firestore, 'userMessages');

      // Echtzeit-Listener für Updates
      onSnapshot(userCollection, (querySnapshot) => {
        const messages = querySnapshot.docs.map((doc) => {
          return { userMessageId: doc.id, ...doc.data() };
        });

        this.userMessagesSubject.next(messages); // Update den BehaviorSubject
        console.log('Benutzerliste:', messages);
      });

      // Initialer Abruf der Daten
      const initialSnapshot = await getDocs(userCollection);
      const initialMessages = initialSnapshot.docs.map((doc) => {
        return { userMessageId: doc.id, ...doc.data() };
      });
      this.userMessagesSubject.next(initialMessages);
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerdaten:', error);
      this.userMessagesSubject.next([]); // Im Fehlerfall leeres Array
    }
  }

  // Optional: Methode zum Abrufen der aktuellen Nachrichten
  getCurrentMessages(): any[] {
    return this.userMessagesSubject.value;
  }

  // Optional: Methode zum Filtern nach Channel
  getMessagesByChannel(channelId: number): Observable<any[]> {
    return new Observable((observer) => {
      this.userMessages$.subscribe((messages) => {
        const filtered = messages.filter((msg) => msg.channelId === channelId);
        observer.next(filtered);
      });
    });
  }

  // Optional: Methode zum Hinzufügen einer neuen Nachricht
  addMessage(message: any) {
    const currentMessages = this.userMessagesSubject.value;
    this.userMessagesSubject.next([...currentMessages, message]);
  }
}
