import { Robj } from "rserve-ts";
import { z } from "zod";

const fn_first = Robj.ocap(
  [z.union([z.string(), z.array(z.string())])],
  Robj.character(1)
);
const fn_mean = Robj.ocap(
  [z.union([z.number(), z.instanceof(Float64Array)])],
  Robj.numeric(1)
);
const iterate = Robj.ocap(
  [Robj.js_function([z.number()], z.number())],
  Robj.null()
);
const sample_num = Robj.ocap(
  [z.instanceof(Float64Array), z.number()],
  Robj.numeric()
);

export default {
  fn_first,
  fn_mean,
  iterate,
  sample_num,
};
