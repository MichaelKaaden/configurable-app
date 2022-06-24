import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./components/app.component";
import { SettingsInitializerService } from "./services/settings-initializer.service";
import { HttpClientModule } from "@angular/common/http";
import { ApiModule, BASE_PATH } from "../../projects/book-monkey-api/src/lib";

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, HttpClientModule, ApiModule],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: (service: SettingsInitializerService) => {
                return () => service.initializeSettings();
            },
            deps: [SettingsInitializerService],
            multi: true,
        },
        {
            provide: BASE_PATH,
            useValue: "https://api.angular.schule", // should rather take this value from the settings
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
