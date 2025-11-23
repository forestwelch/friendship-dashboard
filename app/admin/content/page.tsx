import React from "react";
import { Navigation } from "@/components/Navigation";
import { ContentManager } from "@/components/admin/ContentManager";

export default async function ContentPage() {
  return (
    <>
      <Navigation />
      <ContentManager />
    </>
  );
}
