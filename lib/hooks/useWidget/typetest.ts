// Type-level test: reproduce the inzight schema and verify useWidget accepts it.
// Run: npx tsc --noEmit -p tsconfig.lib.json
// This file must compile without errors.

import { Robj } from "rserve-ts";
import { z } from "zod";
import { useWidget } from "./index";

// ---- Reproduce the inzight widget hierarchy ----

// Level 1: Plot widget (leaf)
const iNZPlotWidget = Robj.ocap(
  [
    z.union([
      Robj.js_function(
        [z.object({ dim: z.union([z.instanceof(Int32Array), z.undefined()]) })],
        z.null(),
      ),
      z.undefined(),
    ]),
  ],
  Robj.list({
    properties: Robj.list({
      dim: Robj.list({
        register: Robj.ocap(
          [Robj.js_function([z.instanceof(Int32Array)], z.null()), z.string()],
          Robj.character(1),
        ),
        get: Robj.ocap([], Robj.integer(3)),
        set: Robj.ocap([z.instanceof(Int32Array)], Robj.null()),
      }),
    }),
    children: Robj.list(),
    methods: Robj.list({
      setDim: Robj.ocap([z.number(), z.number(), z.number()], Robj.null()),
    }),
  }),
);

// Level 2: Control widget (contains plot widget)
const iNZControlWidget = Robj.ocap(
  [
    z.union([
      Robj.js_function(
        [
          z.object({
            variables: z.union([
              z.union([z.string(), z.array(z.string())]),
              z.undefined(),
            ]),
            vars: z.union([
              z.object({
                v1: z.object({
                  selected: z.union([z.string(), z.null()]),
                  available: z.union([z.string(), z.array(z.string())]),
                }),
                v2: z.object({
                  selected: z.union([z.string(), z.null()]),
                  available: z.union([z.string(), z.array(z.string())]),
                }),
                v3: z.object({
                  selected: z.union([z.string(), z.null()]),
                  available: z.union([z.string(), z.array(z.string())]),
                }),
              }),
              z.undefined(),
            ]),
          }),
        ],
        z.null(),
      ),
      z.undefined(),
    ]),
  ],
  Robj.list({
    properties: Robj.list({
      variables: Robj.list({
        register: Robj.ocap(
          [
            Robj.js_function(
              [z.union([z.string(), z.array(z.string())])],
              z.null(),
            ),
            z.string(),
          ],
          Robj.character(1),
        ),
        get: Robj.ocap([], Robj.character()),
        set: Robj.ocap(
          [z.union([z.string(), z.array(z.string())])],
          Robj.null(),
        ),
      }),
      vars: Robj.list({
        register: Robj.ocap(
          [
            Robj.js_function(
              [
                z.object({
                  v1: z.object({
                    selected: z.union([z.string(), z.null()]),
                    available: z.union([z.string(), z.array(z.string())]),
                  }),
                  v2: z.object({
                    selected: z.union([z.string(), z.null()]),
                    available: z.union([z.string(), z.array(z.string())]),
                  }),
                  v3: z.object({
                    selected: z.union([z.string(), z.null()]),
                    available: z.union([z.string(), z.array(z.string())]),
                  }),
                }),
              ],
              z.null(),
            ),
            z.string(),
          ],
          Robj.character(1),
        ),
        get: Robj.ocap(
          [],
          Robj.list({
            v1: Robj.list({
              selected: z.union([Robj.character(1), Robj.null()]),
              available: Robj.character(),
            }),
            v2: Robj.list({
              selected: z.union([Robj.character(1), Robj.null()]),
              available: Robj.character(),
            }),
            v3: Robj.list({
              selected: z.union([Robj.character(1), Robj.null()]),
              available: Robj.character(),
            }),
          }),
        ),
        set: Robj.ocap(
          [
            z.object({
              v1: z.object({
                selected: z.union([z.string(), z.null()]),
                available: z.union([z.string(), z.array(z.string())]),
              }),
              v2: z.object({
                selected: z.union([z.string(), z.null()]),
                available: z.union([z.string(), z.array(z.string())]),
              }),
              v3: z.object({
                selected: z.union([z.string(), z.null()]),
                available: z.union([z.string(), z.array(z.string())]),
              }),
            }),
          ],
          Robj.null(),
        ),
      }),
    }),
    children: Robj.list({
      plotWidget: iNZPlotWidget,
    }),
    methods: Robj.list({
      setVariable: Robj.ocap([z.string(), z.string()], Robj.null()),
    }),
  }),
);

// Level 3: Full document (contains control widget)
export const iNZDocument = Robj.ocap(
  [
    z.union([
      Robj.js_function(
        [
          z.object({
            name: z.union([z.string(), z.undefined()]),
            code: z.union([
              z.union([z.string(), z.array(z.string())]),
              z.undefined(),
            ]),
          }),
        ],
        z.null(),
      ),
      z.undefined(),
    ]),
  ],
  Robj.list({
    properties: Robj.list({
      name: Robj.list({
        register: Robj.ocap(
          [Robj.js_function([z.string()], z.null()), z.string()],
          Robj.character(1),
        ),
        get: Robj.ocap([], Robj.character(1)),
        set: Robj.ocap([z.string()], Robj.null()),
      }),
      code: Robj.list({
        register: Robj.ocap(
          [
            Robj.js_function(
              [z.union([z.string(), z.array(z.string())])],
              z.null(),
            ),
            z.string(),
          ],
          Robj.character(1),
        ),
        get: Robj.ocap([], Robj.character()),
        set: Robj.ocap(
          [z.union([z.string(), z.array(z.string())])],
          Robj.null(),
        ),
      }),
    }),
    children: Robj.list({
      ctrlWidget: iNZControlWidget,
    }),
    methods: Robj.list({
      loadData: Robj.ocap([z.string()], Robj.null()),
      setName: Robj.ocap([z.string()], Robj.character(1)),
    }),
  }),
);

// ---- Inferred types (what the real app uses) ----
type TINZDocument = z.infer<typeof iNZDocument>;
type TINZControlWidget = z.infer<typeof iNZControlWidget>;
type TINZPlotWidget = z.infer<typeof iNZPlotWidget>;

// ---- Test: useWidget must accept these types without errors ----

// Simulate what Document.tsx does
export function TestDocument({ widget }: { widget: TINZDocument }) {
  const { state } = useWidget(widget);
  if (state) {
    void (state.name satisfies string);
    void (state.code satisfies string | string[]);
  }
}

// Simulate what ControlPanel.tsx does
export function TestControlPanel({ widget }: { widget: TINZControlWidget }) {
  const { state } = useWidget(widget);
  if (state) {
    void state.vars;
  }
}

// Simulate what PlotWidget does
export function TestPlotWidget({ widget }: { widget: TINZPlotWidget }) {
  const { state } = useWidget(widget);
  if (state) {
    void (state.dim satisfies Int32Array);
  }
}
