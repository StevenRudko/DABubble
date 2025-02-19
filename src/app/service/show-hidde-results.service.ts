import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShowHiddeResultsService {
  private showResultSubject = new BehaviorSubject<boolean>(false);
  private borderTriggerSubject = new BehaviorSubject<boolean>(false);

  showResult$ = this.showResultSubject.asObservable();
  borderTrigger$ = this.borderTriggerSubject.asObservable();

  constructor() {}

  /**
   * Updates search results visibility
   * @param value Show/hide state
   */
  setShowResult(value: boolean): void {
    this.showResultSubject.next(value);
  }

  /**
   * Updates border trigger state
   * @param value Border trigger state
   */
  setBorderTrigger(value: boolean): void {
    this.borderTriggerSubject.next(value);
  }

  /**
   * Gets current results visibility state
   * @returns Current visibility state
   */
  getShowResult(): boolean {
    return this.showResultSubject.value;
  }

  /**
   * Gets current border trigger state
   * @returns Current border trigger state
   */
  getBorderTrigger(): boolean {
    return this.borderTriggerSubject.value;
  }
}
