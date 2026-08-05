import { cn } from "@/src/utils/tailwind";
import Link from "next/link";
import { VersionLabel } from "./VersionLabel";
import { env } from "@/src/env.mjs";
import { useUiCustomization } from "@/src/ee/features/ui-customization/useUiCustomization";
import { PlusIcon } from "lucide-react";
import { LangfuseIcon } from "@/src/components/design-system/LangfuseIcon/LangfuseIcon";

const LangfuseLogotypeOrCustomized = () => {
  const uiCustomization = useUiCustomization();

  if (uiCustomization?.logoLightModeHref && uiCustomization?.logoDarkModeHref) {
    // logo is a url, maximum aspect ratio of 1:3 needs to be supported according to docs
    return (
      <div className="flex items-center gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={uiCustomization.logoLightModeHref}
          alt="Langfuse 标志"
          className={cn(
            "group-data-[collapsible=icon]:hidden dark:hidden",
            "max-h-4 max-w-14",
          )}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={uiCustomization.logoDarkModeHref}
          alt="Langfuse 标志"
          className={cn(
            "hidden group-data-[collapsible=icon]:hidden dark:block",
            "max-h-4 max-w-14",
          )}
        />
        <PlusIcon size={8} className="group-data-[collapsible=icon]:hidden" />
        <LangfuseIcon size={16} />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {/* Oxelia51 品牌 logo：暖橙红固定版（不随主题切换） */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="max-h-6 max-w-40 group-data-[collapsible=icon]:hidden"
        src={`${env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon-64.png`}
        alt="Oxelia51 标志"
      />
      <div className="hidden group-data-[collapsible=icon]:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="h-7 w-7"
          src={`${env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon-glyph-64.png`}
          alt="Oxelia51"
        />
      </div>
    </div>
  );
};

export const LangfuseLogo = ({ version = false }: { version?: boolean }) => {
  return (
    // Oxelia51：折叠态归零外边距，避免图标被挤压偏移/变形
    <div className="-mt-2 ml-1 flex flex-wrap gap-4 group-data-[collapsible=icon]:m-0 group-data-[collapsible=icon]:justify-center lg:flex-col lg:items-start">
      {/* Langfuse Logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <LangfuseLogotypeOrCustomized />
        </Link>
        {version && (
          <VersionLabel className="ml-2 group-data-[collapsible=icon]:hidden" />
        )}
      </div>
    </div>
  );
};
