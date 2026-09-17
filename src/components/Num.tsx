/**
 * Wraps content in `dir="ltr"` so that currency signs (+, -, $) stay on the
 * correct side in an otherwise RTL layout.  Usage:
 *
 *   <Num>+$4,602</Num>
 *   <Num className="gain">+12.5%</Num>
 */
export function Num({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span dir="ltr" className={className}>
      {children}
    </span>
  );
}
