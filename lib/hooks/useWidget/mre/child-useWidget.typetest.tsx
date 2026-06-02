/**
 * MRE: static child connector from VIT `vitWidget` passed to `useWidget`.
 * See ./README.md — run `bun run test:mre`.
 */
import { vitWidget, type TVitApp } from "./vit.rserve";
import { useWidget } from "../index";

type VitLoadDataset = (url: string) => Promise<null>;

/** ensure parent widget still works as expected */
export function ParentWidget() {
  const { state, methods, children } = useWidget(vitWidget);
  console.log(state, methods, children);
  if (state?.dsInfo) {
    void (state.dsInfo satisfies { nrows: number; ncols: number });
  }
  if (methods) {
    void (methods.load_dataset satisfies VitLoadDataset);
  }
  return <>parent widget</>;
}

/** Same extraction as VIT `SamplingVariation` (`children.samplingVariation`). */
export type SamplingVariationCtor = Awaited<
  ReturnType<TVitApp["vitWidget"]>
>["children"]["samplingVariation"];

/** Child ctor from `TVitApp` is already `z.infer` output (JS function); `useWidget` infers state/methods/children. */
export function MreUseWidgetOnChildCtor(childCtor: SamplingVariationCtor) {
  const { state, methods, children } = useWidget(childCtor);
  console.log(state, methods, children);

  return <>widget</>;
}
