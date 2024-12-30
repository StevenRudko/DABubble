// input-output.service.ts
import { Injectable, Input, OnInit } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserMessage } from '../models/user-message';

@Injectable({
  providedIn: 'root',
})
export class UserData implements OnInit {
    userMessage = new UserMessage();
    userMessages: any[] = [];

  constructor(private firestore: Firestore) {}

  ngOnInit() {
    this.getUserMessages();
  }

  // Methode, um alle Benutzer aus Firestore zu laden
  async getUserMessages() {
    try {
      const userCollection = collection(this.firestore, 'userMessages'); // Sammle die 'users' Collection
      const querySnapshot = await getDocs(userCollection); // Hole alle Dokumente aus der Sammlung
      // Wenn aber auch aktuelle Daten die neu hinzukommen, auch noch angezeigt werden sollen dann onSnapshot verwenden
      // onSnapshot ist ein Echtzeit-Listener für Echtzeit-Updates und funktioniert auch nach dem einmaligen Aufrufen der Funktion in der ngOnit
      onSnapshot(userCollection, (querySnapshot) => {
        this.userMessages = querySnapshot.docs.map((doc) => {
          return { userMessageId: doc.id, ...doc.data() }; // Mapping der Daten jedes Dokuments in die userList
        });
        console.log('Benutzerliste:', this.userMessages); // Diese Ausgabe wird bei jeder Änderung der Daten getriggert
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzerdaten:', error);
    }
  }

  // Hiermit lassen sich die Darten aus der Datenbank hinzufügen
  // this.userList = querySnapshot.docs.map((doc) => {
  //   // ohne querySnapshot erhält man eine Reihe an Infos aus der firebase. mit querySnapshot kann man bestimmte Elemente herauslesen und direkt in ein array überführen, in diesem Fall .docs (also alle dokumente)
  //   // nachdem die dokumente mit samt allen infos in einem array liegen, will man nur bestimmte infos der dokumente anzeigen lassen. Das geschieht mit map
  //   return { id: doc.id, ...doc.data() }; // Mapping der Daten jedes Dokuments in die userList
  // });
  // console.log('Benutzerliste:', this.userList);
}
