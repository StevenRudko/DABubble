import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root', 
})
export class InputOutput {
  public showEmojis = false;

  constructor() {
  }

  setThreadOpenStatus(show: boolean): void {
    this.showEmojis = show;
  }
}