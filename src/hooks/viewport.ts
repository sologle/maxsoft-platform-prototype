// Coordinates share the layout viewport origin used by getBoundingClientRect().
export const visibleViewport = () => {
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const left = viewport?.offsetLeft ?? 0;
  const width = viewport?.width ?? window.innerWidth;
  const height = viewport?.height ?? window.innerHeight;
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
};
