import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "inovatea_device_id";

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export async function ensureChildProfile(): Promise<string> {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (!data) {
    await supabase.from("child_profiles").insert({ device_id: deviceId, name: "Amiguinho" });
  }
  return deviceId;
}
