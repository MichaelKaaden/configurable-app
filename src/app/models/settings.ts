import { InjectionToken } from "@angular/core";

export interface Settings {
    baseUrl: string;
}

export const SETTINGS = new InjectionToken<Settings>("SETTINGS");
