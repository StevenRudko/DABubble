import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  private activePickerIdSubject = new BehaviorSubject<string | null>(null);
  activePickerId$ = this.activePickerIdSubject.asObservable();

  setActivePickerId(id: string | null): void {
    this.activePickerIdSubject.next(id);
  }
}
