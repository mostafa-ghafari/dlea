import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface PageMeta {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

interface PageContextValue {
  meta: PageMeta;
  setMeta: (meta: PageMeta) => void;
}

const PageContext = createContext<PageContextValue>({
  meta: { title: "" },
  setMeta: () => {},
});

export function PageProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<PageMeta>({ title: "" });
  const setMeta = useCallback((m: PageMeta) => setMetaState(m), []);
  return (
    <PageContext.Provider value={{ meta, setMeta }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageMeta() {
  return useContext(PageContext);
}

export function useSetTitle(title: string, subtitle?: string, actions?: ReactNode) {
  const { setMeta } = usePageMeta();
  setMeta({ title, subtitle, actions });
}
