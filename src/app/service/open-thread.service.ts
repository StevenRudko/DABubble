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
   * Opens thread for specified message with a small delay to ensure proper UI updates
   * @param messageId ID of message to open thread for
   */
  openThread(messageId: string): void {
    const currentMessageId = this.currentThreadMessageIdSubject.getValue();

    if (currentMessageId === messageId) {
      return;
    }

    this.threadVisibleSubject.next(false);
    this.currentThreadMessageIdSubject.next(null);

    setTimeout(() => {
      this.currentThreadMessageIdSubject.next(messageId);
      this.threadVisibleSubject.next(true);
    }, 0);
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
