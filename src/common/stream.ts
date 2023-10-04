export function debounce(fn: () => void, delay: number) {
  let timer: any;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(), delay);
  };
}
