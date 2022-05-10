import { Injectable } from '@angular/core';
import { Api } from './api';

@Injectable({
  providedIn: 'root'
})
export class SolaceService extends Api {
  constructor() {
    super();
  }
}
