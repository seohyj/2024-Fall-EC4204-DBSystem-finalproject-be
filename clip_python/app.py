from flask import Flask, request, jsonify
import torch
import os
from transformers import CLIPModel, CLIPProcessor
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 전역 변수로 모델 및 프로세서 선언
model = None
processor = None

# 이미지 특성 로드 함수
def load_image_features(image_path):
    try:
        file_name = os.path.splitext(os.path.basename(image_path))[0]
        pt_file_path = os.path.abspath(f"./model/{file_name}.pt")
        print(f"Loading image features from: {pt_file_path}")  # 디버깅 로그 추가
        return torch.load(pt_file_path)
    except FileNotFoundError:
        print(f"Error: {pt_file_path} 파일을 찾을 수 없습니다.")
        return None
    except Exception as e:
        print(f"Error loading {pt_file_path}: {e}")
        return None

@app.route("/api/clip/embedding", methods=["POST"])
def get_text_embedding():
    data = request.json
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "Text is required"}), 400
    print(f"Received text for embedding: {text}")

    inputs = processor(text=[text], return_tensors="pt")
    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
        normalized_features = text_features / text_features.norm(dim=-1, keepdim=True)

    return jsonify({"embedding": normalized_features.tolist()})


@app.route("/api/clip/similarity", methods=["POST"])
def calculate_similarity():
    data = request.json
    try:
        text_embedding = torch.tensor(data.get("textEmbedding"))
        image_embedding_path = data.get("imageEmbeddingPath")
        print(f"text_embedding: {text_embedding}")
        print(f"image_embedding_path: {image_embedding_path}")
    except Exception as e:
        return jsonify({"error": f"Data processing error: {e}"}), 400

    if not text_embedding or not image_embedding_path:
        return jsonify({"error": "Missing data for similarity calculation"}), 400

    # .pt 파일에서 이미지 특성 로드
    image_features = load_image_features(image_embedding_path)
    if image_features is None:
        return jsonify({"error": f"Failed to load image features from {image_embedding_path}"}), 400

    # 유사도 계산
    similarity = torch.matmul(text_embedding, image_features.T).item()

    return jsonify({"similarity": similarity})


if __name__ == "__main__":
    # CLIP 모델 로드 (메인 실행 시)
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

    # Flask 서버 실행
    app.run(host="0.0.0.0", port=5002)
