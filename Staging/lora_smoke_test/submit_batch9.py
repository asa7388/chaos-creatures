#!/usr/bin/env python3
"""Submit 9 creature predictions to Replicate SDXL LoRA, poll, and download."""

import json
import os
import time
import urllib.request
import urllib.error

# --- Config ---
# Read token from .env file directly with Python
TOKEN = ""
with open("/Users/alexali/Projects/chaos-creatures/.env") as f:
    for line in f:
        if line.startswith("REPLICATE_API_TOKEN"):
            TOKEN = line.split("=", 1)[1].strip().strip('"').strip("'")
            break

if not TOKEN:
    raise ValueError("Could not find REPLICATE_API_TOKEN in .env")

print(f"Token loaded: {TOKEN[:8]}... (length {len(TOKEN)})")

VERSION = "6357bf718043fed5140dc5cdcad9e152a20bb0fdce66b5c96cb5c3e5c6691f2f"
BASE_DIR = "/Users/alexali/Projects/chaos-creatures/Staging/lora_smoke_test"
API_URL = "https://api.replicate.com/v1/predictions"

SHARED_PARAMS = {
    "width": 1024,
    "height": 1432,
    "apply_watermark": False,
    "disable_safety_checker": True,
    "lora_scale": 0.6,
}

ENDLESS_NEG = "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"
DEMONIC_NEG = "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials"
FEY_NEG = "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"

