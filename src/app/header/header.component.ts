import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProfileOverviewComponent } from './profile-overview/profile-overview.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    LogoComponentComponent,
    MatCardModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {

  constructor(private dialog: MatDialog) {}

  openDialog(): void {
    // console.log('The dialog is open');
    const dialogRef = this.dialog.open(ProfileOverviewComponent, {

      // data: {name: this.name(), animal: this.animal()},
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
      // if (result !== undefined) {
      //   this.animal.set(result);
      // }
    });
  }

}
