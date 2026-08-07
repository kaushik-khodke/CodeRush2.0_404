import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, Eye, Loader2, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { timeAgo } from "@/lib/smoa/api";
import type { PendingCommand } from "@/lib/smoa/types";
import { SimulationPreviewModal } from "@/components/smoa/SimulationPreviewModal";
import { cn } from "@/lib/utils";

function ConstraintBlock({ command }: { command: PendingCommand }) {
  const pass = command.constraint.status === "pass";
  return (
    <div
      className={cn(
        "rounded-sm border px-2.5 py-2",
        pass ? "border-nominal/40 bg-nominal/8" : "border-critical/50 bg-critical/10",
      )}
    >
      <div className="flex items-center gap-1.5">
        {pass ? (
          <ShieldCheck className="size-3.5 text-nominal" />
        ) : (
          <ShieldAlert className="size-3.5 text-critical" />
        )}
        <span
          className={cn(
            "font-tech text-[0.65rem] font-semibold tracking-[0.09em] uppercase",
            pass ? "text-nominal" : "text-critical",
          )}
        >
          Constraint check {pass ? "pass" : "fail"}
        </span>
        <span className="label-tech ml-auto truncate">{command.constraint.solver}</span>
      </div>
      <p className="mt-1.5 text-[0.775rem] leading-snug text-foreground/85">{command.constraint.reasoning}</p>
      <ul className="mt-1.5 space-y-0.5">
        {command.constraint.checks.map((c) => (
          <li key={c.name} className="num flex items-start gap-1.5 text-[0.68rem] text-muted-foreground">
            <span className={c.ok ? "text-nominal" : "text-critical"}>{c.ok ? "✓" : "✕"}</span>
            <span className="text-foreground/70">{c.name}</span>
            <span className="ml-auto text-right">{c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommandCard({
  command,
  onDecide,
  onPreview,
  busyId,
}: {
  command: PendingCommand;
  onDecide: (id: string, decision: "approve" | "reject") => void;
  onPreview: (command: PendingCommand) => void;
  busyId: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const busy = busyId === command.id;
  const blocked = command.constraint.status === "fail";

  return (
    <article
      className={cn(
        "flex w-[26rem] shrink-0 flex-col gap-2 rounded-sm border-l-2 bg-surface p-3 transition-colors duration-150",
        command.irreversible ? "border-l-critical border-y border-r border-critical/30" : "border-l-primary border-y border-r border-border",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="num text-[0.7rem] text-muted-foreground">{command.id}</span>
            {command.irreversible && (
              <span className="rounded-sm border border-critical/60 bg-critical/15 px-1.5 py-px font-tech text-[0.6rem] font-semibold tracking-[0.09em] text-critical uppercase">
                Irreversible
              </span>
            )}
            <span className="label-tech">{command.subsystem}</span>
          </div>
          <div className="num mt-1 text-[0.85rem] font-semibold text-foreground">{command.command}</div>
        </div>
        <span className="num ml-auto shrink-0 text-[0.65rem] text-muted-foreground">{timeAgo(command.ts)}</span>
      </div>

      <p className="text-[0.78rem] leading-snug text-muted-foreground">{command.summary}</p>

      <ConstraintBlock command={command} />

      <button
        onClick={() => onPreview(command)}
        className="w-full flex items-center justify-center gap-1.5 rounded-sm border border-primary/40 bg-primary/10 py-1 font-tech text-[0.65rem] font-semibold text-primary uppercase hover:bg-primary/20 transition-colors cursor-pointer"
      >
        <Eye className="size-3" />
        Preview in Digital Twin Simulator
      </button>

      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-sm border border-critical bg-critical/12 px-2.5 py-2"
          >
            <div className="flex items-center gap-1.5">
              <CircleAlert className="size-3.5 text-critical" />
              <span className="font-tech text-[0.68rem] font-semibold tracking-[0.09em] text-critical uppercase">
                Are you sure?
              </span>
            </div>
            <p className="mt-1 text-[0.75rem] leading-snug text-foreground/85">
              {command.irreversible
                ? "This uplink cannot be recalled once transmitted. It will change spacecraft state."
                : "This command will be transmitted on the next contact."}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                disabled={busy}
                onClick={() => {
                  onDecide(command.id, "approve");
                  setConfirming(false);
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-critical px-3 py-1.5 font-tech text-[0.68rem] font-semibold tracking-[0.09em] text-critical-foreground uppercase transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                Confirm authorize
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-sm border border-border-strong px-3 py-1.5 font-tech text-[0.68rem] font-semibold tracking-[0.09em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-2"
          >
            <button
              disabled={busy || blocked}
              title={blocked ? "Blocked by OR-Tools constraint failure" : undefined}
              onClick={() => setConfirming(true)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 font-tech text-[0.68rem] font-semibold tracking-[0.09em] uppercase transition-colors duration-150",
                command.irreversible
                  ? "border border-critical/70 text-critical hover:bg-critical/12"
                  : "border border-primary/70 text-primary hover:bg-primary/12",
                (busy || blocked) && "cursor-not-allowed opacity-40",
              )}
            >
              <Check className="size-3" /> Approve
            </button>
            <button
              disabled={busy}
              onClick={() => onDecide(command.id, "reject")}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-border-strong px-3 py-1.5 font-tech text-[0.68rem] font-semibold tracking-[0.09em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />} Reject
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export function ApprovalQueue({
  commands,
  loading,
  error,
  busyId,
  onDecide,
}: {
  commands: PendingCommand[];
  loading: boolean;
  error: string | null;
  busyId: string | null;
  onDecide: (id: string, decision: "approve" | "reject") => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [previewCommand, setPreviewCommand] = useState<PendingCommand | null>(null);
  const pending = commands.filter((c) => c.state === "pending");

  return (
    <section className="panel shrink-0">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <h3 className="font-tech text-xs font-semibold tracking-[0.12em] uppercase">Human Approval Queue</h3>
          <span
            className={cn(
              "rounded-sm border px-1.5 py-px font-tech text-[0.6rem] font-semibold tracking-[0.08em] uppercase",
              pending.length > 0
                ? "border-warning/50 bg-warning/12 text-warning"
                : "border-border bg-background text-muted-foreground",
            )}
          >
            {pending.length} awaiting authorization
          </span>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="label-tech transition-colors duration-150 hover:text-foreground"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 overflow-x-auto scroll-thin p-2">
              {loading &&
                [0, 1, 2].map((i) => (
                  <div key={i} className="h-44 w-[26rem] shrink-0 animate-pulse rounded-sm border border-border bg-surface-raised/40" />
                ))}

              {!loading && error && <p className="p-3 text-[0.8rem] text-critical">{error}</p>}

              {!loading && !error && pending.length === 0 && (
                <div className="flex w-full items-center justify-center py-6">
                  <span className="label-tech">Queue clear — no commands awaiting operator authorization</span>
                </div>
              )}

              {!loading &&
                !error &&
                pending.map((c) => (
                  <CommandCard
                    key={c.id}
                    command={c}
                    onDecide={onDecide}
                    onPreview={setPreviewCommand}
                    busyId={busyId}
                  />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Digital Twin Command Simulation Preview Modal */}
      {previewCommand && (
        <SimulationPreviewModal
          commandItem={previewCommand}
          onClose={() => setPreviewCommand(null)}
          onAuthorize={onDecide}
        />
      )}
    </section>
  );
}

export default ApprovalQueue;
