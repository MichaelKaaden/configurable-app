import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { SettingsService } from "./settings.service";
import { Settings } from "../models/settings";
import { lastValueFrom } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class SettingsInitializerService {
    readonly cacheBuster;

    constructor(private http: HttpClient, private settings: SettingsService) {
        this.cacheBuster = new Date().getTime();
    }

    initializeSettings(): Promise<void> {
        // make sure not to use a cached copy
        return lastValueFrom(this.http.get<Settings>(`assets/settings.json?cache-buster=${this.cacheBuster}`)).then(
            (response) => {
                this.settings.settings = response;
            },
        );
    }
}
