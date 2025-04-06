import json
import os
import re

# === SETTINGS ===
image_dir = "images"
debug = True

# === LOAD JSON ===
with open("aircraft-data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Normalize = lowercase + remove non-alphanumerics
def normalize(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

# Build maps
image_map = {}  # normalized(image filename) -> target filename
model_map = {}  # normalized(model name) -> target filename

for entry in data:
    img_path = entry["image"]
    model = entry["model"]
    filename = os.path.basename(img_path)
    base_name = os.path.splitext(filename)[0]

    norm_img = normalize(base_name)
    norm_model = normalize(model)

    image_map[norm_img] = filename
    model_map[norm_model] = filename

# Combine into one search list, but prioritize image_map
combined_map = {**model_map, **image_map}

renamed = []
skipped = []
already_correct = []

# Try to match filename to correct name
def find_best_match(filename):
    norm_filename = normalize(filename)
    for key, target_filename in combined_map.items():
        if key in norm_filename:
            return target_filename, key
    return None, None

# === MAIN ===
for filename in os.listdir(image_dir):
    if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
        continue

    src = os.path.join(image_dir, filename)
    matched_filename, matched_key = find_best_match(filename)

    if matched_filename:
        dst = os.path.join(image_dir, matched_filename)

        # If it's already the correct name, skip
        if os.path.abspath(src) == os.path.abspath(dst):
            if debug:
                print(f"[OK] '{filename}' is already correctly named.")
            already_correct.append(filename)
            continue

        if not os.path.exists(dst):
            os.rename(src, dst)
            if debug:
                print(f"[MATCH] '{filename}' matched '{matched_key}' → renamed to '{matched_filename}'")
            renamed.append((filename, matched_filename))
        else:
            if debug:
                print(f"[SKIP] Target file already exists: '{dst}'")
            skipped.append(filename)
    else:
        if debug:
            print(f"[NO MATCH] '{filename}' didn’t match any known model or image.")
        skipped.append(filename)

# === SUMMARY ===
print("\n=== ✅ Renamed Files ===")
if renamed:
    for old, new in renamed:
        print(f"  {old} → {new}")
else:
    print("  (none)")

print("\n=== 🔁 Already Correct ===")
if already_correct:
    for file in already_correct:
        print(f"  {file}")
else:
    print("  (none)")

print("\n=== ⚠️ Skipped Files (no match or duplicate) ===")
if skipped:
    for file in skipped:
        print(f"  {file}")
else:
    print("  (none)")
