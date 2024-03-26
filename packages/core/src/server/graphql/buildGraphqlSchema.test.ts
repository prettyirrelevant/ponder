import { setupDatabaseServices, setupIsolatedDatabase } from "@/_test/setup.js";
import { getTableIds } from "@/_test/utils.js";
import { createSchema } from "@/schema/schema.js";
import { zeroCheckpoint } from "@/utils/checkpoint.js";
import { execute, parse } from "graphql";
import { beforeEach, expect, test } from "vitest";
import { buildGraphqlSchema } from "./buildGraphqlSchema.js";
import { buildLoaderCache } from "./buildLoaderCache.js";

beforeEach((context) => setupIsolatedDatabase(context));

test("scalar", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
      string
      int
      float
      boolean
      hex
      bigint
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    table: {
      id: "0",
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x00",
      bigint: "0",
    },
  });

  await cleanup();
});

test("scalar list", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string().list(),
      int: p.int().list(),
      float: p.float().list(),
      boolean: p.boolean().list(),
      hex: p.hex().list(),
      bigint: p.bigint().list(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: ["0"],
      int: [0],
      float: [0],
      boolean: [false],
      hex: ["0x0"],
      bigint: [0n],
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
      string
      int
      float
      boolean
      hex
      bigint
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    table: {
      id: "0",
      string: ["0"],
      int: [0],
      float: [0],
      boolean: [false],
      // TODO(kyle) look at hex list
      hex: ["0x0"],
      bigint: ["0"],
    },
  });

  await cleanup();
});

test("scalar optional", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string().optional(),
      int: p.int().optional(),
      float: p.float().optional(),
      boolean: p.boolean().optional(),
      hex: p.hex().optional(),
      bigint: p.bigint().optional(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: null,
      int: null,
      float: null,
      boolean: null,
      hex: null,
      bigint: null,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
      string
      int
      float
      boolean
      hex
      bigint
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    table: {
      id: "0",
      string: null,
      int: null,
      float: null,
      boolean: null,
      hex: null,
      bigint: null,
    },
  });

  await cleanup();
});

test.skip("scalar optional list", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string().optional().list(),
      int: p.int().optional().list(),
      float: p.float().optional().list(),
      boolean: p.boolean().optional().list(),
      hex: p.hex().optional().list(),
      bigint: p.bigint().optional().list(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: ["0", null],
      int: [0, null],
      float: [0, null],
      boolean: [false, null],
      hex: ["0x0", null],
      bigint: [0n, null],
    },
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "1",
    data: {
      string: ["1", null],
      int: [1, null],
      float: [1, null],
      boolean: [true, null],
      hex: ["0x", null],
      bigint: [1n, null],
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
      string
      int
      float
      boolean
      hex
      bigint
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  console.log(result);

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: ["0", null],
          int: [0, null],
          float: [0, null],
          boolean: [false, null],
          hex: ["0x0", null],
          bigint: [0n, null],
        },
        {
          id: "1",
          string: ["1", null],
          int: [1, null],
          float: [1, null],
          boolean: [true, null],
          hex: ["0x1", null],
          bigint: [1n, null],
        },
      ],
    },
  });

  await cleanup();
});

test("enum", async (context) => {
  const schema = createSchema((p) => ({
    enum: p.createEnum(["A", "B"]),
    table: p.createTable({
      id: p.string(),
      enum: p.enum("enum"),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      enum: "A",
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
      enum
    }
  }
`);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    table: {
      id: "0",
      enum: "A",
    },
  });

  await cleanup();
});

test("enum optional", async (context) => {
  const schema = createSchema((p) => ({
    enum: p.createEnum(["A", "B"]),
    table: p.createTable({
      id: p.string(),
      enum: p.enum("enum").optional(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      enum: null,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
      enum
    }
}
`);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    table: {
      id: "0",
      enum: null,
    },
  });

  await cleanup();
});

