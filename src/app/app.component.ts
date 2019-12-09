import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { StripeService, Elements, Element as StripeElement, ElementsOptions } from "ngx-stripe";
import Swal from 'sweetalert2'


@Component({
  selector: 'app-root', 
  templateUrl: './app.component.html', 
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'run-lite-buy';
  
  isLinear = true;
  searchForm: FormGroup;
  goingTravelForm: FormGroup;
  returnTravelForm: FormGroup;
  secondFormGroup: FormGroup;
  
  destinations:any;
  minDate = new Date();
  
  goingTravels:any[];
  returnTravels:any[];
  
  goingHoursTravels = [];
  goingClassesTravels = [];
  goingAvaliableSeats = [];

  returnHoursTravels = [];
  returnClassesTravels = [];
  returnAvaliableSeats = [];

  viajeRedondo = false;
  //URL_API = 'https://api-node-travels.herokuapp.com/api/sales';
  URL_API = 'http://localhost:3000/api/sale';

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
    this.goingTravelForm = this._formBuilder.group({
      destino: ['', Validators.required ],
      fechaSalida: ['', Validators.required ],
      horaSalida: ['', Validators.required],
      claseSalida: ['', Validators.required],
      sillaSalida: ['', Validators.required],
      idViajeSalida: ['', Validators.required],
      costo: [0, Validators.required],
    });

    this.returnTravelForm = this._formBuilder.group({
      idViajeRegreso: ['', Validators.required],
      fechaRegreso: ['', Validators.required],
      horaRegreso: ['', Validators.required],
      claseRegreso: ['', Validators.required],
      sillaRegreso: ['', Validators.required],
      costo: [0, Validators.required],
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
    //console.log((parseInt(this.goingTravelForm.value.cost) + parseInt(this.goingTravelForm.value.cost) * 0.09), parseInt(this.goingTravelForm.value.cost))    
    var data = {
      type: this.viajeRedondo ? 'redondo' : 'sencillo',
      seat_1: this.goingTravelForm.value.sillaSalida,
      seat_2: this.returnTravelForm.value.sillaRegreso,
      total_1: this.viajeRedondo ? (parseFloat(this.goingTravelForm.value.costo) + parseFloat(this.goingTravelForm.value.costo) * 0.09) : parseFloat(this.goingTravelForm.value.costo),
      total_2: this.viajeRedondo ? (parseFloat(this.returnTravelForm.value.costo) + parseFloat(this.returnTravelForm.value.costo) * 0.09) : parseFloat(this.returnTravelForm.value.costo),
      name: this.stripeTest.value.name,
      email: this.stripeTest.value.email,
      payment: "Card",
      travel_going_id: this.goingTravelForm.value.idViajeSalida,
      travel_return_id: this.returnTravelForm.value.idViajeRegreso,
      stripeToken: ''
    }
    
    const name = this.stripeTest.get('name').value;
    this.stripeService
      .createToken(this.card, { name })
      .subscribe((result:any) => {
        if (result.token) {
          data.stripeToken = result.token.id;
          console.log(data);
          this.http.post(this.URL_API, data).subscribe(res => {
            console.log(res)
            Swal.fire({
              title: 'Pago completado!',
              text: 'Tu lugar se ha reservado exitosamente',
              icon: 'success',
              confirmButtonText: 'Aceptar',
            }).then( res => { location.reload() });
            /*
            swal("Pago completado!", "Tu lugar se ha reservado correctamente, con tu correo es suficiente!", "success").then( res => {
              location.reload();
            });*/
          });
          //console.log(result.token);
        } else if (result.error) {
          console.log(result.error.message);
          Swal.fire({
            title: 'Error',
            text: result.error.message,
            icon: 'error',
            confirmButtonText: 'Aceptar',
          })
          //swal("Error", result.error.message, "error");
        }
      });
  }

  goingDatesFilter = (d: Date): boolean => {
    const day = d.toISOString().split('T')[0];

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
    let currentHour = new Date().getHours();

    //si el dia es mayor o igual a la fecha de salida
    let dateGoingSelected = new Date(this.goingTravelForm.value.fechaSalida.toISOString().split('T')[0])
    
    if (+d >= +dateGoingSelected){
      for (let travel of this.returnTravels){
        let date = new Date(travel.departure_date).toISOString().split('T')[0];
        let show = date == day;
        if(show){
            return true;
        }
      }
    }

    return false;
  }

  onDateGoingSelected(event){
    this.goingTravelForm.controls.horaSalida.reset();
    this.goingTravelForm.controls.claseSalida.reset();
    this.goingHoursTravels = [];
    this.goingClassesTravels = [];
    this.goingAvaliableSeats = [];

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

  onDateReturnSelected(event){
    
    this.returnTravelForm.controls.horaRegreso.reset();
    this.returnTravelForm.controls.claseRegreso.reset();
    this.returnHoursTravels = [];
    this.returnClassesTravels = [];
    this.returnAvaliableSeats = [];

    let dateSelected = new Date(event.value).toISOString().split('T')[0];
    console.log("dateSelected:", dateSelected);

    for(let travel of this.returnTravels){
      let travelDate = new Date(travel.departure_date).toISOString().split('T')[0];
      let todayDate = new Date()[0];
      let travelHour = parseInt(travel.departure_hour.split(":")[0]);
      let currentHour = new Date().getHours()
      
      //console.log(travelHour, currentHour, todayDate, dateSelected);
      if( dateSelected == travelDate){
        if((todayDate != dateSelected)){
          this.returnHoursTravels.push({ "id_departure_hour": travel.id_departure_hour, "hour": travel.departure_hour});
          //console.log(travelHour, currentHour, "IF");
        }
        else if (todayDate == dateSelected && travelHour > currentHour) {
          this.returnHoursTravels.push({ "id_departure_hour": travel.id_departure_hour, "hour": travel.departure_hour});
          //console.log(travelHour, currentHour);
        }
      }
    }
  }

  destinationSelected(id){
    this.goingTravelForm.controls.fechaSalida.reset();
    this.goingTravelForm.controls.horaSalida.reset();
    this.goingTravelForm.controls.claseSalida.reset();
    this.goingTravels = [];
    this.goingHoursTravels = [];
    this.goingClassesTravels = [];
    this.goingAvaliableSeats = []
    this.returnTravels = [];
    
    this.http.get("https://api-adonis-run-lite.herokuapp.com/api/v1/travels/filter/"+id)
    .subscribe( (res:any) => {  
      this.goingTravels = res.viajesSalidas;
      this.returnTravels = res.viajesRegreso;
    })
  }

  vacantSeat(index_silla){
    return this.goingAvaliableSeats.includes(index_silla);
  }

  vacantSeatReturn(index_silla){
    return this.returnAvaliableSeats.includes(index_silla);
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
        this.goingTravelForm.value.sillaSalida = elemId;
      }
      else{
        if(elemId < 300){ 
          this.returnTravelForm.value.sillaRegreso = String(elemId-199);
        }
        else{
          this.returnTravelForm.value.sillaRegreso = String(elemId-275);
        }
      }
      
    } 
  }

  hourGoingSelected(hour){
    this.goingTravelForm.controls.claseSalida.reset();
    this.goingClassesTravels = [];
    this.goingAvaliableSeats = [];
    
    for(let travel of this.goingTravels){
      let travelDate = new Date(travel.departure_date).toISOString().split('T')[0];
      let travelDateSelected = this.goingTravelForm.value.fechaSalida.toISOString().split('T')[0];
      //console.log(travel.departure_hour, hour, "&&", travelDate, travelDateSelected)
      
      if(travel.departure_hour == hour && travelDate == travelDateSelected){
        this.goingClassesTravels.push(travel.class)
      }
    }
  }

  hourReturnSelected(hour){
    this.returnTravelForm.controls.claseRegreso.reset();
    this.returnClassesTravels = [];
    this.returnAvaliableSeats = [];
    
    for(let travel of this.returnTravels){
      let travelDate = new Date(travel.departure_date).toISOString().split('T')[0];
      let travelDateSelected = this.returnTravelForm.value.fechaRegreso.toISOString().split('T')[0];
      //console.log(travel.departure_hour, hour, "&&", travelDate, travelDateSelected)
      
      if(travel.departure_hour == hour && travelDate == travelDateSelected){
        this.returnClassesTravels.push(travel.class)
      }
    }
  }

  classGoingSelected(classs){
    for(let travel of this.goingTravels){
      let travelDate = new Date(travel.departure_date).toISOString().split('T')[0];
      let travelDateSelected = this.goingTravelForm.value.fechaSalida.toISOString().split('T')[0];
      let hourSelected = this.goingTravelForm.value.horaSalida;
      let classSelected = classs;
      console.log(travelDate, travelDateSelected, hourSelected, classSelected);

      if(travelDate == travelDateSelected && travel.id_departure_hour == hourSelected && travel.class == classSelected){
        this.goingAvaliableSeats = travel.available_seats;
        console.log(this.goingAvaliableSeats);
        this.goingTravelForm.value.idViajeSalida = travel.id_travel;
        this.goingTravelForm.value.costo = travel.cost;
        return;
      }
    }
  }

  classReturnSelected(classs){
    for(let travel of this.returnTravels){
      let travelDate = new Date(travel.departure_date).toISOString().split('T')[0];
      let travelDateSelected = this.returnTravelForm.value.fechaRegreso.toISOString().split('T')[0];
      let hourSelected = this.returnTravelForm.value.horaRegreso;
      let classSelected = classs;
      console.log(travelDate, travelDateSelected, hourSelected, classSelected);

      if(travelDate == travelDateSelected && travel.id_departure_hour == hourSelected && travel.class == classSelected){
        this.returnAvaliableSeats = travel.available_seats;
        console.log(this.returnAvaliableSeats);
        this.returnTravelForm.value.idViajeRegreso = travel.id_travel;
        this.returnTravelForm.value.costo = travel.cost;
        return;
      }
    }
  }

  updateValidators(){
    
    this.viajeRedondo = !this.viajeRedondo;
  
    /*
    const fechaRegresoControl = this.searchForm.get('fechaRegreso');
    const horaRegresoControl = this.searchForm.get('horaRegreso');
    const claseRegresoControl = this.searchForm.get('claseRegreso');
    const sillaRegresoControl = this.searchForm.get('sillaRegreso');
    //const sillaRegresoControl = this.searchForm.get('idViajeRegreso');

    
    if(!this.searchForm.value.viajeRedondo){
      fechaRegresoControl.setValidators([Validators.required]);
      horaRegresoControl.setValidators([Validators.required]);
      claseRegresoControl.setValidators([Validators.required]);
      sillaRegresoControl.setValidators([Validators.required]);

    }else{
      fechaRegresoControl.setValidators(null);
      horaRegresoControl.setValidators(null);
      claseRegresoControl.setValidators(null);
      sillaRegresoControl.setValidators(null);
    }
    
    fechaRegresoControl.updateValueAndValidity();
    horaRegresoControl.updateValueAndValidity();
    claseRegresoControl.updateValueAndValidity();
    sillaRegresoControl.updateValueAndValidity();
*/
  }
}
