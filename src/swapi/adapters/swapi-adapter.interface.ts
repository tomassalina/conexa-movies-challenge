/** A generic mapper from a raw external resource shape to an internal DTO. */
export interface SwapiAdapter<TRaw, TDto> {
  adapt(raw: TRaw): TDto;
}

/** A single swapi.tech list item after unwrapping: the resource's `uid` plus its `properties`. */
export interface SwapiRawItem<TProperties> {
  uid: string;
  properties: TProperties;
}
