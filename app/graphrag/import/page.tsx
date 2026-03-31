import { TooltipProvider } from "@/components/ui/tooltip";

import { GraphRagImportView } from "./_components/graph-rag-import-view";

export default function GraphRagImportPage() {
  return (
    <TooltipProvider delay={200}>
      <GraphRagImportView />
    </TooltipProvider>
  );
}