PREDICTIONS = [
    {
        "name": "Endless - Void Titan",
        "filename": "endless_sdxl_v2a.png",
        "prompt": "impasto oil painting, a colossal humanoid figure made of swirling dark matter and cosmic dust striding across a barren wasteland of cracked obsidian, its body a window into deep space showing galaxies and nebulae within, eyeless face with a gaping maw of pure darkness, long trailing tendrils of shadow dissolving into mist behind it, thick paint texture, paint ridges visible, painted directly onto ancient bone-dark parchment, dark pigments soaking into the fibrous surface, parchment grain visible through thin washes, oil paint on parchment",
        "negative_prompt": ENDLESS_NEG,
    },
    {
        "name": "Endless - Time Devourer",
        "filename": "endless_sdxl_v2b.png",
        "prompt": "impasto oil painting, an enormous insectoid creature with a carapace of fossilized stone and amber, dozens of spindly legs each ending in clock-like gears, a massive circular mouth lined with concentric rings of teeth spinning in opposite directions, perched atop a crumbling tower of stacked hourglasses in a desert of grey sand, thick paint texture, paint ridges visible, painted directly onto ancient bone-dark parchment, dark pigments soaking into the fibrous surface, oil paint on parchment",
        "negative_prompt": ENDLESS_NEG,
    },
    {
        "name": "Endless - Memory Worm",
        "filename": "endless_sdxl_v2c.png",
        "prompt": "impasto oil painting, a vast serpentine worm tunneling through layers of exposed geological strata, its translucent body filled with flickering ghostly images of forgotten civilizations, each segment of its body a different era of decay, emerging from a cliff face above a dead grey ocean, thick paint texture, paint ridges visible, painted directly onto ancient bone-dark parchment, dark pigments soaking into the fibrous surface, oil paint on parchment",
        "negative_prompt": ENDLESS_NEG,
    },
    {
        "name": "Demonic - Pit Fiend",
        "filename": "demonic_sdxl_v2a.png",
        "prompt": "impasto oil painting, a massive horned demon lord sitting on a throne of fused bones and molten iron deep within a volcanic cavern, rivers of lava flowing around the base, leathery bat-like wings folded behind, skin cracked and glowing with inner fire, holding a jagged obsidian scepter, skulls mounted on the walls behind, thick paint texture, paint ridges visible, infernal hellish atmosphere, painted directly onto cured dark leather hide, paint cracking along the leather grain, deep brown ground tone showing through, oil paint on leather",
        "negative_prompt": DEMONIC_NEG,
    },
    {
        "name": "Demonic - Plague Bearer",
        "filename": "demonic_sdxl_v2b.png",
        "prompt": "impasto oil painting, a bloated shambling horror dragging itself through a swamp of black ichor, body covered in weeping sores and fungal growths, one arm grotesquely oversized ending in a massive claw, a cloud of green miasma and flies surrounding its head, dead twisted trees in the background, thick paint texture, paint ridges visible, nauseating oppressive atmosphere, painted directly onto cured dark leather hide, paint cracking along the leather grain, oil paint on leather",
        "negative_prompt": DEMONIC_NEG,
    },
    {
        "name": "Demonic - Shadow Stalker",
        "filename": "demonic_sdxl_v2c.png",
        "prompt": "impasto oil painting, a lithe predatory demon crouching on a gothic rooftop at night, elongated limbs with razor-sharp claws, eyeless head with a wide mouth of needle teeth, body wrapped in living shadows that drip like liquid darkness, a blood-red moon behind it casting long distorted shadows across cobblestone streets below, thick paint texture, paint ridges visible, menacing nocturnal atmosphere, painted directly onto cured dark leather hide, paint cracking along the leather grain, oil paint on leather",
        "negative_prompt": DEMONIC_NEG,
    },
    {
        "name": "Fey - Ancient Treant",
        "filename": "fey_sdxl_v2a.png",
        "prompt": "impasto oil painting, an ancient treant awakening in a moonlit enchanted forest, massive twisted trunk forming a hunched humanoid shape, face formed from gnarled bark with glowing amber eyes deep in the wood, branches for arms covered in luminous moss and tiny flowers, roots pulling free from the earth sending up showers of dirt, fireflies swirling around its crown, thick paint texture, paint ridges visible, magical twilight atmosphere, painted directly onto pale birch bark, paint pooling in the natural grooves of the bark, warm white ground showing through, oil paint on birch bark",
        "negative_prompt": FEY_NEG,
    },
    {
        "name": "Fey - Selkie Queen",
        "filename": "fey_sdxl_v2b.png",
        "prompt": "impasto oil painting, a selkie queen rising from dark ocean waves under a full moon, lower body a powerful seal form with iridescent scales, upper body shifting into an elegant figure draped in seaweed and pearls, wild flowing hair merging with the foam of crashing waves, bioluminescent jellyfish drifting around her, rocky sea stacks in the background, thick paint texture, paint ridges visible, mysterious oceanic atmosphere, painted directly onto pale birch bark, paint pooling in the natural grooves of the bark, oil paint on birch bark",
        "negative_prompt": FEY_NEG,
    },
    {
        "name": "Fey - Will-o-Wisp Swarm Lord",
        "filename": "fey_sdxl_v2c.png",
        "prompt": "impasto oil painting, a tall spectral figure made of woven marsh grass and fox bones standing in a foggy bog at night, hundreds of tiny will-o-wisp lights orbiting its body in spiraling patterns, antlers made of twisted driftwood adorned with hanging lanterns of trapped fairy light, standing in shallow water reflecting all the lights, thick paint texture, paint ridges visible, eerie enchanted atmosphere, painted directly onto pale birch bark, paint pooling in the natural grooves of the bark, oil paint on birch bark",
        "negative_prompt": FEY_NEG,
    },
]


def api_request(url, data=None, method="GET"):
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    if data is not None:
        req = urllib.request.Request(url, data=json.dumps(data).encode(), headers=headers, method="POST")
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode()
            return json.loads(body, strict=False)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code}: {body[:500]}")
        raise


def submit_prediction(pred_info):
    payload = {
        "version": VERSION,
        "input": {
            "prompt": pred_info["prompt"],
            "negative_prompt": pred_info["negative_prompt"],
            **SHARED_PARAMS,
        }
    }
    result = api_request(API_URL, data=payload)
    return result["id"], result.get("status", "unknown")


def poll_prediction(pred_id):
    url = f"{API_URL}/{pred_id}"
    return api_request(url)


def download_image(url, filepath):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=120) as resp:
        with open(filepath, "wb") as f:
            f.write(resp.read())


