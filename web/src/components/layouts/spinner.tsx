/**
 * Oxelia51 品牌加载动画「伴星」：心跳星点绕月环旋转，永不闭合距离。
 * 内联 SVG（SMIL 动画），零网络请求，加载界面永不缺失。
 * 月环颜色继承 text-primary，双主题自适应；星点固定品牌红 #E5484D。
 */
function OrbitLoader({ size = 42 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="228"
        cy="228"
        r="140"
        stroke="currentColor"
        strokeWidth="52"
      />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 228 228"
          to="360 228 228"
          dur="2.6s"
          repeatCount="indefinite"
        />
        <circle cx="488" cy="228" r="34" fill="#E5484D" />
      </g>
    </svg>
  );
}

export function Spinner(props: { message: string }) {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-primary mx-auto w-fit">
          <OrbitLoader size={42} />
        </div>
        <h2 className="text-primary mt-5 text-center text-2xl leading-9 font-bold tracking-tight">
          {props.message}
          <span className="animate-pulse">…</span>
        </h2>
      </div>
    </div>
  );
}
