const express = require("express");
const router = express.Router();
const axios = require("axios");
const { query } = require("../module/db");
const path = require("path");

// Python 서버 URL 설정
const PYTHON_SERVER_URL = "http://0.0.0.0:5002";

// 이미지 임베딩 로드 함수
function getImageEmbeddingPath(imagePath) {
  const basePath = path.resolve(__dirname, "../clip_python/model"); // 절대 경로
  const fileName = path.basename(imagePath, path.extname(imagePath));
  return path.join(basePath, `${fileName}.pt`);
}

// 유사도 검색 API 엔드포인트
router.post("/", async (req, res) => {
  const { queryText } = req.body;

  if (!queryText) {
    return res.status(400).json({ error: "Query text is required." });
  }

  try {
    // 텍스트 임베딩 생성 요청
    const textResponse = await axios.post(
      `${PYTHON_SERVER_URL}/api/clip/embedding`,
      {
        text: queryText,
      }
    );
    const TextEmbedding = textResponse.data.embedding;

    // DB에서 이미지 데이터 가져오기
    const imageData = await query(
      "SELECT space_id, image_path FROM Space_Assets"
    );

    const similarities = [];
    for (const row of imageData) {
      const imageEmbeddingPath = getImageEmbeddingPath(row.image_path);

      try {
        // 이미지 임베딩 계산 요청
        const imageResponse = await axios.post(
          `${PYTHON_SERVER_URL}/api/clip/similarity`,
          {
            TextEmbedding: TextEmbedding, // Python API의 키와 일치하도록 수정
            imageEmbeddingPath: imageEmbeddingPath, // Python 서버에서 사용 중인 키 이름
          }
        );

        const similarity = imageResponse.data.similarity;

        similarities.push({
          space_id: row.space_id,
          image_path: row.image_path,
          similarity,
        });
      } catch (err) {
        console.error(`Error processing image: ${row.image_path}`, err);
      }
    }

    // 상위 5개의 결과 정렬 및 반환
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    // 공간 이름 가져오기
    const spaceIds = topResults.map((result) => result.space_id);
    if (spaceIds.length === 0) {
      return res.json([]); // 빈 결과 반환
    }

    const spaceNames = await query(
      `SELECT space_id, name FROM Space WHERE space_id IN (${spaceIds.join(
        ","
      )})`
    );

    const resultsWithNames = topResults.map((result) => {
      const spaceName =
        spaceNames.find((s) => s.space_id === result.space_id)?.name ||
        "Unknown";
      return { ...result, space_name: spaceName };
    });

    res.json(resultsWithNames);
  } catch (err) {
    console.error("Error processing search:", err);
    res.status(500).json({ error: "Failed to process search." });
  }
});

module.exports = router;
