import { z, ZodObject, ZodRawShape, ZodTypeAny } from "zod";

import { DeleteFetcher } from "./fetchers";
import { BrowseFetcher } from "./fetchers/browse-fetcher";
import { MutationFetcher } from "./fetchers/mutation-fetcher";
import { ReadFetcher } from "./fetchers/read-fetcher";
import { parseBrowseParams, type BrowseParams } from "./helpers/browse-params";
import type { APICredentials } from "./schemas";

/**
 * API Composer contains all methods, pick and choose.
 */
export class APIComposer<
  Shape extends ZodRawShape = any,
  IdentityShape extends z.ZodTypeAny = any,
  IncludeShape extends ZodRawShape = any,
  CreateShape extends ZodRawShape = any,
  CreateOptions extends ZodTypeAny = any,
  UpdateShape extends ZodRawShape = any,
  Api extends APICredentials = any
> {
  constructor(
    protected config: {
      schema: z.ZodObject<Shape>;
      identitySchema: IdentityShape;
      include: z.ZodObject<IncludeShape>;
      createSchema?: z.ZodObject<CreateShape>;
      createOptionsSchema?: CreateOptions;
      updateSchema?: z.ZodObject<UpdateShape>;
    },
    protected _api: Api
  ) {}

  /**
   * Browse function that accepts browse params order, filter, page and limit. Will return an instance
   * of BrowseFetcher class.
   */
  public browse<
    const OrderStr extends string,
    const FilterStr extends string,
    const P extends {
      order?: OrderStr;
      limit?: number | string;
      page?: number | string;
      filter?: FilterStr;
    }
  >(options?: BrowseParams<P, Shape & IncludeShape>) {
    return new BrowseFetcher(
      {
        schema: this.config.schema,
        output: this.config.schema,
        include: this.config.include,
      },
      {
        browseParams:
          (options && parseBrowseParams(options, this.config.schema, this.config.include)) || undefined,
      },
      this._api
    );
  }

  /**
   * Read function that accepts Identify fields like id, slug or email. Will return an instance
   * of ReadFetcher class.
   */
  public read(options: z.infer<IdentityShape>) {
    return new ReadFetcher(
      {
        schema: this.config.schema,
        output: this.config.schema,
        include: this.config.include,
      },
      {
        identity: this.config.identitySchema.parse(options),
      },
      this._api
    );
  }

  public async add(data: z.output<z.ZodObject<CreateShape>>, options?: z.infer<CreateOptions>) {
    if (!this.config.createSchema) {
      throw new Error("No createSchema defined");
    }
    const parsedData = this.config.createSchema.parse(data);
    const parsedOptions =
      this.config.createOptionsSchema && options
        ? this.config.createOptionsSchema.parse(options)
        : undefined;
    const fetcher = new MutationFetcher(
      {
        output: this.config.schema,
        paramsShape: this.config.createOptionsSchema,
      },
      parsedOptions,
      { method: "POST", body: parsedData },
      this._api
    );
    return fetcher.submit();
  }

  public async edit(
    id: string,
    data: ThisParameterType<UpdateShape> extends any
      ? Partial<z.output<z.ZodObject<CreateShape>>>
      : z.output<z.ZodObject<UpdateShape>>
  ) {
    let updateSchema: z.ZodObject<any> | undefined = this.config.updateSchema;
    if (!this.config.updateSchema && this.config.createSchema) {
      updateSchema = this.config.createSchema.partial();
    }
    if (!updateSchema) {
      throw new Error("No updateSchema defined");
    }
    const cleanId = z.string().nonempty().parse(id);
    const parsedData = updateSchema.parse(data);

    if (Object.keys(parsedData).length === 0) {
      throw new Error("No data to edit");
    }
    const fetcher = new MutationFetcher(
      {
        output: this.config.schema,
        paramsShape: this.config.createOptionsSchema,
      },
      { id: cleanId },
      { method: "PUT", body: parsedData },
      this._api
    );
    return fetcher.submit();
  }

  public async delete(id: string) {
    const cleanId = z.string().nonempty().parse(id);
    const fetcher = new DeleteFetcher({ id: cleanId }, this._api);
    return fetcher.submit();
  }

  public access<const Keys extends keyof this>(keys: Keys[]) {
    const d: {
      [Property in keyof this]?: this[Property];
    } = {};
    keys.forEach((key) => {
      d[key] = (this[key] as Function).bind(this);
    });
    return d as Pick<this, Keys>;
  }
}
