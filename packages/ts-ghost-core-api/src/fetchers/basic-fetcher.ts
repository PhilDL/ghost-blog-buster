import { z, ZodRawShape } from "zod";

import { _fetch } from "../helpers/network";
import type { APICredentials } from "../schemas/shared";

export class BasicFetcher<OutputShape extends ZodRawShape = any, Api extends APICredentials = any> {
  protected _urlParams: Record<string, string> = {};
  protected _URL: URL | undefined = undefined;
  protected readonly _resource: Api["resource"];

  constructor(
    protected config: {
      output: z.ZodObject<OutputShape>;
    },
    protected _api: Api
  ) {
    this._buildUrl();
    this._resource = _api.resource;
  }

  public getResource() {
    return this._resource;
  }

  public getOutputFields() {
    return this.config.output.keyof().options as string[];
  }

  public getURL() {
    return this._URL;
  }

  private _buildUrl() {
    if (this._api.endpoint === "content") {
      this._urlParams = {
        key: this._api.key,
      };
    }
    const url = new URL(this._api.url);
    url.pathname = `/ghost/api/${this._api.endpoint}/${this._api.resource}/`;
    for (const [key, value] of Object.entries(this._urlParams)) {
      url.searchParams.append(key, value);
    }
    this._URL = url;
  }

  public async fetch(options?: RequestInit) {
    const res = z.discriminatedUnion("success", [
      z.object({
        success: z.literal(true),
        data: this.config.output,
      }),
      z.object({
        success: z.literal(false),
        errors: z.array(
          z.object({
            type: z.string(),
            message: z.string(),
          })
        ),
      }),
    ]);
    const result = await _fetch(this._URL, this._api, options);
    let data: any = {};
    if (result.errors) {
      data.success = false;
      data.errors = result.errors;
    } else {
      data = {
        success: true,
        data: result[this._resource],
      };
    }
    return res.parse(data);
  }
}
