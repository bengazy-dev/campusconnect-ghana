/**
 * InsForge client + data helpers (source for browser bundle).
 * After editing: npm run build:config
 * Browser loads js/config.js → vendor/insforge-config.bundle.js
 */
import { createClient } from "@insforge/sdk";

const DEFAULTS = {
  baseUrl: "https://YOUR_APPKEY.us-east.insforge.app",
  anonKey: "YOUR_INSFORGE_ANON_KEY",
};

function resolveOptions() {
  const w = typeof window !== "undefined" ? window : {};
  const o = w.INSFORGE_CONFIG || {};
  return {
    baseUrl: (o.baseUrl || DEFAULTS.baseUrl).replace(/\/$/, ""),
    anonKey: o.anonKey || DEFAULTS.anonKey,
  };
}

const opts = resolveOptions();
export const insforge = createClient(opts);

export const auth = insforge.auth;

export const db = insforge.database;

export async function getUserProfile(userId) {
  let uid = userId;
  if (!uid) {
    const { data: session, error: e1 } = await insforge.auth.getCurrentUser();
    if (e1 || !session?.user?.id) {
      return { data: null, error: e1 || new Error("Not signed in") };
    }
    uid = session.user.id;
  }
  const { data, error } = await insforge.database
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();
  return { data, error };
}

export async function getAllEvents() {
  const { data, error } = await insforge.database
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function getEventById(eventId) {
  const { data, error } = await insforge.database
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  return { data, error };
}

export async function toggleSaveEvent(eventId) {
  const { data: session, error: e1 } = await insforge.auth.getCurrentUser();
  if (e1 || !session?.user?.id) {
    return { data: null, error: e1 || new Error("Not signed in") };
  }
  const uid = session.user.id;
  const { data: existing } = await insforge.database
    .from("saved_events")
    .select("event_id")
    .eq("user_id", uid)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    const { error } = await insforge.database
      .from("saved_events")
      .delete()
      .eq("user_id", uid)
      .eq("event_id", eventId);
    return { data: { saved: false }, error };
  }

  const { error } = await insforge.database
    .from("saved_events")
    .insert([{ user_id: uid, event_id: eventId }]);
  return { data: { saved: true }, error };
}

export async function isEventSaved(eventId, userId) {
  let uid = userId;
  if (!uid) {
    const { data: session } = await insforge.auth.getCurrentUser();
    if (!session?.user?.id) return { data: false, error: null };
    uid = session.user.id;
  }
  const { data } = await insforge.database
    .from("saved_events")
    .select("event_id")
    .eq("user_id", uid)
    .eq("event_id", eventId)
    .maybeSingle();
  return { data: !!data, error: null };
}
