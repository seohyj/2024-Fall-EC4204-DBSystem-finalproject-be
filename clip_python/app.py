from flask import Flask, request, jsonify
import torch
import base64
import io

app = Flask(__name__)

# CLIP 모델 로드
from transformers import CLIPModel, CLIPProcessor

if __name__ == "__main__":
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

@app.route("/api/clip/embedding", methods=["POST"])
def get_text_embedding():
    data = request.json
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "Text is required"}), 400

    inputs = processor(text=[text], return_tensors="pt")
    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
        normalized_features = text_features / text_features.norm(dim=-1, keepdim=True)

    return jsonify({"embedding": normalized_features.tolist()})


@app.route("/api/clip/similarity", methods=["POST"])
def calculate_similarity():
    data = request.json
    text_embedding = torch.tensor(data.get("textEmbedding"))
    image_features_base64 = data.get("imageFeatures")

    if not text_embedding or not image_features_base64:
        return jsonify({"error": "Missing data for similarity calculation"}), 400

    # Base64로 전달된 이미지 특성 로드
    image_features = torch.load(io.BytesIO(base64.b64decode(image_features_base64)))

    # 유사도 계산
    similarity = torch.matmul(text_embedding, image_features.T).item()

    return jsonify({"similarity": similarity})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
