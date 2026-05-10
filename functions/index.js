const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({maxInstances: 10});

exports.kakaoAuth = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const {accessToken} = req.body;
  if (!accessToken) {
    res.status(400).json({error: "accessToken required"});
    return;
  }

  // 카카오 API로 유저 정보 조회
  const kakaoRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {Authorization: `Bearer ${accessToken}`},
  });

  if (!kakaoRes.ok) {
    res.status(401).json({error: "invalid kakao token"});
    return;
  }

  const kakaoUser = await kakaoRes.json();
  const uid = `kakao:${kakaoUser.id}`;
  const nickname = kakaoUser.kakao_account?.profile?.nickname ?? null;
  const email = kakaoUser.kakao_account?.email ?? null;

  const firebaseToken = await admin.auth().createCustomToken(uid);
  res.json({firebaseToken, uid, nickname, email});
});
