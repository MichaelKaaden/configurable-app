import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./components/app.component";
import { SettingsInitializerService } from "./services/settings-initializer.service";
import { HttpClientModule } from "@angular/common/http";

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, HttpClientModule],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: (service: SettingsInitializerService) => {
                return () => service.initializeSettings();
            },
            deps: [SettingsInitializerService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
