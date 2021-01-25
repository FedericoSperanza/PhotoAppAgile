import { Component } from '@angular/core';
import { ApiService } from 'src/app/http/api.service'
import mediumZoom from 'medium-zoom';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'photoApp';
  allImages = [];
  totalPages = 0;
  defaultpage = 1;
  pageImages = [];
  showSpinner = true;
  showModal: boolean;
  previewImgSrc;
  currentIndex;
  spinnerVariable: boolean;
  loadedimgs = 0;
  preLoadImgsList = [];
  showAlertCopy = false;
  zoomEnable = false;
  currentPhotoDetails = {
    author: "",
    camera: "",
    tags: "",
    full_picture: ""
  };
  constructor(private apiService: ApiService) { }

  async ngOnInit() {

    if (JSON.parse(localStorage.getItem("allImages")) === null) {
      let res = await this.apiService.mapImages();
      this.allImages = res;
      this.apiService.pageCount$.subscribe(page => {
        this.totalPages = page * 10;

      })
    } else {
      this.allImages = JSON.parse(localStorage.getItem("allImages"));
      this.totalPages = JSON.parse(localStorage.getItem("totPages")) * 10;
    }
    this.feedPaginationImages(this.defaultpage);
    const zoom = mediumZoom('.zoom', {
      background: '#000',

    })
    zoom.on('closed', event => {
      this.showModal = true;
      this.zoomEnable = false;
    })
    zoom.on(
      'open',
      event => {
        this.showModal = false;
        this.zoomEnable = true;
      },
      {}
    )
  }

  async onPaginationClick(pageNumber) {
    this.loadedimgs = 0;
    console.log(pageNumber);
    await this.feedPaginationImages(pageNumber);
  }

  async feedPaginationImages(pageNumber) {
    let resPaginator = await this.paginator(this.allImages, pageNumber, 10);
    this.preLoadImages(resPaginator.data);
    this.preLoadImgsList = resPaginator.data;
  }

  async preLoadImages(imgList) {
    imgList.map((img) => {
      let i = new Image();
      i.onload = () => {
        this.loaded();
      }
      i.src = img.cropped_picture;
    })
  }
  loaded() {
    this.loadedimgs++;
    if (this.preLoadImgsList.length == this.loadedimgs) {
      this.pageImages = this.preLoadImgsList;
      this.showSpinner = false;
      return true;
    }
  }

  paginator(items, current_page, per_page_items) {
    let page = current_page || 1,
      per_page = per_page_items || 10,
      offset = (page - 1) * per_page,
      paginatedItems = items.slice(offset).slice(0, per_page_items),
      total_pages = Math.ceil(items.length / per_page);

    return {
      page: page,
      per_page: per_page,
      pre_page: page - 1 ? page - 1 : null,
      next_page: (total_pages > page) ? page + 1 : null,
      total: items.length,
      total_pages: total_pages,
      data: paginatedItems
    };
  }

  async showImage(srcimg, i) {
    let photoDetails = await this.apiService.getImageDetails(srcimg.id)
    this.currentPhotoDetails = photoDetails;
    this.showModal = true;
    this.previewImgSrc = srcimg.cropped_picture;
    this.currentIndex = i;
  }

  async changeImage(type) {
    this.spinnerVariable = true;
    let imgtoChange;
    let details;
    if (type === 1) {
      if (this.allImages[this.currentIndex + 1] === undefined) {
        return
      }
      imgtoChange = this.allImages[this.currentIndex + 1];
      details = await this.apiService.getImageDetails(imgtoChange.id);
      this.currentPhotoDetails = details;
      this.currentIndex++;
    } else {
      if (this.allImages[this.currentIndex - 1] === undefined) {
        return
      }
      imgtoChange = this.allImages[this.currentIndex - 1];
      details = await this.apiService.getImageDetails(imgtoChange.id);
      this.currentPhotoDetails = details;
      this.currentIndex--;
    }
    this.previewImgSrc = imgtoChange.cropped_picture;
    this.spinnerVariable = false;
  }

  hideImage() {
    this.showModal = false;
    this.previewImgSrc = "";
  }

  copyDetails() {
    return this.currentPhotoDetails.full_picture;
  }

  onCopyDetails() {
    this.showAlertCopy = true;
    setTimeout(() => this.showAlertCopy = false, 2000);
  }


}

