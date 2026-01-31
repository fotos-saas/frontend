import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MissingPersonsComponent } from './missing-persons.component';

const routes: Routes = [
  { path: '', component: MissingPersonsComponent }
];

@NgModule({
  declarations: [MissingPersonsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class MissingPersonsModule {}
