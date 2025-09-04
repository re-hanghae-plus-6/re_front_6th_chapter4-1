import type { StringRecord } from "@hanghae-plus/lib";
import type { FC } from "react";
import type { ServerOptions } from "react-dom/server";

interface ServerParams {
  query: StringRecord;
  params: StringRecord;
}

export interface PageWithServer<P = Record<string, unknown>> extends FC<P> {
  ssr?: (params: ServerParams) => Promise<unknown>;
  metadata?: (params: ServerParams) => Promise<{ title: string }>;
}

export const withServerSideProps = <P extends Record<string, unknown>>(
  serverOptions: ServerOptions,
  Component: FC<P>,
) => {
  const Page: PageWithServer<P> = (props: P) => <Component {...props} />;

  Object.assign(Page, serverOptions);

  return Page;
};
