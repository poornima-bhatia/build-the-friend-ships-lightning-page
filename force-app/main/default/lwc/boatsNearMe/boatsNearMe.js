import { LightningElement, api, wire } from 'lwc';
import getBoatsByLocation from '@salesforce/apex/BoatDataService.getBoatsByLocation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// imports
const LABEL_YOU_ARE_HERE = 'You are here!';
const ICON_STANDARD_USER = 'standard:user';
const ERROR_TITLE = 'Error loading Boats Near Me';
const ERROR_VARIANT = 'error';
export default class BoatsNearMe extends LightningElement {
    @api
    boatTypeId;
    mapMarkers = [];
    isLoading = true;
    isRendered = false;
    latitude;
    longitude;

    // Add the wired method from the Apex Class
    // Name it getBoatsByLocation, and use latitude, longitude and boatTypeId
    // Handle the result and calls createMapMarkers
    @wire(getBoatsByLocation, { latitude: '$latitude' , longitude: '$longitude' , boatTypeId: '$boatTypeId' })
    wiredBoatsJSON({ error , data }) { 
        if (data) {
            this.createMapMarkers(data);
        } else if (error) {
            const toast = new ShowToastEvent({
                title: ERROR_TITLE,
                message: error.message,
                variant: ERROR_VARIANT,
            });
            this.dispatchEvent(toast);
        }
        this.isLoading = false;
    }

    // Controls the isRendered property
    // Calls getLocationFromBrowser()
    renderedCallback() { 
        if (this.isRendered) {
            return;
        }
        this.isRendered = true;
        this.getLocationFromBrowser();
    }

    // Gets the location from the Browser
    getLocationFromBrowser() { 
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.latitude = position.coords.latitude;
                    this.longitude = position.coords.longitude;
                },
                (error) => {
                    const toast = new ShowToastEvent({
                        title: ERROR_TITLE,
                        message: error.message,
                        variant: ERROR_VARIANT,
                    });
                    this.dispatchEvent(toast);
                    this.isLoading = false;
                }
            );
        } else {
            const toast = new ShowToastEvent({
                title: ERROR_TITLE,
                message: 'Geolocation is not supported by this browser.',
                variant: ERROR_VARIANT,
            });
            this.dispatchEvent(toast);
            this.isLoading = false;
        }
    }

    // Creates the map markers
    createMapMarkers(boatData) {
        const newMarkers = JSON.parse(boatData).map(boat => {
            return {
                title: boat.Name,
                location: {
                    Latitude: boat.Geolocation__Latitude__s,
                    Longitude: boat.Geolocation__Longitude__s
                }
            };
        });
        newMarkers.unshift({
            title: LABEL_YOU_ARE_HERE,
            icon: ICON_STANDARD_USER,
            iconColor: 'blue',
            location: {
                Latitude: this.latitude,
                Longitude: this.longitude
            }
        });
        this.mapMarkers = newMarkers;
    }
}
