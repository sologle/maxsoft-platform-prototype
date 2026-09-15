import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
// A layout box tracks the rotated bounds; the transform alone does not reserve space.
export const DocumentPreview = ({
  children,
  zoom,
  rotation,
}: {
  children: ReactNode;
  zoom: number;
  rotation: number;
}) => {
  const measure = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(760);
  const [size, setSize] = useState({ width: 760, height: 1075 });
  useLayoutEffect(() => {
    const element = measure.current!;
    const observer = new ResizeObserver(() =>
      setSize({ width: element.offsetWidth, height: element.offsetHeight }),
    );
    observer.observe(element);
    const widthObserver = new ResizeObserver(() => setPageWidth(holder.current!.clientWidth));
    widthObserver.observe(holder.current!);
    return () => {
      observer.disconnect();
      widthObserver.disconnect();
    };
  }, []);
  const scale = zoom / 100;
  const sideways = rotation % 180 !== 0;
  const width = (sideways ? size.height : size.width) * scale;
  const height = (sideways ? size.width : size.height) * scale;
  return (
    <div ref={holder} className="mx-auto" style={{ width: "100%", maxWidth: 760 }}>
      <div style={{ position: "relative", width, height }} data-testid="file-preview-bounds">
        <div
          ref={measure}
          className="rounded-sm p-8 text-[#273445] shadow-[0_14px_45px_rgba(30,44,58,.22)] sm:p-12"
          data-testid="file-preview-document"
          style={{
            position: "absolute",
            backgroundColor: "#fff",
            color: "#273445",
            width: pageWidth,
            minHeight: pageWidth * Math.SQRT2,
            left: width / 2,
            top: height / 2,
            transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
