import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./components/app.component";
import { HttpClientModule } from "@angular/common/http";
import { ApiModule, BASE_PATH } from "../../projects/book-monkey-api/src/lib";
import { SettingsService } from "./services/settings.service";

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, HttpClientModule, ApiModule],
    providers: [
        {
            provide: BASE_PATH,
            useFactory: (service: SettingsService) => service.settings.baseUrl,
            deps: [SettingsService],
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
