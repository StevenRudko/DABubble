import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-member-overview',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './member-overview.component.html',
  styleUrl: './member-overview.component.scss',
})
export class MemberOverviewComponent {
  constructor(private dialogRef: MatDialogRef<MemberOverviewComponent>) {}

  close() {
    this.dialogRef.close();
  }
}
