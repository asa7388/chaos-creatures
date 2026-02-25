#!/usr/bin/env python3
"""Submit 25 creature predictions to Replicate SDXL LoRA and download results."""

import json
import os
import time
import urllib.request
import urllib.error

TOKEN = os.environ["REPLICATE_TOKEN"]
VERSION = "6357bf718043fed5140dc5cdcad9e152a20bb0fdce66b5c96cb5c3e5c6691f2f"
OUTPUT_DIR = "/Users/alexali/Projects/chaos-creatures/Staging/phase6_batch1"
SUBMIT_DELAY = 12
POLL_INTERVAL = 15

SHARED = {
    "width": 1024,
    "height": 1432,
    "apply_watermark": False,
    "disable_safety_checker": True,
    "lora_scale": 0.6,
}

PROMPTS = [
    {"filename": "ironwright_01.png", "prompt": "impasto oil painting, a colossal siege automaton with a white-hot furnace burning in its chest, striding across a scorched industrial battlefield littered with broken machinery, exhaust venting from shoulder stacks, molten slag dripping from its fists, thick paint texture, paint ridges visible, painted directly onto cold iron plate, brushstrokes catching on rivets and hammer marks, metallic grey ground showing through thin paint, oil paint on iron", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "ironwright_02.png", "prompt": "impasto oil painting, an armored war-beetle the size of a building with iron mandibles crackling with electrical discharge, tunneling upward through the floor of a collapsed factory, sparks and debris flying, worker drones scattering below, thick paint texture, paint ridges visible, industrial warzone atmosphere, painted directly onto cold iron plate, oil paint on iron", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "ironwright_03.png", "prompt": "impasto oil painting, a towering mechanical centaur with a rotating cannon arm and twin smokestacks rising from its back, standing on a gantry overlooking a vast foundry filled with molten metal, silhouetted against furnace glow, thick paint texture, paint ridges visible, painted directly onto cold iron plate, oil paint on iron", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "ironwright_04.png", "prompt": "impasto oil painting, an ironclad hydra with three serpentine heads of welded blackened steel, coiled around the base of a crumbling nuclear reactor, coolant steam hissing from joints, each head glowing different temperature colors, thick paint texture, paint ridges visible, painted directly onto cold iron plate, oil paint on iron", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "ironwright_05.png", "prompt": "impasto oil painting, a massive bull-like war machine with glowing red photoreceptor eyes and grinding gear joints, mid-charge through a wall of smoke and fire on a ruined highway, debris scattering in its wake, thick paint texture, paint ridges visible, brutal industrial atmosphere, painted directly onto cold iron plate, oil paint on iron", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "fey_01.png", "prompt": "impasto oil painting, a massive stag-headed forest guardian with antlers of living wood draped in luminous moss and glowing mushrooms, standing in a moonlit grove of silver birch trees, fireflies swirling around its crown, thick paint texture, paint ridges visible, magical twilight atmosphere, painted directly onto pale birch bark, paint pooling in the natural grooves of the bark, oil paint on birch bark", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "fey_02.png", "prompt": "impasto oil painting, a spectral white horse galloping across the surface of a misty lake at dawn, its mane dissolving into wisps of fog, hooves barely touching the water sending out ripples of light, ancient standing stones visible on the far shore, thick paint texture, paint ridges visible, ethereal atmosphere, painted directly onto pale birch bark, oil paint on birch bark", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "fey_03.png", "prompt": "impasto oil painting, a coiled basilisk with iridescent emerald and sapphire scales hiding within a tangle of enchanted briar thorns, amber eyes glowing hypnotically, small birds turned to stone scattered around its lair, thick paint texture, paint ridges visible, dangerous beauty atmosphere, painted directly onto pale birch bark, oil paint on birch bark", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "fey_04.png", "prompt": "impasto oil painting, a towering green man made of moss and lichen and twisted roots emerging from an ancient stone circle at twilight, arms spread wide scattering seeds of light, wildflowers blooming in his footsteps, thick paint texture, paint ridges visible, primordial atmosphere, painted directly onto pale birch bark, oil paint on birch bark", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "fey_05.png", "prompt": "impasto oil painting, a graceful swan maiden caught mid-transformation between woman and great white swan on a frozen winter lake, feathers and skin merging, ice crystals forming patterns around her, northern lights reflecting in the dark water, thick paint texture, paint ridges visible, haunting beauty, painted directly onto pale birch bark, oil paint on birch bark", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "demonic_01.png", "prompt": "impasto oil painting, a massive scorpion demon with a tail of blue hellfire arching overhead, crawling across a field of bleached bones under a sky of red lightning, smaller imp creatures fleeing before it, thick paint texture, paint ridges visible, oppressive infernal atmosphere, painted directly onto cured dark leather hide, paint cracking along the leather grain, oil paint on leather", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials"},
    {"filename": "demonic_02.png", "prompt": "impasto oil painting, a grotesque toad-like arch-demon with distended belly and crown of twisted horns, vomiting a stream of green cursed fire from atop a throne of rusted chains suspended over a bottomless pit, thick paint texture, paint ridges visible, nauseating oppressive atmosphere, painted directly onto cured dark leather hide, oil paint on leather", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials"},
    {"filename": "demonic_03.png", "prompt": "impasto oil painting, a skeletal wyrm wreathed in hellfire perched atop the spire of a ruined gothic cathedral, wings of tattered membrane spread against a blood-red sunset, gargoyles crumbling beneath its claws, thick paint texture, paint ridges visible, apocalyptic atmosphere, painted directly onto cured dark leather hide, oil paint on leather", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials"},
    {"filename": "demonic_04.png", "prompt": "impasto oil painting, a many-armed spider demon spinning webs of crackling dark energy in a vast cavern whose walls are carved with thousands of screaming faces, victims cocooned in shadow silk hanging from the ceiling, thick paint texture, paint ridges visible, claustrophobic horror atmosphere, painted directly onto cured dark leather hide, oil paint on leather", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials"},
    {"filename": "demonic_05.png", "prompt": "impasto oil painting, a hulking minotaur demon dragging a massive spiked chain through a burning medieval city street at night, buildings collapsing in its wake, terrified civilians fleeing, thick paint texture, paint ridges visible, brutal carnage atmosphere, painted directly onto cured dark leather hide, oil paint on leather", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials"},
    {"filename": "celestial_01.png", "prompt": "impasto oil painting, a towering crystalline golem-knight with a body of translucent quartz and a prismatic greatsword, standing guard in a field of luminous starflowers under a sky of three moons, light refracting through its body casting rainbow patterns, thick paint texture, paint ridges visible, otherworldly atmosphere, painted directly onto fine vellum, oil paint on vellum", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials, biblical, religious, Renaissance, classical, Christian"},
    {"filename": "celestial_02.png", "prompt": "impasto oil painting, a four-armed celestial archer made of polished obsidian with veins of molten gold, drawing back a bow of concentrated starlight on a floating stone platform above an infinite cloudscape, each arm pulling a different energy arrow, thick paint texture, paint ridges visible, cosmic atmosphere, painted directly onto fine vellum, oil paint on vellum", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials, biblical, religious, Renaissance, classical, Christian"},
    {"filename": "celestial_03.png", "prompt": "impasto oil painting, a spectral guardian entity made entirely of condensed aurora light in green and violet, hovering above a snow-covered mountain peak at dawn, its form shifting and flowing like the northern lights given shape and purpose, thick paint texture, paint ridges visible, transcendent atmosphere, painted directly onto fine vellum, oil paint on vellum", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials, biblical, religious, Renaissance, classical, Christian"},
    {"filename": "celestial_04.png", "prompt": "impasto oil painting, an obsidian-skinned colossus with gold circuit-like veins pulsing with energy, seated cross-legged in meditation above a sea of clouds, a mandala of orbiting stone fragments and light spinning slowly around its head, thick paint texture, paint ridges visible, serene cosmic atmosphere, painted directly onto fine vellum, oil paint on vellum", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials, biblical, religious, Renaissance, classical, Christian"},
    {"filename": "celestial_05.png", "prompt": "impasto oil painting, a sleek armored figure with a featureless mirrored mask reflecting a distorted galaxy, wielding twin blades of condensed plasma, standing before an enormous swirling portal of white and gold energy, thick paint texture, paint ridges visible, otherworldly atmosphere, painted directly onto fine vellum, oil paint on vellum", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials, biblical, religious, Renaissance, classical, Christian"},
    {"filename": "endless_01.png", "prompt": "impasto oil painting, a colossal jellyfish-like entity drifting through a void of dying stars, its translucent bell revealing galaxies churning inside, hundreds of bioluminescent tentacles stretching downward into infinite darkness, tiny dead worlds caught in its tendrils, thick paint texture, paint ridges visible, vast cosmic horror atmosphere, painted directly onto ancient bone-dark parchment, dark pigments soaking into the fibrous surface, oil paint on parchment", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "endless_02.png", "prompt": "impasto oil painting, an ancient stone colossus crumbling at the edges with entire galaxies visible through the cracks and fissures in its body, one arm raised as if reaching for something long gone, moss and cosmic dust covering its surface, thick paint texture, paint ridges visible, melancholic ancient atmosphere, painted directly onto ancient bone-dark parchment, oil paint on parchment", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "endless_03.png", "prompt": "impasto oil painting, a vast amorphous shadow creature with hundreds of tiny white pinprick eyes, oozing and flowing through the ruins of an ancient library, books dissolving into dark mist at its touch, knowledge being consumed, thick paint texture, paint ridges visible, dread and inevitability atmosphere, painted directly onto ancient bone-dark parchment, oil paint on parchment", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "endless_04.png", "prompt": "impasto oil painting, a skeletal serpent made of petrified cosmic dust and dead starlight coiled around a small dead planet, its eye sockets containing miniature black holes that bend the light around them, asteroid debris orbiting its body, thick paint texture, paint ridges visible, ancient void atmosphere, painted directly onto ancient bone-dark parchment, oil paint on parchment", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
    {"filename": "endless_05.png", "prompt": "impasto oil painting, a humanoid figure made of crystallized frozen time, caught mid-stride with temporal distortions radiating outward from its body like cracks in glass, everything near it aging and decaying rapidly while it remains perfectly preserved, thick paint texture, paint ridges visible, eerie timeless atmosphere, painted directly onto ancient bone-dark parchment, oil paint on parchment", "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo"},
]


def api_request(method, url, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode()
            return json.loads(text, strict=False)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  HTTP {e.code}: {error_body}", flush=True)
        return None
    except Exception as e:
        print(f"  Request error: {e}", flush=True)
        return None


def submit_prediction(prompt_data):
    payload = {
        "version": VERSION,
        "input": {
            "prompt": prompt_data["prompt"],
            "negative_prompt": prompt_data["negative_prompt"],
            **SHARED,
        },
    }
    result = api_request("POST", "https://api.replicate.com/v1/predictions", payload)
    if result and "id" in result:
        return result["id"]
    print(f"  ERROR submitting {prompt_data['filename']}: {result}", flush=True)
    return None


def check_prediction(pred_id):
    result = api_request("GET", f"https://api.replicate.com/v1/predictions/{pred_id}")
    if not result:
        return "error", None
    status = result.get("status", "unknown")
    output = result.get("output")
    if status == "succeeded" and output:
        if isinstance(output, list) and len(output) > 0:
            return "succeeded", output[0]
        return "succeeded", output
    if status == "failed":
        error = result.get("error", "unknown error")
        return "failed", error
    return status, None


def download_image(url, filepath):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(filepath, "wb") as f:
                f.write(resp.read())
        return True
    except Exception as e:
        print(f"  Download error: {e}", flush=True)
        return False


def main():
    print("=" * 70, flush=True)
    print("CHAOS CREATURES - Phase 6 Batch 1: 25 Creature Generations", flush=True)
    print("=" * 70, flush=True)
    print(f"Model version: {VERSION[:16]}...", flush=True)
    print(f"Output dir: {OUTPUT_DIR}", flush=True)
    print(flush=True)

    predictions = {}
    print("PHASE 1: Submitting 25 predictions (12s delay between each)", flush=True)
    print("-" * 50, flush=True)

    for i, p in enumerate(PROMPTS):
        faction = p["filename"].split("_")[0].upper()
        print(f"[{i+1:2d}/25] Submitting {p['filename']} ({faction})...", end=" ", flush=True)
        pred_id = submit_prediction(p)
        if pred_id:
            predictions[pred_id] = p["filename"]
            print(f"OK -> {pred_id}", flush=True)
        else:
            print("FAILED", flush=True)

        if i < len(PROMPTS) - 1:
            time.sleep(SUBMIT_DELAY)

    print(flush=True)
    print(f"Submitted: {len(predictions)}/25 predictions", flush=True)
    print(flush=True)

    if not predictions:
        print("No predictions submitted. Exiting.", flush=True)
        return

    print("PHASE 2: Polling for results (every 15s)", flush=True)
    print("-" * 50, flush=True)

    completed = {}
    failed = {}
    pending = dict(predictions)

    while pending:
        newly_done = []
        for pred_id, filename in list(pending.items()):
            status, data = check_prediction(pred_id)

            if status == "succeeded":
                filepath = os.path.join(OUTPUT_DIR, filename)
                print(f"  DONE: {filename} - downloading...", end=" ", flush=True)
                if download_image(data, filepath):
                    size = os.path.getsize(filepath)
                    print(f"OK ({size:,} bytes)", flush=True)
                    completed[filename] = filepath
                else:
                    print("DOWNLOAD FAILED", flush=True)
                    failed[filename] = "download failed"
                newly_done.append(pred_id)

            elif status == "failed":
                print(f"  FAIL: {filename} - {data}", flush=True)
                failed[filename] = str(data)
                newly_done.append(pred_id)

        for pid in newly_done:
            del pending[pid]

        done_count = len(completed) + len(failed)
        total = len(predictions)
        print(f"  --- Progress: {done_count}/{total} done ({len(completed)} success, {len(failed)} failed, {len(pending)} pending) ---", flush=True)

        if pending:
            time.sleep(POLL_INTERVAL)

    print(flush=True)
    print("=" * 70, flush=True)
    print("FINAL REPORT", flush=True)
    print("=" * 70, flush=True)
    print(flush=True)
    print(f"{'#':>3}  {'Filename':<22} {'Status':<10} {'Size':>12}", flush=True)
    print("-" * 52, flush=True)

    for i, p in enumerate(PROMPTS):
        fn = p["filename"]
        filepath = os.path.join(OUTPUT_DIR, fn)
        if fn in completed and os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"{i+1:3d}  {fn:<22} {'OK':<10} {size:>10,} B", flush=True)
        elif fn in failed:
            print(f"{i+1:3d}  {fn:<22} {'FAILED':<10} {failed[fn]}", flush=True)
        else:
            print(f"{i+1:3d}  {fn:<22} {'MISSING':<10}", flush=True)

    print("-" * 52, flush=True)
    print(f"Total: {len(completed)} succeeded, {len(failed)} failed, {25 - len(completed) - len(failed)} missing", flush=True)
    print(flush=True)

    total_bytes = sum(
        os.path.getsize(os.path.join(OUTPUT_DIR, fn))
        for fn in completed
        if os.path.exists(os.path.join(OUTPUT_DIR, fn))
    )
    print(f"Total download size: {total_bytes:,} bytes ({total_bytes / 1024 / 1024:.1f} MB)", flush=True)


if __name__ == "__main__":
    main()
