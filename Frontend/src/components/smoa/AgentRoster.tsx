import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/smoa/types";

const statusMeta = {
  active: { label: "ACTIVE", color: "text-primary border-primary/20 bg-primary/8" },
  standby: { label: "STANDBY", color: "text-muted-foreground border-border bg-background/50" },
  watching: { label: "GATING", color: "text-warning border-warning/20 bg-warning/8" },
};

export function AgentRoster({
  agents,
  selectedAgentId,
  onSelect,
}: {
  agents: Agent[];
  selectedAgentId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">Control Room</h3>
          <span className="rounded-sm border border-border bg-background px-1.5 py-px font-tech text-[0.6rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            9 Pipeline Nodes
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-1">
        {agents.map((agent, index) => {
          const meta = statusMeta[agent.status] || statusMeta.standby;
          const isSelected = agent.id === selectedAgentId;

          return (
            <div key={agent.id} className="flex flex-col">
              {index > 0 && (
                <div className="flex flex-col items-center my-1.5 opacity-60">
                  <div className="w-px h-3 bg-border" />
                  <div className="font-mono text-[7px] text-muted-foreground mt-[-2px]">▼</div>
                </div>
              )}

              <button
                onClick={() => onSelect(agent.id)}
                className={cn(
                  "panel text-left p-3 hover:border-primary/40 focus:outline-none transition-all duration-200 cursor-pointer relative",
                  isSelected
                    ? "border-primary/80 bg-primary/5 shadow-[0_0_15px_rgba(31,111,120,0.12)] border-l-4 border-l-primary"
                    : "bg-surface-raised/30 border-border/40 hover:bg-surface-raised/50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[0.62rem] font-semibold bg-background border border-border px-1 py-px rounded-xs text-muted-foreground shrink-0">
                      {String(agent.pipelineOrder).padStart(2, "0")}
                    </span>
                    <span className="font-tech text-[0.78rem] font-bold tracking-[0.02em] text-foreground truncate">
                      {agent.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-[1px] font-tech text-[0.58rem] font-bold tracking-[0.06em] uppercase shrink-0",
                      meta.color,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>

                <div className="font-tech text-[0.68rem] text-muted-foreground font-semibold mt-1">
                  {agent.role}
                </div>

                <div className="h-1 bg-border rounded-full overflow-hidden mt-2 relative">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-[#8e44ad] transition-all duration-500"
                    style={{ width: `${agent.confidence * 100}%` }}
                  />
                </div>

                <p className="text-[0.68rem] text-muted-foreground/80 leading-snug mt-2 line-clamp-2">
                  {agent.lastAction}
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentRoster;
