import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ProfileOverviewComponent } from '../../../../shared/profile-overview/profile-overview.component';

@Component({
  selector: 'app-member-overview',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './member-overview.component.html',
  styleUrl: './member-overview.component.scss',
})
export class MemberOverviewComponent {
  constructor(
    private dialogRef: MatDialogRef<MemberOverviewComponent>,
    private dialog: MatDialog
  ) {}

  close() {
    this.dialogRef.close();
  }

  openProfileDialog(user: any) {
    const userData = {
      name: user === 'Frederik Beck' ? 'Frederik Beck (Du)' : user,
      email: this.generateEmail(user),
      avatar: `img-placeholder/${user.toLowerCase().split(' ')[0]}.svg`,
      status: 'active',
    };

    this.dialog.open(ProfileOverviewComponent, {
      data: userData,
      panelClass: 'profile-dialog-container',
    });
  }

  private generateEmail(name: string): string {
    const [firstName, lastName] = name.toLowerCase().split(' ');
    return `${firstName}.${lastName}@beispiel.com`;
  }
}
