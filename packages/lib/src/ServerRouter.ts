import { BaseRouter } from "./BaseRouter";
import type { AnyFunction, StringRecord } from "./types";

type QueryPayload = Record<string, string | number | undefined>;

export class ServerRouter<Handler extends AnyFunction> extends BaseRouter<Handler> {
  #currentUrl = "/";
  #origin = "http://localhost";
  #query: StringRecord = {};

  constructor(baseUrl = "") {
    super(baseUrl);
  }

  get query(): StringRecord {
    return this.#query;
  }

  set query(newQuery: QueryPayload) {
    this.#query = newQuery
      ? Object.fromEntries(Object.entries(newQuery).map(([key, value]) => [key, String(value ?? "")]))
      : {};
  }

  getCurrentUrl(): string {
    return this.#currentUrl;
  }

  getOrigin(): string {
    return this.#origin;
  }

  setUrl(url: string, origin = "http://localhost") {
    this.#currentUrl = url;
    this.#origin = origin;
    this.updateRoute(this.getCurrentUrl());
  }

  start(): void {
    this.updateRoute(this.getCurrentUrl());
  }
}
