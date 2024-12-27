import { Injectable, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class InputOutput {
  // BehaviorSubjects verwenden, um die Daten zu verwalten und zu abonnieren
  private threadMessageSubject = new BehaviorSubject<boolean>(false);

  // Observable für den Zugriff auf den aktuellen Status
  threadMessage$ = this.threadMessageSubject.asObservable();

  constructor() {
  }

  setThreadMessageStyle(active: boolean): void {
    this.threadMessageSubject.next(active);
    console.log(this.threadMessage$);
  }

  // // Methode zum Abrufen des aktuellen Wertes
  // getThreadMessageStatus(): boolean {
  //   return this.threadMessageSubject.getValue();
  // }
}


