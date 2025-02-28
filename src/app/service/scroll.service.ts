import { Injectable, ElementRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  private isUserScrolledSubject = new BehaviorSubject<boolean>(false);
  isUserScrolled$ = this.isUserScrolledSubject.asObservable();
  
  private autoScrollEnabledSubject = new BehaviorSubject<boolean>(true);
  autoScrollEnabled$ = this.autoScrollEnabledSubject.asObservable();
  
  private lastMessageCount = 0;

  constructor() { }

  /**
   * Handles container scroll events to detect if user has manually scrolled up
   * @param container - The scrollable container element reference
   */
  onScroll(container: HTMLElement): void {
    const atBottom = this.isNearBottom(container);
    this.isUserScrolledSubject.next(!atBottom);
  }

  /**
   * Checks if the scroll position is near the bottom
   * @param element - The scrollable element
   * @param threshold - The pixel threshold to consider "near bottom" (default: 50)
   * @returns boolean indicating if scroll position is near bottom
   */
  private isNearBottom(element: HTMLElement, threshold: number = 50): boolean {
    return Math.abs(
      element.scrollHeight - element.scrollTop - element.clientHeight
    ) < threshold;
  }

  /**
   * Scrolls container to bottom if user hasn't manually scrolled up
   * @param container - The scrollable container element reference
   * @param force - Force scroll to bottom regardless of user scroll position
   */
  scrollToBottom(container: ElementRef | null, force: boolean = false): void {
    try {
      if (!container || !container.nativeElement) return;
      
      const shouldScroll = force || !this.isUserScrolledSubject.getValue();
      
      if (shouldScroll) {
        container.nativeElement.scrollTop = container.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  /**
   * Updates the message count and scrolls if needed
   * @param container - The scrollable container element reference
   * @param currentCount - Current number of messages
   * @returns Updated last message count
   */
  handleNewMessages(container: ElementRef | null, currentCount: number): number {
    if (currentCount > this.lastMessageCount) {
      this.scrollToBottom(container);
      this.lastMessageCount = currentCount;
    }
    return this.lastMessageCount;
  }

  /**
   * Resets user scroll state to trigger auto-scrolling
   */
  resetScrollState(): void {
    this.isUserScrolledSubject.next(false);
  }

  /**
   * Enables or disables auto-scrolling
   * @param enabled - Whether auto-scrolling should be enabled
   */
  setAutoScrollEnabled(enabled: boolean): void {
    this.autoScrollEnabledSubject.next(enabled);
  }

  /**
   * Checks if auto-scrolling is currently enabled
   * @returns boolean indicating if auto-scrolling is enabled
   */
  isAutoScrollEnabled(): boolean {
    return this.autoScrollEnabledSubject.getValue();
  }
}