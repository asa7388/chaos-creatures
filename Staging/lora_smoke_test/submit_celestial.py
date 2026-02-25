#!/usr/bin/env python3
"""Submit 3 Celestial humanoid creature predictions to Replicate, poll, and download."""

import json
import os
import time
import urllib.request
import urllib.error

# Config
ENV_PATH = "/Users/alexali/Projects/chaos-creatures/.env"
OUTPUT_DIR = "/Users/alexali/Projects/chaos-creatures/Staging/lora_smoke_test"

# Read token
with open(ENV_PATH) as f:
    for line in f:
        if line.startswith("REPLICATE_API_TOKEN"):
            TOKEN = line.split("=", 1)[1].strip().strip("'\"")
            break

VERSION = "6357bf718043fed5140dc5cdcad9e152a20bb0fdce66b5c96cb5c3e5c6691f2f"

SHARED_SETTINGS = {
    "width": 1024,
    "height": 1432,
    "apply_watermark": False,
    "disable_safety_checker": True,
    "lora_scale": 0.6,
    "negative_prompt": "signature, text, watermark, writing, artist name, letters, words, scribble, caption, label, logo, stamp, copyright, initials, biblical, religious, Renaissance, classical, Christian",
}

CREATURES = [
    {
        "name": "Armored Sentinel",
        "filename": "celestial_sdxl_v6a.png",
        "prompt": "impasto oil painting, a towering armored sentinel made of living white stone and gold, faceless helm with a single burning eye, massive crystalline sword held upright, cracks in the armor glowing with inner light, standing guard at the gates of a ruined celestial citadel floating among clouds, thick paint texture, paint ridges visible, otherworldly atmosphere, painted directly onto fine vellum, oil paint on vellum",
    },
    {
        "name": "Four-Armed Oracle",
        "filename": "celestial_sdxl_v6b.png",
        "prompt": "impasto oil painting, a four-armed floating figure wrapped in tattered luminous robes, skin of polished obsidian with veins of molten gold, no face only a smooth mirrored surface reflecting distorted stars, each hand holding a different glowing orb of energy, long tendrils of light flowing from its back like a cape, hovering above a shattered mirror lake, thick paint texture, paint ridges visible, otherworldly atmosphere, painted directly onto fine vellum, oil paint on vellum",
    },
    {
        "name": "Giant Astral Knight",
        "filename": "celestial_sdxl_v6c.png",
        "prompt": "impasto oil painting, a colossal spectral knight kneeling on a battlefield of broken golden spears, translucent ethereal body showing a galaxy of stars swirling inside its chest, helm crowned with a ring of orbiting light fragments, one hand planted on the ground sending cracks of radiance through the earth, thick paint texture, paint ridges visible, otherworldly atmosphere, painted directly onto fine vellum, oil paint on vellum",
    },
]


def api_request(url, data=None, method="GET"):
    """Make an API request to Replicate."""
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode()
            return json.loads(text, strict=False)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  HTTP {e.code}: {error_body}")
        raise


def submit_prediction(creature):
    """Submit a single prediction and return its ID."""
    payload = {
        "version": VERSION,
        "input": {
            "prompt": creature["prompt"],
            **SHARED_SETTINGS,
        },
    }
    print(f"\nSubmitting: {creature['name']}...")
    result = api_request("https://api.replicate.com/v1/predictions", data=payload, method="POST")
    pred_id = result["id"]
    status = result["status"]
    print(f"  Prediction ID: {pred_id}")
    print(f"  Status: {status}")
    return pred_id


def poll_prediction(pred_id):
    """Poll a prediction and return its current state."""
    return api_request(f"https://api.replicate.com/v1/predictions/{pred_id}")


def download_file(url, filepath):
    """Download a file from URL to filepath."""
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=120) as resp:
        with open(filepath, "wb") as f:
            f.write(resp.read())


def main():
    prediction_ids = []

    # Submit predictions one at a time with 15-second delays
    for i, creature in enumerate(CREATURES):
        pred_id = submit_prediction(creature)
        prediction_ids.append((pred_id, creature))
        if i < len(CREATURES) - 1:
            print(f"\n  Waiting 15 seconds before next submission...")
            time.sleep(15)

    print(f"\n{'='*60}")
    print(f"All 3 predictions submitted. Polling for completion...")
    print(f"{'='*60}")

    # Poll all 3 every 10 seconds until all complete
    completed = set()
    failed = set()

    while len(completed) + len(failed) < len(prediction_ids):
        time.sleep(10)
        print(f"\n[{time.strftime('%H:%M:%S')}] Polling...")

        for pred_id, creature in prediction_ids:
            if pred_id in completed or pred_id in failed:
                continue

            result = poll_prediction(pred_id)
            status = result["status"]
            print(f"  {creature['name']} ({pred_id}): {status}")

            if status == "succeeded":
                completed.add(pred_id)
                output = result.get("output")
                if isinstance(output, list) and len(output) > 0:
                    image_url = output[0]
                elif isinstance(output, str):
                    image_url = output
                else:
                    print(f"  WARNING: Unexpected output format: {output}")
                    failed.add(pred_id)
                    continue

                filepath = os.path.join(OUTPUT_DIR, creature["filename"])
                print(f"  Downloading to {filepath}...")
                download_file(image_url, filepath)
                size = os.path.getsize(filepath)
                print(f"  Downloaded: {size:,} bytes ({size/1024:.1f} KB)")

            elif status == "failed":
                failed.add(pred_id)
                error = result.get("error", "Unknown error")
                print(f"  FAILED: {error}")

            elif status == "canceled":
                failed.add(pred_id)
                print(f"  CANCELED")

    # Final summary
    print(f"\n{'='*60}")
    print(f"RESULTS SUMMARY")
    print(f"{'='*60}")

    for pred_id, creature in prediction_ids:
        filepath = os.path.join(OUTPUT_DIR, creature["filename"])
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"  {creature['name']}: {creature['filename']} -- {size:,} bytes ({size/1024:.1f} KB)")
        else:
            status_label = "FAILED" if pred_id in failed else "UNKNOWN"
            print(f"  {creature['name']}: {status_label}")

    print(f"\nCompleted: {len(completed)}/3")
    if failed:
        print(f"Failed: {len(failed)}/3")


if __name__ == "__main__":
    main()
