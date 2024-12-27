// input-output.service.ts
import { Injectable, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface EmojiConfig {
  icon: string;
  type: 'material' | 'emoji';
}

@Injectable({
  providedIn: 'root',
})
export class InputOutput {
  threadMessage$: boolean = false;

  // BehaviorSubjects verwenden, um die Daten zu verwalten und zu abonnieren
  // private threadMessageSubject = new BehaviorSubject<boolean>(false);

  // Observable für den Zugriff auf den aktuellen Status
  // threadMessage$ = this.threadMessageSubject.asObservable();

  constructor() {}

}
