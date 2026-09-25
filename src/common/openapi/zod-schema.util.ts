import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { z } from 'zod';
import type { SchemaObject } from '@nestjs/swagger';

/**
 * Bridges the app's existing Zod schemas — the actual runtime source of
 * truth for validation (see `StandardSchemaValidationPipe` in `main.ts`) —
 * into OpenAPI 3.0 schema objects for `@ApiBody` / `@ApiResponse`.
 *
 * This is the single point where a Zod schema becomes Swagger documentation.
 * Controllers must never hand-write a duplicate shape for a body/query that
 * already has a Zod schema — call this instead so the docs can't drift from
 * what the pipe actually validates.
 *
 * `io: 'input'` on purpose: OpenAPI describes what the *client* sends over
 * the wire, not the post-parsing runtime type. This matters for schemas like
 * `listMoviesQuerySchema` that use `z.coerce.number()` with defaults — the
 * client sends an optional query string, not a required number.
 */
export function zodToOpenApiSchema(schema: z.ZodType): SchemaObject {
  return z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io: 'input',
    unrepresentable: 'any',
  }) as SchemaObject;
}

/**
 * OpenAPI has no concept of a single "query object" the way `@ApiBody` does
 * for request bodies — each query string parameter must be declared on its
 * own. This adapts a Zod *object* schema (e.g. `listMoviesQuerySchema`) to
 * that shape by deriving one `@ApiQuery` per top-level property from the
 * same JSON Schema conversion `zodToOpenApiSchema` produces, so the query
 * schema still has exactly one source of truth.
 */
export function zodQueryParams(schema: z.ZodObject): MethodDecorator {
  const jsonSchema = zodToOpenApiSchema(schema);
  const required = new Set(jsonSchema.required ?? []);
  const properties = jsonSchema.properties ?? {};

  const decorators = Object.entries(properties).map(([name, propertySchema]) =>
    ApiQuery({
      name,
      required: required.has(name),
      schema: propertySchema as SchemaObject,
    }),
  );
  return applyDecorators(...decorators);
}
