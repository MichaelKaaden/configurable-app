import { Inject, Injectable } from "@angular/core";
import { SETTINGS, Settings } from "../models/settings";

@Injectable({
    providedIn: "root",
})
export class SettingsService {
    constructor(@Inject(SETTINGS) public settings: Settings) {}

    // lots of convenience methods
}
