import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private threadVisibleSubject = new BehaviorSubject<boolean>(false);
  private currentThreadMessageIdSubject = new BehaviorSubject<string | null>(
    null
  );

  threadVisible$ = this.threadVisibleSubject.asObservable();
  currentThreadMessageId$ = this.currentThreadMessageIdSubject.asObservable();

  constructor() {}

  openThread(messageId: string): void {
    this.currentThreadMessageIdSubject.next(messageId);
    this.threadVisibleSubject.next(true);
  }

  closeThread(): void {
    this.threadVisibleSubject.next(false);
    this.currentThreadMessageIdSubject.next(null);
  }

  getCurrentThreadMessageId(): string | null {
    return this.currentThreadMessageIdSubject.getValue();
  }

  isThreadVisible(): boolean {
    return this.threadVisibleSubject.getValue();
  }
}
