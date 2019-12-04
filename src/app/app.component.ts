import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { StripeService, Elements, Element as StripeElement, ElementsOptions } from "ngx-stripe";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'run-lite-buy';
  
  isLinear = true;
  searchForm: FormGroup;
  secondFormGroup: FormGroup;
  
  destinations:any;
  minDate = new Date();

  goingTravels:any[];
  returnTravels:any[];

  goingHoursTravels = [];
  goingClassesTravels = []

  // STRIPE
  elements: Elements;
  card: StripeElement;
 
  // optional parameters
  elementsOptions: ElementsOptions = {
    locale: 'es'
  };
 
  stripeTest: FormGroup;

  constructor(private _formBuilder: FormBuilder, private http: HttpClient, private stripeService: StripeService) {
    this.http.get('https://api-adonis-run-lite.herokuapp.com/api/v1/places/show_all')
    .subscribe( (res:any) => {
      this.destinations = res.data
    })
  }

  ngOnInit() {
    this.searchForm = this._formBuilder.group({
      viajeRedondo: false,
      destino: ['', Validators.required ],
      fechaSalida: ['', Validators.required ],
      horaSalida: ['', Validators.required],
      claseSalida: ['', Validators.required],
      fechaRegreso: '',
    });

    this.stripeTest = this._formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required]],
    });

    this.stripeService.elements(this.elementsOptions)
      .subscribe(elements => {
        this.elements = elements;
        // Only mount the element the first time
        if (!this.card) {
          this.card = this.elements.create('card', {
            style: {
              base: {
                iconColor: '#666EE8',
                color: '#31325F',
                lineHeight: '40px',
                fontWeight: 300,
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSize: '18px',
                '::placeholder': {
                  color: '#CFD7E0'
                }
              }
            }
          });
          this.card.mount('#card-element');
        }
      });
  }

  buy() {
    const name = this.stripeTest.get('name').value;
    this.stripeService
      .createToken(this.card, { name })
      .subscribe(result => {
        if (result.token) {
          // Use the token to create a charge or a customer
          // https://stripe.com/docs/charges
          console.log(result.token);
        } else if (result.error) {
          // Error creating the token
          console.log(result.error.message);
        }
      });
  }

  goingDatesFilter = (d: Date): boolean => {
    const day = d.toISOString().split('T')[0];
    let show = false;

    for (let travel of this.goingTravels){
      let date = new Date(travel.departure_date).toISOString().split('T')[0];
      let show = date == day;
      if(show){
          return true;
      }
    }
    return false;
  }

  returnDatesFilter = (d: Date): boolean => {
    const day = d.toISOString().split('T')[0];
    let show = false;
    let currentHour = new Date().getHours();

    for (let travel of this.returnTravels){
      let date = new Date(travel.departure_date).toISOString().split('T')[0];
      let show = date == day;
      if(show){
          return true;
      }
    }
    return false;
  }

  onDateGoingSelected(event){
    this.searchForm.controls.horaSalida.reset();
    this.searchForm.controls.claseSalida.reset();
    this.goingHoursTravels = [];
    this.goingClassesTravels = [];

    let dateSelected = new Date(event.value).toISOString().split('T')[0];
    console.log("dateSelected:", dateSelected);

    for(let travel of this.goingTravels){
      let travelDate = new Date(travel.departure_date).toISOString().split('T')[0];
      let todayDate = new Date()[0];
      let travelHour = parseInt(travel.departure_hour.split(":")[0]);
      let currentHour = new Date().getHours()
      
      //console.log(travelHour, currentHour, todayDate, dateSelected);
      if( dateSelected == travelDate){

        if((todayDate != dateSelected)){
          this.goingHoursTravels.push({ "id_departure_hour": travel.id_departure_hour, "hour": travel.departure_hour});
          //console.log(travelHour, currentHour, "IF");
        }
        else if (todayDate == dateSelected && travelHour > currentHour) {
          this.goingHoursTravels.push({ "id_departure_hour": travel.id_departure_hour, "hour": travel.departure_hour});
          //console.log(travelHour, currentHour);
        }
      }
      
    }
  }

  destinationSelected(id){
    this.searchForm.controls.fechaSalida.reset();
    this.searchForm.controls.horaSalida.reset();
    this.searchForm.controls.claseSalida.reset();
    this.goingTravels = [];
    this.goingHoursTravels = [];
    this.goingClassesTravels = [];
    this.returnTravels = [];
    
    this.http.get("https://api-adonis-run-lite.herokuapp.com/api/v1/travels/filter/"+id)
    .subscribe( (res:any) => {  
      this.goingTravels = res.viajesSalidas;
      this.returnTravels = res.viajesRegreso;
    })
  }

  vacantSeat(index_silla){
    if(index_silla % 2 == 0)
      return false;
    return true;
  }

  selectSeat(event, classAdd){
    let sillaSeleccionadaAnt = document.getElementsByClassName(classAdd);
    let elemId = event.explicitOriginalTarget.id;
    let classList = document.getElementById(elemId).classList;
    
    console.log(sillaSeleccionadaAnt)

    if (sillaSeleccionadaAnt.length > 0 && classList.contains("silla-libre"))
      sillaSeleccionadaAnt[0].classList.remove(classAdd);
    
    if(classList.contains("silla-libre")){
      classList.add(classAdd);
      
      if(classAdd == 'silla-ida-seleccionada'){
        console.log("silla ida:", elemId)
      }else{
        console.log("silla regreso:", elemId)
      }
      
    } 
  }

  hourGoingSelected(hour){
    console.log(hour)
  }
}
