import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggleModule, MatCheckboxModule, MatDatepickerModule, MatNativeDateModule, MatStepperModule, MatInputModule, MatButtonModule, MatSelectModule, MatIconModule, MatToolbarModule, MatCardModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgxStripeModule } from 'ngx-stripe';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NgxStripeModule.forRoot('pk_test_OYuXFtpppcRx1rTc7ifegyhh00hbhxY1oA'),
    FormsModule, 
    ReactiveFormsModule,
    HttpClientModule,
    MatSlideToggleModule, 
    MatInputModule, 
    MatButtonModule, 
    MatSelectModule, 
    MatIconModule,
    MatStepperModule,
    MatToolbarModule,
    MatCardModule,
    MatDatepickerModule,        
    MatNativeDateModule,
    MatCheckboxModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
