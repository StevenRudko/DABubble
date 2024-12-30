// input-output.service.ts
import { Injectable } from '@angular/core';

interface EmojiConfig {
  icon: string;
  type: 'material' | 'emoji';
}

@Injectable({
  providedIn: 'root',
})
export class InputOutput {

  constructor() {}

 
}