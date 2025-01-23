import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unique',
  standalone: true,
})
export class UniquePipe implements PipeTransform {
  transform(items: any[], key: string): any[] {
    if (!items || !key) {
      return items;
    }

    return Array.from(new Map(items.map((item) => [item[key], item])).values());
  }
}
