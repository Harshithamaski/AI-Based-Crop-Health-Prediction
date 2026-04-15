import os
import json
import io
import base64
import traceback

import numpy as np
from flask import Flask, request, jsonify, render_template
from PIL import Image
import tensorflow as tf
from tensorflow.keras.applications.resnet50 import preprocess_input

app = Flask(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "leaf_disease_resnet50_final.h5")
CLASS_PATH = os.path.join(BASE_DIR, "disease_classes.json")

# ── Load class names ───────────────────────────────────────────────────────────
with open(CLASS_PATH, "r") as f:
    CLASS_NAMES = json.load(f)   # {"0": "Apple___Apple_scab", ...}

# ── Load model at startup (not on first request) ──────────────────────────────
print("Loading model…")
model = tf.keras.models.load_model(MODEL_PATH)
print(f"✅ Model ready  |  input={model.input_shape}  output={model.output_shape}")

# ── Preprocessing ──────────────────────────────────────────────────────────────
IMG_SIZE = (224, 224)

def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)          # (224,224,3)
    arr = preprocess_input(arr)                    # ResNet50 normalisation
    return np.expand_dims(arr, axis=0)             # (1,224,224,3)

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # ── Read image bytes ───────────────────────────────────────────────────
        if "file" in request.files:
            image_bytes = request.files["file"].read()
        elif request.is_json and "image" in request.json:
            data = request.json["image"]
            if "," in data:
                data = data.split(",", 1)[1]
            image_bytes = base64.b64decode(data)
        else:
            return jsonify({"error": "No image provided"}), 400

        # ── Predict ────────────────────────────────────────────────────────────
        x     = preprocess_image(image_bytes)
        preds = model.predict(x, verbose=0)        # (1, 38)

        class_idx  = int(np.argmax(preds[0]))
        confidence = float(np.max(preds[0])) * 100

        raw_label = CLASS_NAMES[str(class_idx)]    # "Tomato___Early_blight"
        parts     = raw_label.split("___")
        plant     = parts[0].replace("_", " ")
        disease   = parts[1].replace("_", " ") if len(parts) > 1 else "Unknown"
        is_healthy = "healthy" in disease.lower()

        return jsonify({
            "plant":      plant,
            "disease":    disease,
            "is_healthy": is_healthy,
            "confidence": round(confidence, 2),
            "raw_label":  raw_label,
        })

    except Exception as e:
        traceback.print_exc()          # full stack trace in terminal
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # use_reloader=False prevents TF from being loaded twice
    app.run(debug=True, port=5000, use_reloader=False)