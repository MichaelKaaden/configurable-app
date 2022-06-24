# Dynamic Configuration of Angular Apps During Initialization

## Motivation

In a
[previous article](https://github.com/MichaelKaaden/dockerized-app#part-ii-build-once-run-anywhere)
I showed why and how to run an Angular app in _different_ environments (and thus
with _different_ configurations) using the _same_ Docker image. Just a reminder:
One shall not rebuild an image just to be able to run it in different stages of
your release pipeline. The reason is simple: You definitely don't want your
Docker image to subtly change while your application moves through the various
testing, pre-production, and production steps in your organization.

The idea behind this is basically that the configuration is loaded via HTTP(S)
during the Angular app's initialization. So as soon as the app is running, the
configuration is ready to be consumed by your services, interceptors etc.

This also directly shows the limitation of this method: If the configuration is
already needed _during_ the initialization, this definitely can't work.

This article describes a way to get rid of this limitation.

## The example application

As an example, let's consider an application that uses the method we've talked
about for loading the configuration _and_ uses an API client generated by the
[OpenAPI Generator](https://openapi-generator.tech). This API client needs to be
supplied with the URL of the API during the initialization phase, so it is an
ideal use case for the challenge described above.

We'll be using the [Book Monkey API](https://api.angular.schule) of my friends
Ferdinand and Johannes from _Angular Schule_.

In this section, we will first set up the configurable application, then we'll
generate the API client, show the problem, and, in the final step, we'll bring
all this together and propose a solution to the problem.

### Making the App Configurable

For demonstration purposes, I created a default Angular application using
`ng new`. To make the app configurable, I'll create a `src/assets/settings.json`
file:

```json
{
    "baseUrl": "https://api.angular.schule"
}
```

Let's define an `Settings` interface that describes this file's contents:

```typescript
export interface Settings {
    baseUrl: string;
}
```

Now we need an `SettingsService` that holds an `Settings` instance and has
convenience methods to retrieve parts of the configuration or combines them
(these methods are left out here, this is only meant as a motivation _why_ we're
using this service at all instead of simply using an injection token):

```typescript
import { Injectable } from "@angular/core";
import { Settings } from "../models/settings";

@Injectable({
    providedIn: "root",
})
export class SettingsService {
    settings: Settings | undefined;

    // lots of convenience methods
}
```

Here's the `SettingsInitializerService` that is responsible for loading the
`src/assets/settings.json` (for an explanation see the aforementioned article):

```typescript
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
        return lastValueFrom(
            this.http.get<Settings>(
                `assets/settings.json?cache-buster=${ this.cacheBuster }`,
            ),
        ).then((response) => {
            this.settings.settings = response;
        });
    }
}
```

With this, we have all the parts together to build our mechanism to load the
configuration during initialization. All that's left is adding the following
`APP_INITIALIZER` to our `AppModule`:

```typescript
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { SettingsInitializerService } from "./services/settings-initializer.service";

// ...

@NgModule({
    // ...
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
})
export class AppModule {
}
```

To prove this works, we'll let the `AppComponent` consume the `Settings` and
simply show the configured `baseUrl` in the template.

Here's the `AppComponent`:

```typescript
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
```

Now update the `src/app/components/app.component.html` to simply show the
current `baseUrl`:

```html
<h1>{{ title }} app is running!</h1>

<p>current baseUrl: {{ settings?.baseUrl }}</p>
```

Running the app we see the expected output.

![Screenshot of the app running in the Browser](../configurable-app/images/screenshot1.png)

### Generating the API Client

So far, the application doesn't do anything interesting, apart from being
configurable.

Let's access the API the `baseUrl` in the app configuration is pointing to.
Fortunately, the API has a Swagger specification available. That's good, because
that means we're able to completely generate the API client so all we need to do
is using some services the generator has written for us.

Before generating the client, we need to create a library our application can
consume. We'll be creating one inside this repository using the following
command:

```shell
$ ng generate library book-monkey-api
```

This creates a typical Angular library -- a directory named `book-monkey-api`
within a `projects` directory. As the generator will do all the heavy lifting,
we don't need the files in the `projects/book-monkey-api/src/lib` directory, so
let's delete them.

Then, update `projects/book-monkey-api/src/public-api.ts` to be

```typescript
/*
 * Public API Surface of book-monkey-api
 */

export * from "./lib/api.module";
```

Currently, we don't have the `api.module.ts` file we wrote into the
`public.api.ts` file. In the next step, we'll generate the client which will
resolve this issue.

To do so, we need to extend the `package.json` with the following two lines in
the `scripts` section:

```json5
{
    // ...
    scripts: {
        // ...
        "prepare:openapi": "curl -O https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/6.0.0/openapi-generator-cli-6.0.0.jar",
        "generate:openapi": "java -jar openapi-generator-cli-6.0.0.jar generate -o projects/book-monkey-api/src/lib -i https://api.angular.schule/swagger.json -g typescript-angular --additional-properties npmName=@angular-schule/book-monkey-api,ngVersion=14,stringEnums=true --type-mappings=DateTime=Date --skip-validate-spec",
    },
    // ...
}
```

Now we can download the OpenAPI generator using `yarn prepare:openapi` and then
generate the client with `yarn generate:openapi`.

Doing so gives us the `book-monkey-api` library.

Hint: To find the latest downloadable version of the OpenAPI Generator, visit
[this](https://github.com/OpenAPITools/openapi-generator#13---download-jar) URL.

Anytime the API specification is changed, you'd need to run the generator again
and then fix warnings and errors inside your code. The interesting thing about
this is that it can no longer happen that application and API diverge regarding,
for example, data structures.

### Using the API Client

Without the code generator, you'd have to write a service requesting data for
yourself. With the code generator, this happens magically in the background. So
let's use the generated code to retrieve some books!

It's quite easy to do so. We need to import the API module in our
`app.module.ts` and provide the Book Monkey API's `BASE_PATH`:

```typescript
import { APP_INITIALIZER, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppComponent } from "./components/app.component";
import { SettingsInitializerService } from "./services/settings-initializer.service";
import { HttpClientModule } from "@angular/common/http";
import { ApiModule, BASE_PATH } from "../../projects/book-monkey-api/src/lib";

@NgModule({
    declarations: [AppComponent],
    imports: [BrowserModule, HttpClientModule, ApiModule], // NEW
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
            provide: BASE_PATH, // NEW
            useValue: "https://api.angular.schule", // should rather take this value from the settings
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
}
```

Notice we're hard-coding the `BASE_PATH` value instead of using the value from
the settings here. We're coming back to this shortly.

To use the client library, our `app.component.ts` simply needs to call a method
on the API client's `Books` service:

```typescript
import { Component } from "@angular/core";
import { Settings } from "../models/settings";
import { SettingsService } from "../services/settings.service";
import { Observable } from "rxjs";
import { Book, BooksService } from "../../../projects/book-monkey-api/src/lib";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent {
    title = "configurable-app";
    settings: Settings | undefined;
    books$: Observable<Book[]>; // NEW

    constructor(
        private settingsService: SettingsService,
        private booksService: BooksService,
    ) {
        this.settings = settingsService.settings;
        this.books$ = booksService.booksGet(); // NEW
    }
}
```

In the final step, let's show the books in our `AppComponent`'s template:

```html
<h1>{{ title }} app is running!</h1>

<p>Using {{ Settings?.baseUrl }}.</p>

<h1>Books</h1>

<p *ngFor="let book of books$ | async; index as i">
    {{ i + 1 }}. {{ book.title }}
</p>
```

You're right, that's not really pretty, but it serves its purpose: We now have a
working _generated_ API client we can use in our application.

## The Problem

You may have already seen the problem in the `app.module.ts`:

```typescript
@NgModule({
    // ...
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
    // ...
})
export class AppModule {
}
```

We're _not_ using the base path defined in the app configuration yet, but a
hard-coded one instead.

Well, that looks like an easy one: All we need to do is a small change. We need
to take the BASE_PATH from `SettingsService.config.basePath`, right?

```typescript
// ...
@NgModule({
    // ...
    providers: [
        // ...
        {
            provide: BASE_PATH,
            useFactory: (service: SettingsService) => service.Settings?.baseUrl, // NEW!
            deps: [SettingsService],
        },
    ],
    // ...
})
export class AppModule {
}
```

In my case, using this code results in a
`Http failure response for http://localhost/books` in the browser console. Why
is that? Well, as you can see in
`projects/book-monkey-api/src/lib/api/books.service.ts`, `localhost` is the
default value that is used if `BASE_PATH` has not been defined. But -- we're
defining it in the AppModule, aren't we?

The problem is: The `APP_INITIALIZER` is only guaranteed to have completed
_after_ initialization, but not _during_ initialization. Because of this, the
`SettingsService` might or might not yet have its `settings.baseUrl` property
set to the correct value.

## A Solution

To fix this problem, we need to make sure the app configuration is already
present when initialization runs, so we simply need to load the app
configuration _before_ initialization. That's quite an easy task once you know
that `platformBrowserDynamic()` also accepts providers (thanks to Tim
Deschryver's
[article](https://timdeschryver.dev/blog/angular-build-once-deploy-to-multiple-environments#platformbrowserdynamic)).

The trick is to first load the configuration, inject it via
`platformBrowserDynamic()` and, finally, initialize the app.

To be able to inject something, we first need to define an injection token.
Update the `src/app/models/settings.ts` to look like this:

```typescript
import { InjectionToken } from "@angular/core";

export interface Settings {
    baseUrl: string;
}

export const SETTINGS = new InjectionToken<Settings>("SETTINGS"); // NEW!
```

We are going to use the `SETTINGS` injection token in the `src/main.ts` file:

```typescript
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import { SETTINGS, Settings } from "./app/models/settings";

const cacheBuster = new Date().getTime();

fetch(`assets/settings.json?cache-buster=${ cacheBuster }`) // NEW!
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
        console.error(`error loading the app's configuration: ${ e.message }`); // NEW!
    });
```

Basically, we wrap the existing code in the `then` block of a call to the
[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) to first
load the configuration and then run the `platformBrowserDynamic()` code. In this
`then` block, we know we already have the configuration ready. We store it in
the dependency injection system using the `SETTINGS` token we defined above. So,
every time we need the settings, we can use them directly by injecting this
token.

Time to delete the `SettingsInitializerService` as we refactored its code into
the `main.ts` file and to refactor the `src/app/services/settings.service.ts` to
use a constructor injecting the new token (remember we need the
`SettingsService` only because of its convenience methods -- if it were for the
`Settings` alone, we wouldn't need the `SettingsService` as we could directly
inject the `SETTINGS` token wherever the `Settings` are needed):

```typescript
import { Inject, Injectable } from "@angular/core";
import { SETTINGS, Settings } from "../models/settings";

@Injectable({
    providedIn: "root",
})
export class SettingsService {
    constructor(@Inject(SETTINGS) public settings: Settings) {
    } // NEW

    // lots of convenience methods
}
```

Now, the `Settings` property is no longer optional as we know for sure it's been
loaded.

Finally, let's refactor the `src/app/app.module.ts`:

```typescript
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
export class AppModule {
}
```

With this last piece of the puzzle we have achieved nice and clean code, and we
have solved the puzzle of how to get the `Settings` ready at initialization
time.
