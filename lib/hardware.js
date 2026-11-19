// What this computer has, for choosing a local AI model (the user, 17 Nov 2026: docs/requests/2026-11-17-local-ai.md,
// section 3). Read with the operating system's own tools where they are there; anything that cannot be read is said to
// be unknown, never guessed (the user: "Do not claim to detect exact VRAM or GPU specifications if the environment does
// not expose them"). Nothing here is sent anywhere.
"use strict";
const os = require("os"), fs = require("fs"), { execFile } = require("child_process");

const run = (cmd, args, ms) => new Promise(res => { try { execFile(cmd, args, { timeout: ms || 4000, windowsHide: true, maxBuffer: 4 << 20 }, (e, out) => res(e ? null : String(out || ""))); } catch (e) { res(null); } });
const GB = b => Math.round(b / 1073741824 * 10) / 10;

async function gpus() {
  const out = [];
  // NVIDIA: its own tool gives the name, the memory and the driver
  const nv = await run("nvidia-smi", ["--query-gpu=name,memory.total,driver_version", "--format=csv,noheader,nounits"]);
  if (nv) for (const line of nv.trim().split("\n")) { const [name, mem, drv] = line.split(",").map(s => s.trim()); if (name) out.push({ name, vramGB: mem ? Math.round(+mem / 1024 * 10) / 10 : null, vendor: "nvidia", accel: "CUDA", driver: drv || null, sure: true }); }
  // AMD on Linux with ROCm
  if (!out.length && process.platform === "linux") {
    const ro = await run("rocm-smi", ["--showproductname", "--showmeminfo", "vram", "--json"]);
    if (ro) { try { const j = JSON.parse(ro); for (const [k, v] of Object.entries(j)) if (/card/i.test(k)) out.push({ name: v["Card series"] || v["Card SKU"] || "AMD GPU", vramGB: v["VRAM Total Memory (B)"] ? GB(+v["VRAM Total Memory (B)"]) : null, vendor: "amd", accel: "ROCm", sure: true }); } catch (e) {} }
  }
  // macOS: the graphics, and on Apple silicon the memory it shares with the CPU (Metal)
  if (process.platform === "darwin") {
    const sp = await run("system_profiler", ["SPDisplaysDataType", "-json"], 8000);
    if (sp) { try { for (const d of JSON.parse(sp).SPDisplaysDataType || []) { const name = d.sppci_model || d._name || "GPU", apple = /apple/i.test(name) || /apple/i.test(d.spdisplays_vendor || ""); const v = d.spdisplays_vram || d["spdisplays_vram_shared"] || ""; out.push({ name, vramGB: apple ? null : (/(\d+)\s*GB/i.test(v) ? +RegExp.$1 : null), unified: apple, vendor: apple ? "apple" : /amd|radeon/i.test(name) ? "amd" : /intel/i.test(name) ? "intel" : "other", accel: "Metal", sure: true }); } } catch (e) {} }
  }
  // Windows: the names for certain; its reported memory is capped at 4 GB by the system, so it is only a floor
  if (process.platform === "win32" && !out.length) {
    const ps = await run("powershell", ["-NoProfile", "-Command", "Get-CimInstance Win32_VideoController | Select-Object Name,AdapterRAM | ConvertTo-Json"], 8000);
    if (ps) { try { let j = JSON.parse(ps); if (!Array.isArray(j)) j = [j]; for (const d of j) if (d && d.Name) out.push({ name: d.Name, vramGB: null, vramFloorGB: d.AdapterRAM ? GB(d.AdapterRAM) : null, vendor: /nvidia/i.test(d.Name) ? "nvidia" : /amd|radeon/i.test(d.Name) ? "amd" : /intel/i.test(d.Name) ? "intel" : "other", accel: /nvidia/i.test(d.Name) ? "CUDA (no nvidia-smi found)" : "Vulkan or DirectML", sure: false }); } catch (e) {} }
  }
  // Linux without either tool: the names from the PCI list, the memory unknown
  if (process.platform === "linux" && !out.length) {
    const lp = await run("lspci", []); if (lp) for (const l of lp.split("\n")) if (/VGA|3D controller|Display/i.test(l)) { const name = l.replace(/^.*?:\s*/, "").replace(/^.*?:\s*/, ""); out.push({ name, vramGB: null, vendor: /nvidia/i.test(l) ? "nvidia" : /amd|ati/i.test(l) ? "amd" : /intel/i.test(l) ? "intel" : "other", accel: "Vulkan (memory unknown)", sure: false }); }
  }
  return out;
}

async function freeDiskGB(dir) {
  try { if (fs.statfs) { const s = await fs.promises.statfs(dir); return GB(s.bavail * s.bsize); } } catch (e) {}
  return null;
}

async function detect(dir) {
  const c = os.cpus() || [], g = await gpus();
  return {
    os: { platform: process.platform, release: os.release(), arch: process.arch },
    cpu: { model: c[0] ? c[0].model.trim() : null, threads: c.length || null, arm: /arm/.test(process.arch) },
    ramGB: GB(os.totalmem()), freeRamGB: GB(os.freemem()),
    gpus: g, diskGB: await freeDiskGB(dir || os.homedir()),
    appleSilicon: process.platform === "darwin" && process.arch === "arm64"
  };
}

module.exports = { detect };
