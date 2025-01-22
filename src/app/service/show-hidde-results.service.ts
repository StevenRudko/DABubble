import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShowHiddeResultsService {
  private showResultSubject = new BehaviorSubject<boolean>(false);
  private borderTriggerSubject = new BehaviorSubject<boolean>(false);

  showResult$ = this.showResultSubject.asObservable();
  borderTrigger$ = this.borderTriggerSubject.asObservable();


  constructor() { }

  setShowResult(value: boolean): void {
    this.showResultSubject.next(value);
  }

  setBorderTrigger(value: boolean): void {
    this.borderTriggerSubject.next(value);
  }

  getShowResult(): boolean {
    return this.showResultSubject.value;
  }

  getBorderTrigger(): boolean {
    return this.borderTriggerSubject.value;
  }
}
