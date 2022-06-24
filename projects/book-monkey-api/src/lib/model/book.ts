/**
 * Angular.Schule Book API
 * Simple HTTP backend for serving books
 *
 * The version of the OpenAPI document: 0.0.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { Thumbnail } from './thumbnail';


/**
 * The main entity of this API
 */
export interface Book { 
    /**
     * ISBN, which is used as identifier - only numbers are allowed (no hyphens)
     */
    isbn: string;
    /**
     * Title of the book
     */
    title: string;
    /**
     * List of all authors of the book
     */
    authors?: Array<string>;
    /**
     * Subtitle of the book
     */
    subtitle?: string;
    /**
     * Rating of the book as stars, from one star (bad) to five stars (great)
     */
    rating: number;
    /**
     * date-time as defined by RFC3339 (http://www.ietf.org/rfc/rfc3339.txt) - like new Date().toISOString();
     */
    published?: Date;
    /**
     * Short description of the book
     */
    description: string;
    /**
     * Images of the book, which are used as thumbnails
     */
    thumbnails?: Array<Thumbnail>;
    /**
     * Price of the book
     */
    price?: number;
    /**
     * URL of the first thumbnail, just a shorthand
     */
    readonly firstThumbnailUrl?: string;
}

