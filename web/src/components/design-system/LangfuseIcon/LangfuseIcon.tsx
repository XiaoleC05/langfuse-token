import { env } from "@/src/env.mjs";

type LangfuseIconProps = {
  size?: 14 | 16 | 28 | 32 | 42;
};

export const LangfuseIcon = ({ size = 32 }: LangfuseIconProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={`${env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon-glyph-64.png`}
    width={size}
    height={size}
    alt="Oxelia51"
  />
);
