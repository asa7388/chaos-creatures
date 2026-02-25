#!/Users/alexali/Projects/chaos-creatures/scripts/.venv/bin/python3
"""Upload generated card art to R2 and create Supabase generation_jobs records."""

import os
import sys
import uuid
import boto3
import requests
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load env vars
ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "packages" / "game-server" / ".env")

# R2 config
R2_ACCOUNT_ID = os.environ["R2_ACCOUNT_ID"]
R2_ACCESS_KEY_ID = os.environ["R2_ACCESS_KEY_ID"]
R2_SECRET_ACCESS_KEY = os.environ["R2_SECRET_ACCESS_KEY"]
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "chaos-creatures-art")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "https://pub-ab96c6d0742748d19e4ad5502f3fea09.r2.dev")

# Supabase config
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Faction ID mapping (from Supabase seed data — these are the actual UUIDs)
# We need to look these up, so let's query Supabase for them
def get_faction_ids():
    """Fetch faction name->id mapping from Supabase."""
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/factions?select=id,name",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        }
    )
    resp.raise_for_status()
    factions = resp.json()
    # Map lowercase prefix to faction ID
    mapping = {}
    for f in factions:
        name_lower = f["name"].lower()
        if "ironwright" in name_lower:
            mapping["ironwright"] = f["id"]
        elif "fey" in name_lower:
            mapping["fey"] = f["id"]
        elif "demonic" in name_lower:
            mapping["demonic"] = f["id"]
        elif "celestial" in name_lower:
            mapping["celestial"] = f["id"]
        elif "endless" in name_lower:
            mapping["endless"] = f["id"]
    return mapping


def upload_to_r2(filepath: Path, key: str) -> str:
    """Upload a file to R2 and return the public URL."""
    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )
    with open(filepath, "rb") as f:
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=f.read(),
            ContentType="image/png",
            CacheControl="public, max-age=31536000, immutable",
        )
    return f"{R2_PUBLIC_URL}/{key}"


def create_generation_job(faction_id: str, faction_name: str, creature_hint: str, art_url: str):
    """Insert a COMPLETED generation_job in Supabase."""
    now = datetime.now(timezone.utc).isoformat()
    job = {
        "id": str(uuid.uuid4()),
        "job_type": "BASE_CARD_IMAGE",
        "status": "COMPLETED",
        "input_data": {
            "faction_id": faction_id,
            "card_type": "CREATURE",
            "creature_type_hint": creature_hint,
            "batch_id": "phase6-batch1",
        },
        "output_data": {
            "name": creature_hint.replace("_", " ").title(),
            "card_type": "CREATURE",
            "art_prompt": f"SDXL LoRA generation - {creature_hint}",
        },
        "art_url": art_url,
        "model_used": "asa7388/chscrt-sdxl-lora-v2-sdxl",
        "cost_usd": 0.02,
        "attempt_count": 1,
        "max_attempts": 3,
        "created_at": now,
        "completed_at": now,
    }
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/generation_jobs",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        json=job,
    )
    if resp.status_code not in (200, 201):
        print(f"  WARNING: Supabase insert failed ({resp.status_code}): {resp.text}")
        return False
    return True


def parse_filename(filename: str):
    """Parse faction and creature hint from filename like 'ironwright_01.png'."""
    stem = Path(filename).stem  # e.g., 'ironwright_01'
    parts = stem.split("_", 1)
    faction = parts[0]
    creature_hint = parts[1] if len(parts) > 1 else "creature"
    return faction, creature_hint


def main():
    directory = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "Staging" / "phase6_batch1")
    directory = Path(directory)
    
    if not directory.exists():
        print(f"Directory not found: {directory}")
        sys.exit(1)
    
    pngs = sorted(directory.glob("*.png"))
    if not pngs:
        print(f"No PNG files found in {directory}")
        sys.exit(1)
    
    print(f"Found {len(pngs)} PNG files in {directory}")
    print("Fetching faction IDs from Supabase...")
    faction_ids = get_faction_ids()
    print(f"Factions: {list(faction_ids.keys())}")
    
    uploaded = 0
    failed = 0
    
    for png in pngs:
        faction, creature_hint = parse_filename(png.name)
        
        if faction not in faction_ids:
            print(f"  SKIP: Unknown faction '{faction}' in {png.name}")
            failed += 1
            continue
        
        faction_id = faction_ids[faction]
        r2_key = f"cards/generated/{faction}/{png.name}"
        
        print(f"  Uploading {png.name} -> {r2_key}...")
        try:
            art_url = upload_to_r2(png, r2_key)
            print(f"    R2: {art_url}")
            
            if create_generation_job(faction_id, faction, creature_hint, art_url):
                print(f"    Supabase: OK")
                uploaded += 1
            else:
                failed += 1
        except Exception as e:
            print(f"    ERROR: {e}")
            failed += 1
    
    print(f"\nDone: {uploaded} uploaded, {failed} failed out of {len(pngs)} total")


if __name__ == "__main__":
    main()