test("enum list", async (context) => {
  const schema = createSchema((p) => ({
    enum: p.createEnum(["A", "B"]),
    table: p.createTable({
      id: p.string(),
      enum: p.enum("enum").list(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      enum: ["A"],
    },
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "1",
    data: {
      enum: ["B"],
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
      enum
    }
  }
`);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    table: {
      id: "0",
      enum: ["A"],
    },
  });

  await cleanup();
});

test.skip("enum optional list", async (context) => {
  const schema = createSchema((p) => ({
    enum: p.createEnum(["A", "B"]),
    table: p.createTable({
      id: p.string(),
      enum: p.enum("enum").optional().list(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      enum: ["A", null],
    },
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "1",
    data: {
      enum: ["B", null],
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
      enum
    }
  }
}
`);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          enum: ["A", null],
        },
        {
          id: "1",
          enum: ["B", null],
        },
      ],
    },
  });

  await cleanup();
});

test("one", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),

      ref: p.string().references("table.id"),
      one: p.one("ref"),

      refNull: p.string().references("table.id").optional(),
      oneNull: p.one("refNull"),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      ref: "0",
      refNull: null,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      one {
        id
      }
      oneNull {
        id
      }
    }
  }
  `);

  const getLoader = buildLoaderCache({ store: indexingStore });
  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore, getLoader },
  });

  expect(result.data).toMatchObject({
    table: {
      one: {
        id: "0",
      },
      oneNull: null,
    },
  });

  await cleanup();
});

test("many", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),

      ref: p.string().references("many.id"),
      // refNull: p.string().references("many.id").optional(),
    }),
    many: p.createTable({
      id: p.string(),
      manyCol: p.many("table.ref"),
      // manyNull: p.many("table.refNull"),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      ref: "0",
      // refNull: null,
    },
  });

  await indexingStore.create({
    tableName: "many",
    checkpoint: zeroCheckpoint,
    id: "0",
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    many(id: "0") {
      manyCol { 
        items {
          id
        }
      }
    }
  }
  `);

  const getLoader = buildLoaderCache({ store: indexingStore });
  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore, getLoader },
  });

  expect(result.data).toMatchObject({
    many: {
      manyCol: {
        items: [
          {
            id: "0",
          },
        ],
      },
    },
  });

  await cleanup();
});

test("bigint id", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: 0n,
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0") {
      id
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    table: {
      id: "0",
    },
  });

  await cleanup();
});

test("hex id", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.hex(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0x00",
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    table(id: "0x00") {
      id
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    table: {
      id: "0x00",
    },
  });

  await cleanup();
});

test("filter string eq", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { string: "0" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter string in", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { string_in: ["0", "2"] }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter string contains", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "string",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { string_contains: "tr" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "string",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter string starts with", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "string",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { string_starts_with: "str" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "string",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter string not ends with", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "string",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { string_not_ends_with: "str" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "string",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter int eq", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { int: 0 }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter int gt", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 1,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { int_gt: 0 }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 1,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter int lte", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { int_lte: 0 }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter in in", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { int_in: [0, 2] }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter float eq", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { float: 0 }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter float gt", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 1,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { float_gt: 0 }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 1,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter float lte", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { float_lte: 0 }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter float in", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { float_in: [0, 2] }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter bigint eq", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { bigint: "0" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter bigint gt", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 1n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { bigint_gt: "0" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "1",
        },
      ],
    },
  });

  await cleanup();
});

test("filter bigint lte", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { bigint_lte: "0" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter bigint in", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { bigint_in: ["0", "2"] }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filer hex eq", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x0",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { hex: "0x00" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x00",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter hex gt", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string(),
      int: p.int(),
      float: p.float(),
      boolean: p.boolean(),
      hex: p.hex(),
      bigint: p.bigint(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: "0",
      int: 0,
      float: 0,
      boolean: false,
      hex: "0x1",
      bigint: 0n,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables (where: { hex_gt: "0x00" }) {
      items { 
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: "0",
          int: 0,
          float: 0,
          boolean: false,
          hex: "0x01",
          bigint: "0",
        },
      ],
    },
  });

  await cleanup();
});

