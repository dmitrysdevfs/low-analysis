"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { adminApi } from "@/lib/api/admin";
import type { AdminAuditEntry, AuditOverview } from "@/lib/api/admin";

const FALLBACK_OVERVIEW: AuditOverview = {
  total: 0,
  bySeverity: { info: 0, warning: 0, security: 0, critical: 0 },
  lastHourDelta: { total: 0, info: 0, warning: 0, security: 0, critical: 0 },
  streamPercent: { info: 0, warning: 0, security: 0, critical: 0 },
  securitySignals: { failedLogins: 0, roleChanges: 0, newIps: 0 },
  lastSyncAt: new Date().toISOString(),
  retentionDays: 180,
  integrityPercent: 100,
};

export function useAuditFeed() {
  const [events, setEvents] = useState<AdminAuditEntry[]>([]);
  const [overview, setOverview] = useState<AuditOverview>(FALLBACK_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState(new Date());

  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [actor, setActor] = useState("all");
  const [visibleCount, setVisibleCount] = useState(20);

  const fetchAll = useCallback(async () => {
    try {
      const [evts, ov] = await Promise.all([
        adminApi.getAuditLog(200, 0),
        adminApi.getAuditOverview().catch(() => null),
      ]);
      setEvents(evts);
      if (ov) {
        setOverview(ov);
      } else {
        // Derive overview from fetched events when backend endpoint not ready
        const s = evts.reduce(
          (acc, e) => {
            if (e.severity === "info") acc.info++;
            else if (e.severity === "warning") acc.warning++;
            else if (e.severity === "security") acc.security++;
            return acc;
          },
          { info: 0, warning: 0, security: 0 },
        );
        const t = evts.length;
        const pct = (n: number) => (t > 0 ? Math.round((n / t) * 100) : 0);
        setOverview({
          total: t,
          bySeverity: { ...s, critical: 0 },
          lastHourDelta: { total: 0, info: 0, warning: 0, security: 0, critical: 0 },
          streamPercent: {
            info: pct(s.info),
            warning: pct(s.warning),
            security: pct(s.security),
            critical: 0,
          },
          securitySignals: { failedLogins: 0, roleChanges: 0, newIps: 0 },
          lastSyncAt: new Date().toISOString(),
          retentionDays: 180,
          integrityPercent: 100,
        });
      }
      setLastSyncAt(new Date());
    } catch {
      // silent — show stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (severity !== "all" && e.severity !== severity) return false;
      if (actor !== "all" && e.actor !== actor) return false;
      if (query) {
        const q = query.toLowerCase();
        const hit =
          e.action.toLowerCase().includes(q) ||
          e.detail.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [events, severity, actor, query]);

  const visibleEvents = useMemo(
    () => filteredEvents.slice(0, visibleCount),
    [filteredEvents, visibleCount],
  );

  const uniqueActors = useMemo(
    () => [...new Set(events.map((e) => e.actor))].sort(),
    [events],
  );

  const showMore = useCallback(() => setVisibleCount((n) => n + 20), []);
  const hasMore = visibleCount < filteredEvents.length;

  return {
    events: visibleEvents,
    filteredCount: filteredEvents.length,
    totalCount: events.length,
    overview,
    loading,
    lastSyncAt,
    query,
    setQuery,
    severity,
    setSeverity,
    actor,
    setActor,
    uniqueActors,
    showMore,
    hasMore,
    refresh: fetchAll,
  };
}
