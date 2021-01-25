import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';
import { ImagesData } from 'src/app/models/image-data'
import * as moment from "moment";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private pageCount = new BehaviorSubject<number>(0);
  pageCount$ = this.pageCount.asObservable()
  private optionsGet = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ''
    }
  };
  private optionsPost = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      apiKey: environment.apiKey
    })
  };


  constructor() { }


  getAuthToken() {
    return fetch(environment.api + 'auth', this.optionsPost)
      .then(res => {
        return res.json();
      })
      .then(resJson => {
        environment.token = resJson.token;
        localStorage.setItem('token', resJson.token);
        const expiresAt = moment().add('300', 'second');
        localStorage.setItem("expires_at", JSON.stringify(expiresAt));
        return resJson.token;
      })
  }

  async getImages(page) {
    this.optionsGet.headers.Authorization = 'Bearer' + " " + localStorage.getItem('token');
    let res = await fetch(environment.api + 'images?page=' + page + '', this.optionsGet)
      .then(res => {
        return res.json();
      })
      .catch(e => {
        throw (e)
      })
    return res;
  }

  async getImageDetails(id) {
    this.optionsGet.headers.Authorization = 'Bearer' + " " + localStorage.getItem('token');
    let res = await fetch(environment.api + 'images/' + id + '', this.optionsGet)
      .then(res => {
        return res.json();
      })
      .catch(e => {
        throw (e)
      })
    return res;
  }

  async mapImages() {
    let isExpiredSession = moment().isAfter(this.getExpiration());
    if (localStorage.getItem('token') === null || isExpiredSession) {
      await this.getAuthToken();
    }
    let imagesRes: any;
    imagesRes = await this.getImages(1);
    let picturesFromPage = [];
    this.sendPageCount(imagesRes.pageCount);
    picturesFromPage.push(imagesRes.pictures);

    for (let index = 2; index <= imagesRes.pageCount; index++) {
      let res = await this.getImages(index);
      picturesFromPage[0].push(res.pictures)
    }
    var flatArray = Array.prototype.concat.apply([], picturesFromPage[0]);
    let allPictures = [];
    flatArray.map(img => {
      let imgModel = new ImagesData();
      imgModel.id = img.id;
      imgModel.cropped_picture = img.cropped_picture;
      allPictures.push(imgModel);
    })
    localStorage.setItem('allImages', JSON.stringify(allPictures));
    return allPictures;
  }

  getExpiration() {
    const expiration = localStorage.getItem("expires_at");
    const expiresAt = JSON.parse(expiration);
    return moment(expiresAt);
  }

  sendPageCount(numberOfPages) {
    localStorage.setItem('totPages', JSON.stringify(numberOfPages));
    this.pageCount.next(numberOfPages);
  }




}

