import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponentComponent } from '../shared/logo-component/logo-component.component';
import { MATERIAL_MODULES } from '../shared/material-imports';
import { MatDialog } from '@angular/material/dialog';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { SearchBarComponent } from "./search-bar/search-bar.component";
import { FormsModule } from '@angular/forms';
import { UserInfosService } from '../service/user-infos.service';
import { ShowHiddeResultsService } from '../service/show-hidde-results.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LogoComponentComponent, MATERIAL_MODULES, CommonModule, SearchBarComponent, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  borderTrigger: boolean = false;
  searchQuery: string = '';
  showResult: boolean = false;

  constructor(
    private dialog: MatDialog,
    public userInfo: UserInfosService,
    public showHiddeService: ShowHiddeResultsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.showHiddeService.showResult$.subscribe(value => {
      this.showResult = value;
      this.cdr.detectChanges();
    });
    this.showHiddeService.borderTrigger$.subscribe(value => {
      this.borderTrigger = value;
      this.cdr.detectChanges();
    });
  }

  @HostListener('document:click', ['$event'])
  // @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.searchbar-container')) {
      this.showHiddeService.setShowResult(false)
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UserMenuComponent, {});
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}
