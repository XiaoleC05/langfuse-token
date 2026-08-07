import * as z from "zod";
import { StringNoHTML } from "@langfuse/shared";

export const projectNameSchema = z.object({
  name: StringNoHTML.min(3, "至少需要 3 个字符").max(60, "最多 60 个字符"),
});
