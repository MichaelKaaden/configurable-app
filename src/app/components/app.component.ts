import { Component } from "@angular/core";
import { Settings } from "../models/settings";
import { SettingsService } from "../services/settings.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    title = "configurable-app";
    settings: Settings | undefined;

    constructor(private settingsService: SettingsService) {
        this.settings = settingsService.settings;
    }
}