test("filter string list eq", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string().list(),
      int: p.int().list(),
      float: p.float().list(),
      boolean: p.boolean().list(),
      hex: p.hex().list(),
      bigint: p.bigint().list(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: ["0"],
      int: [0],
      float: [0],
      boolean: [false],
      hex: ["0x0"],
      bigint: [0n],
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables(where: { string: ["0"] }) {
      items {
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: ["0"],
          int: [0],
          float: [0],
          boolean: [false],
          hex: ["0x0"],
          bigint: ["0"],
        },
      ],
    },
  });

  await cleanup();
});

test("filter string list has", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),
      string: p.string().list(),
      int: p.int().list(),
      float: p.float().list(),
      boolean: p.boolean().list(),
      hex: p.hex().list(),
      bigint: p.bigint().list(),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      string: ["0"],
      int: [0],
      float: [0],
      boolean: [false],
      hex: ["0x0"],
      bigint: [0n],
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables(where: { string_has: "0" }) {
      items {
        id
        string
        int
        float
        boolean
        hex
        bigint
      }
    }
  }
  `);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          string: ["0"],
          int: [0],
          float: [0],
          boolean: [false],
          hex: ["0x0"],
          bigint: ["0"],
        },
      ],
    },
  });

  await cleanup();
});

test("filter enum eq", async (context) => {
  const schema = createSchema((p) => ({
    enum: p.createEnum(["A", "B"]),
    table: p.createTable({
      id: p.string(),
      enum: p.enum("enum"),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      enum: "A",
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables(enum: "A") {
      items{
        id
        enum
      }
    }
  }
`);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          enum: "A",
        },
      ],
    },
  });

  await cleanup();
});

test("filter enum in", async (context) => {
  const schema = createSchema((p) => ({
    enum: p.createEnum(["A", "B"]),
    table: p.createTable({
      id: p.string(),
      enum: p.enum("enum"),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      enum: "A",
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables(enum_in: ["A"]) {
      items{
        id
        enum
      }
    }
  }
`);

  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          id: "0",
          enum: "A",
        },
      ],
    },
  });

  await cleanup();
});

test("filter ref eq", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),

      ref: p.string().references("table.id"),
      one: p.one("ref"),

      refNull: p.string().references("table.id").optional(),
      oneNull: p.one("refNull"),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      ref: "0",
      refNull: null,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables(where: { ref: "0" }) {
      items {
        one {
          id
        }
        oneNull
      }
    }
  }
  `);

  const getLoader = buildLoaderCache({ store: indexingStore });
  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore, getLoader },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          one: {
            id: "0",
          },
          oneNull: null,
        },
      ],
    },
  });

  await cleanup();
});

test("filter ref in", async (context) => {
  const schema = createSchema((p) => ({
    table: p.createTable({
      id: p.string(),

      ref: p.string().references("table.id"),
      one: p.one("ref"),

      refNull: p.string().references("table.id").optional(),
      oneNull: p.one("refNull"),
    }),
  }));

  const { indexingStore, cleanup } = await setupDatabaseServices(context, {
    schema,
    tableIds: getTableIds(schema),
  });

  await indexingStore.create({
    tableName: "table",
    checkpoint: zeroCheckpoint,
    id: "0",
    data: {
      ref: "0",
      refNull: null,
    },
  });

  const graphqlSchema = buildGraphqlSchema(schema);

  const document = parse(`
  query {
    tables(where: { ref_in: ["0", "2"] }) {
      items {
        one {
          id
        }

      }
    }
  }
  `);

  const getLoader = buildLoaderCache({ store: indexingStore });
  const result = await execute({
    schema: graphqlSchema,
    document,
    contextValue: { store: indexingStore, getLoader },
  });

  expect(result.data).toMatchObject({
    tables: {
      items: [
        {
          one: {
            id: "0",
          },
        },
      ],
    },
  });

  await cleanup();
});

test.todo("order int asc");

test.todo("order bigint asc");

test.todo("order bigint desc");

test.todo("limit default");

test.todo("limit");

test.todo("limit default");

test.todo("limit error");

test.todo("timestamp");
