import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_MODULES } from '../../shared/material-imports';
import { ChannelDialogComponent } from './create-channel-dialog/create-channel-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MATERIAL_MODULES],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  constructor(private dialog: MatDialog) {}

  showDialog = false;

  openChannelDialog() {
    const dialogRef = this.dialog.open(ChannelDialogComponent);
  }
}
