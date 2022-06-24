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
    books$: Observable<Book[]>;

    constructor(private settingsService: SettingsService, private booksService: BooksService) {
        this.settings = settingsService.settings;
        this.books$ = booksService.booksGet();
    }
}
