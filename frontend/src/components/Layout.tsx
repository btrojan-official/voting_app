import React from "react";
import "./Layout.css";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps): React.ReactElement {
  return (
    <div className="layout">
      <main className="main-content">{children}</main>
    </div>
  );
}