def main():
    print("=" * 60)
    print("PHASE 1: Submitting 9 predictions")
    print("=" * 60)
    
    submitted = []
    
    for i, pred in enumerate(PREDICTIONS):
        print(f"\n[{i+1}/9] Submitting: {pred['name']}")
        try:
            pred_id, status = submit_prediction(pred)
            print(f"  Prediction ID: {pred_id}")
            print(f"  Initial status: {status}")
            submitted.append((pred_id, pred["name"], pred["filename"]))
        except Exception as e:
            print(f"  FAILED: {e}")
            submitted.append((None, pred["name"], pred["filename"]))
        
        if i < len(PREDICTIONS) - 1:
            print(f"  Waiting 15 seconds before next submission...")
            time.sleep(15)
    
    print(f"\n{'=' * 60}")
    print(f"Submitted {sum(1 for s in submitted if s[0])} / 9 predictions")
    print(f"{'=' * 60}")
    
    print(f"\nPHASE 2: Polling for completion")
    print("=" * 60)
    
    pending = {pid: (name, fname) for pid, name, fname in submitted if pid is not None}
    completed = {}
    failed = {}
    
    poll_count = 0
    while pending:
        poll_count += 1
        print(f"\n--- Poll #{poll_count} ({len(pending)} pending, {len(completed)} done, {len(failed)} failed) ---")
        
        to_remove = []
        for pid, (name, fname) in list(pending.items()):
            try:
                result = poll_prediction(pid)
                status = result.get("status", "unknown")
                
                if status == "succeeded":
                    output = result.get("output")
                    if isinstance(output, list) and len(output) > 0:
                        output_url = output[0]
                    elif isinstance(output, str):
                        output_url = output
                    else:
                        output_url = None
                    
                    if output_url:
                        print(f"  DONE: {name} -> downloading...")
                        filepath = os.path.join(BASE_DIR, fname)
                        try:
                            download_image(output_url, filepath)
                            size = os.path.getsize(filepath)
                            print(f"    Saved: {fname} ({size:,} bytes)")
                            completed[pid] = filepath
                        except Exception as e:
                            print(f"    Download failed: {e}")
                            failed[pid] = f"download error: {e}"
                    else:
                        print(f"  DONE but no output URL: {name}")
                        failed[pid] = "no output URL"
                    to_remove.append(pid)
                    
                elif status == "failed":
                    error = result.get("error", "unknown error")
                    print(f"  FAILED: {name} -- {error}")
                    failed[pid] = error
                    to_remove.append(pid)
                    
                elif status == "canceled":
                    print(f"  CANCELED: {name}")
                    failed[pid] = "canceled"
                    to_remove.append(pid)
                    
                else:
                    logs = result.get("logs", "")
                    pct = ""
                    if logs:
                        lines = logs.strip().split("\n")
                        last = lines[-1] if lines else ""
                        if "%" in last:
                            pct = f" -- {last.strip()}"
                    print(f"  {name}: {status}{pct}")
                    
            except Exception as e:
                print(f"  Poll error for {name}: {e}")
        
        for pid in to_remove:
            del pending[pid]
        
        if pending:
            print(f"\n  Waiting 10 seconds...")
            time.sleep(10)
    
    print(f"\n{'=' * 60}")
    print("FINAL RESULTS")
    print(f"{'=' * 60}")
    
    print(f"\nSucceeded: {len(completed)}")
    print(f"Failed: {len(failed)}")
    
    if completed:
        print(f"\nDownloaded files:")
        for pid, filepath in completed.items():
            size = os.path.getsize(filepath)
            fname = os.path.basename(filepath)
            print(f"  {fname}: {size:,} bytes")
    
    if failed:
        print(f"\nFailed predictions:")
        for pid, error in failed.items():
            name = "unknown"
            for s_pid, s_name, s_fname in submitted:
                if s_pid == pid:
                    name = s_name
                    break
            print(f"  {name}: {error}")
    
    print(f"\nDone.")


if __name__ == "__main__":
    main()
