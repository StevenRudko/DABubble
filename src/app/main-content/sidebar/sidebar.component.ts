import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ChannelDialogComponent } from './create-channel-dialog/create-channel-dialog.component';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface Channel {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  channels$: Observable<Channel[]>;
  isChannelSectionExpanded: boolean = true;
  isDirectMessageSectionExpanded: boolean = true;

  constructor(private dialog: MatDialog, private firestore: Firestore) {
    const channelsCollection = collection(this.firestore, 'channels');
    this.channels$ = collectionData(channelsCollection, {
      idField: 'id',
    }) as Observable<Channel[]>;
  }

  ngOnInit() {
    // Nicht mehr benötigt, da wir jetzt die komplette Collection beobachten
  }

  openChannelDialog() {
    const dialogRef = this.dialog.open(ChannelDialogComponent);
  }

  toggleChannelSection() {
    this.isChannelSectionExpanded = !this.isChannelSectionExpanded;
  }

  toggleDirectMessageSection() {
    this.isDirectMessageSectionExpanded = !this.isDirectMessageSectionExpanded;
  }
}
