# ADR-004: Human-in-the-Loop Command Safety & Warden Gate Architecture

## Context
Fully autonomous command execution on spacecraft risks catastrophic mission loss if an unverified AI recommendation is issued during an orbit pass.

## Decision
We established a strict Human-in-the-Loop safety policy:
1. No AI agent can directly execute a flight command.
2. Every procedure proposal must pass through the Trust Engine (requiring a score $> 70/100$) and SafetyAgent cryptographic validation (SHA-256 signature).
3. Approved proposals are pushed to the Warden Safety Gate queue (`/api/commands/pending`), requiring explicit human Flight Director authorization (`approve` / `reject`).

## Consequences
- Guaranteed operational safety and regulatory compliance.
- Complete cryptographic audit trail (`audit_log`) for all approved and rejected operations.
