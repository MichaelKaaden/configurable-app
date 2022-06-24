import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import { SETTINGS, Settings } from "./app/models/settings";

const cacheBuster = new Date().getTime();

fetch(`assets/settings.json?cache-buster=${cacheBuster}`) // NEW!
    .then((response) => response.json())
    .then((settings: Settings) => {
        if (environment.production) {
            enableProdMode();
        }

        platformBrowserDynamic([
            {
                // pass only the Settings into the app, delegating
                // construction of complicated operations to app.module
                provide: SETTINGS,
                useValue: settings,
            },
        ])
            .bootstrapModule(AppModule)
            .catch((err) => console.error(err));
    })
    .catch((e) => {
        console.error(`error loading the app's configuration: ${e.message}`); // NEW!
    });
