import { useRserve, useWidget, type AppType } from "../../lib/main";
import appSchema from "../rserve/widgets.rserve";

import React from "react";
import "./widget.css";

type Widgets = AppType<typeof appSchema>;

function dfToArray<T extends Record<string, unknown[]>>(
  df: T
): Array<{ [K in keyof T]: T[K][number] }> {
  const keys = Object.keys(df) as Array<keyof T>;

  if (keys.length === 0) {
    return [];
  }

  // Get the length from the first column
  const length = df[keys[0]].length;

  // Create array of row objects
  const result: Array<{ [K in keyof T]: T[K][number] }> = [];

  for (let i = 0; i < length; i++) {
    const row = {} as { [K in keyof T]: T[K][number] };
    for (const key of keys) {
      row[key] = df[key][i];
    }
    result.push(row);
  }

  return result;
}

const HOST = import.meta.env.VITE_RSERVE_HOST2 ?? "http://localhost:6312";

function Widgets() {
  const { app, loading } = useRserve(appSchema, {
    host: HOST,
  });
  if (loading) return <>Loading ...!</>;
  if (!app) return <>Did not work ...</>;

  return (
    <div className="widgets-container">
      {/* <RNGWidget rng={app.rngWidget} /> */}
      <PlotWidget plot={app.ctrlWidget} />
    </div>
  );
}

export function RNGWidget({ rng }: { rng: Widgets["rngWidget"] }) {
  const { state, set } = useWidget(rng);
  const [localValue, setLocalValue] = React.useState(state?.value ?? 0);

  // TODO: goal
  // const { state, methods, status } = useWidget(rng);

  React.useEffect(() => {
    if (!state) return;
    setLocalValue(state.value);
  }, [state]);

  if (!state) return <>Loading ...</>;

  return (
    <div className="widget-card">
      <h2>RNG Widget - {state.value}</h2>
      <div className="flex-center gap-4">
        Number of values:
        <input
          type="number"
          min={1}
          max={10000}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.valueAsNumber);
            set("value", e.target.valueAsNumber, 300);
          }}
          className="widget-input"
        />
      </div>
    </div>
  );
}

function PlotWidget({ plot }: { plot: Widgets["ctrlWidget"] }) {
  const { state, children, methods } = useWidget(plot);

  if (!state) return <>Loading ...</>;

  return (
    <div className="plot-widget-container">
      <div className="widget-card-content">
        <div className="flex-between">
          <h2>Plot Widget</h2>
          <button
            className="widget-button"
            onClick={() => methods?.reset()}
          >
            Reset Selection
          </button>
        </div>

        {children && <HistogramWidget hist={children.histogram} />}
        {children && <BarChartWidget barchart={children.barchart} />}
      </div>
    </div>
  );
}

export function HistogramWidget({ hist }: { hist: Widgets["histogramWidget"] }) {
  const { state, set } = useWidget(hist);
  const [localVar, setLocalVar] = React.useState(state?.var ?? "");

  if (!state) return <>Loading ...</>;

  const bins = state.counts ? Array.from(state.counts) : [];
  const max = Math.max(...bins);

  return (
    <div className="widget-card">
      <div className="widget-card-content">
        <h2>Histogram Widget</h2>
        <div className="flex-center gap-2">
          {state.vars?.map((v) => (
            <div
              key={v}
              className={`widget-button ${
                state.var === v && "widget-button-active"
              } ${state.var !== localVar && "widget-button-wait"}
              `}
              onClick={() => {
                set("var", v);
                setLocalVar(v);
              }}
            >
              {v}
            </div>
          ))}

          <div className="flex-1"></div>
          <label>Bins:</label>
          <input
            type="number"
            value={state.nBin}
            onChange={(n) => set("nBin", n.target.valueAsNumber)}
            className="widget-input-small"
          />
        </div>

        <div className="histogram-bars-container">
          {bins?.map((n, i) => (
            <div
              key={i}
              className="histogram-bar"
              style={{
                height: (100 * n) / max + "%",
              }}
              onClick={() => set("selectedBar", i)}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BarChartWidget({
  barchart,
}: {
  barchart: Widgets["barchartWidget"];
}) {
  const { state } = useWidget(barchart);

  if (!state) return <>Loading ...</>;
  if (!state.data?.label) return <>No data</>;

  const data = dfToArray({
    label: state.data.label,
    count: Array.from(state.data.count),
  });
  const maxCount = Math.max(...data.map((v) => v.count));

  return (
    <div className="widget-card">
      <div className="widget-card-content">
        <h2>Barchart Widget</h2>
        <div className="barchart-container">
          {data?.map(({ label, count }) => (
            <div
              key={label}
              className="barchart-bar"
              style={{
                height: (100 * count) / maxCount + "%",
              }}
            >
              <label className="barchart-label">
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Widgets;
