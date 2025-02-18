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

  /**
   * Opens thread for specified message
   * @param messageId ID of message to open thread for
   */
  openThread(messageId: string): void {
    this.currentThreadMessageIdSubject.next(messageId);
    this.threadVisibleSubject.next(true);
  }

  /**
   * Closes current thread and resets message ID
   */
  closeThread(): void {
    this.threadVisibleSubject.next(false);
    this.currentThreadMessageIdSubject.next(null);
  }

  /**
   * Gets ID of current thread message
   * @returns Current thread message ID or null if no thread open
   */
  getCurrentThreadMessageId(): string | null {
    return this.currentThreadMessageIdSubject.getValue();
  }

  /**
   * Checks if thread view is currently visible
   * @returns Boolean indicating thread visibility
   */
  isThreadVisible(): boolean {
    return this.threadVisibleSubject.getValue();
  }
}
