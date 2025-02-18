import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'mentionHighlight',
  standalone: true,
})
export class MentionHighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) return '';

    const mentionRegex = /@(\w+)/g;
    const htmlText = text.replace(
      mentionRegex,
      '<span class="mention-text">@$1</span>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(htmlText);
  }
}
