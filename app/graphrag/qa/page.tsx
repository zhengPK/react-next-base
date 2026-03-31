import { TooltipProvider } from "@/components/ui/tooltip";

import { GraphRagQaView } from "./_components/graph-rag-qa-view";

export default function GraphRagQaPage() {
  return (
    <TooltipProvider delay={200}>
      <div className="flex min-h-0 flex-1 flex-col">
        <GraphRagQaView />
      </div>
    </TooltipProvider>
  );
}
