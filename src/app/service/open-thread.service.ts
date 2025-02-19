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
  private previousThreadMessageId: string | null = null;

  threadVisible$ = this.threadVisibleSubject.asObservable();
  currentThreadMessageId$ = this.currentThreadMessageIdSubject.asObservable();

  constructor() {
    this.threadVisible$.subscribe((visible) => {
      if (!visible) {
        this.previousThreadMessageId =
          this.currentThreadMessageIdSubject.getValue();
        this.currentThreadMessageIdSubject.next(null);
      }
    });
  }

  /**
   * Opens thread for specified message
   * @param messageId ID of message to open thread for
   */
  openThread(messageId: string): void {
    const isCurrentlyVisible = this.threadVisibleSubject.getValue();
    const currentMessageId = this.currentThreadMessageIdSubject.getValue();

    if (messageId === this.previousThreadMessageId && !isCurrentlyVisible) {
      this.currentThreadMessageIdSubject.next(messageId);
      this.threadVisibleSubject.next(true);
      return;
    }

    if (isCurrentlyVisible && currentMessageId !== messageId) {
      this.threadVisibleSubject.next(false);
      setTimeout(() => {
        this.currentThreadMessageIdSubject.next(messageId);
        this.threadVisibleSubject.next(true);
      }, 50);
      return;
    }

    this.currentThreadMessageIdSubject.next(messageId);
    this.threadVisibleSubject.next(true);
  }

  /**
   * Closes current thread
   */
  closeThread(): void {
    if (this.threadVisibleSubject.getValue()) {
      this.threadVisibleSubject.next(false);
    }
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
