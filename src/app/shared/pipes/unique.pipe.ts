import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unique',
  standalone: true,
})
export class UniquePipe implements PipeTransform {
  transform(items: any[] | undefined | null, key: string): any[] {
    if (!items || !Array.isArray(items) || !key) {
      return [];
    }

    return Array.from(new Map(items.map((item) => [item[key], item])).values());
  }
}
