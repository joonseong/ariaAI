# Firebase 프로젝트 초기 설정 가이드

> 이 문서는 Aria 앱을 처음 개발하는 분을 위한 Firebase 설정 가이드입니다.
> Firebase를 처음 사용해도 이 순서대로 따라하면 됩니다.

---

## 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com)에 접속
2. Google 계정으로 로그인
3. **"프로젝트 추가"** 클릭
4. 프로젝트 이름 입력: `aria-dev` (개발용)
5. Google Analytics 활성화 → "계속"
6. 기본 계정 선택 → **"프로젝트 만들기"** 클릭
7. 생성 완료되면 **"계속"** 클릭

> **왜 "dev"를 붙이나요?**
> 개발용과 운영용 Firebase 프로젝트를 분리합니다.
> 실수로 운영 데이터를 삭제하는 것을 방지하기 위해서입니다.
> 나중에 앱 출시 시 `aria-prod` 프로젝트를 별도로 만듭니다.

---

## 2단계: 앱 등록

### iOS 앱 등록
1. Firebase 프로젝트 대시보드 → **iOS 아이콘(+)** 클릭
2. **Apple 번들 ID** 입력: `com.yourname.aria` (예시. 실제로는 자신의 도메인 사용)
3. 앱 닉네임: `Aria iOS` (선택)
4. **"앱 등록"** 클릭
5. `GoogleService-Info.plist` 다운로드 → 프로젝트 루트에 보관
   - Expo managed workflow에서는 이 파일을 직접 사용하지 않지만, EAS Build 시 필요
6. 나머지 단계 → **"계속"** → **"콘솔로 이동"**

### Android 앱 등록
1. Firebase 프로젝트 대시보드 → **Android 아이콘(+)** 클릭
2. **Android 패키지 이름** 입력: `com.yourname.aria`
3. 앱 닉네임: `Aria Android` (선택)
4. **"앱 등록"** 클릭
5. `google-services.json` 다운로드 → 프로젝트 루트에 보관
6. 나머지 단계 → **"계속"** → **"콘솔로 이동"**

> **Expo에서는?**
> Expo managed workflow를 사용하면 위 파일들을 직접 네이티브 폴더에 넣지 않습니다.
> 대신 `app.json`의 `expo.ios.googleServicesFile`과 `expo.android.googleServicesFile`에 경로를 지정합니다.

---

## 3단계: Firebase 서비스 활성화

Firebase Console에서 아래 서비스들을 하나씩 활성화합니다:

### Authentication (인증)
1. 좌측 메뉴 → **Build** → **Authentication** → **"시작하기"**
2. **Sign-in method** 탭에서 활성화:
   - **이메일/비밀번호**: 사용 설정 → 저장
   - **Google**: 사용 설정 → 프로젝트 지원 이메일 선택 → 저장
   - **Apple**: 사용 설정 → 저장 (Apple Developer 계정 필요)

### Firestore Database
1. 좌측 메뉴 → **Build** → **Firestore Database** → **"데이터베이스 만들기"**
2. 위치 선택: `asia-northeast3 (서울)` 권장
3. 보안 규칙: **"테스트 모드에서 시작"** 선택 (나중에 ARCHITECTURE.md의 규칙으로 교체)
4. **"만들기"** 클릭

> **주의**: 테스트 모드는 30일 후 만료됩니다.
> 개발이 어느 정도 진행되면 ARCHITECTURE.md의 Security Rules를 복사해서 적용하세요.

### Storage (파일 저장)
1. 좌측 메뉴 → **Build** → **Storage** → **"시작하기"**
2. 보안 규칙: **"테스트 모드에서 시작"** (나중에 교체)
3. 위치: Firestore와 동일하게 `asia-northeast3`
4. **"완료"** 클릭

### Analytics (분석)
- 1단계에서 Google Analytics를 활성화했다면 자동으로 설정됩니다.

### Crashlytics (크래시 리포트)
1. 좌측 메뉴 → **Release & Monitor** → **Crashlytics**
2. Expo에서는 `expo-firebase-crashlytics` 패키지로 연동 (EAS Build 필요)

---

## 4단계: 환경 변수 설정

Firebase Console에서 API 키를 확인합니다:
1. 프로젝트 설정 (톱니바퀴 아이콘) → **"일반"** 탭
2. **"내 앱"** 섹션에서 **웹 앱 추가** (</> 아이콘)
3. 앱 닉네임: `Aria Web Config` → **"앱 등록"**
4. 화면에 표시되는 `firebaseConfig` 객체의 값을 복사

프로젝트 루트의 `.env` 파일에 입력:
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=aria-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=aria-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=aria-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> **보안 주의**
> `.env` 파일은 절대 Git에 올리지 마세요. `.gitignore`에 이미 포함되어 있습니다.
> 팀원에게는 `.env.example` 파일을 참고하라고 안내하세요.

---

## 5단계: Firebase Emulator 설치 (로컬 개발용)

> **Emulator란?**
> 실제 Firebase 서버 대신 내 컴퓨터에서 가짜 Firebase를 실행하는 도구입니다.
> 개발 중에 실수로 운영 데이터를 건드리는 것을 완전히 방지합니다.

### 설치
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화 (프로젝트 루트에서 실행)
firebase init

# 선택할 항목:
# ✅ Firestore
# ✅ Authentication
# ✅ Storage
# ✅ Emulators
# 프로젝트: aria-dev 선택
```

### Emulator 실행
```bash
# Emulator 시작
firebase emulators:start

# 실행되면 아래 주소에서 확인 가능:
# Auth Emulator:      http://localhost:9099
# Firestore Emulator: http://localhost:8080
# Storage Emulator:   http://localhost:9199
# Emulator UI:        http://localhost:4000
```

### 앱에서 Emulator 연결
ARCHITECTURE.md의 `lib/firebase.ts`에 이미 설정되어 있습니다:
```typescript
if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
```
개발 모드(`npx expo start`)로 앱을 실행하면 자동으로 Emulator에 연결됩니다.

---

## 6단계: Security Rules 적용

개발이 진행되면 테스트 모드 규칙을 실제 규칙으로 교체합니다.

### Firestore Rules
1. Firebase Console → Firestore → **"규칙"** 탭
2. ARCHITECTURE.md의 "Firestore Security Rules" 섹션 전체를 복사
3. 붙여넣기 → **"게시"**

### Storage Rules
1. Firebase Console → Storage → **"규칙"** 탭
2. ARCHITECTURE.md의 "Firebase Storage Rules" 섹션 전체를 복사
3. 붙여넣기 → **"게시"**

> **팁**: `firebase deploy --only firestore:rules,storage` 명령으로 CLI에서도 배포할 수 있습니다.

---

## 7단계: Firestore 인덱스 생성

PRD.md의 "Firestore 인덱스" 테이블에 정의된 복합 인덱스를 생성합니다.

1. Firebase Console → Firestore → **"인덱스"** 탭
2. **"인덱스 추가"** 클릭
3. 아래 인덱스를 하나씩 추가:

| 컬렉션 | 필드 1 | 필드 2 | 설명 |
|--------|--------|--------|------|
| artworks | isHidden (ASC) | createdAt (DESC) | 홈 피드 |
| artworks | authorId (ASC) | createdAt (DESC) | 작가 포트폴리오 |
| artworks | isHidden (ASC) | likesCount (DESC) | 인기 정렬 |
| likes | userId (ASC) | createdAt (DESC) | 좋아요 목록 |
| follows | followerId (ASC) | createdAt (DESC) | 팔로잉 목록 |
| bookmarks | userId (ASC) | createdAt (DESC) | 저장 목록 |

> **팁**: 인덱스를 안 만들고 앱에서 해당 쿼리를 실행하면 콘솔에 에러 링크가 나옵니다.
> 그 링크를 클릭하면 자동으로 인덱스 생성 페이지로 이동합니다.

---

## 체크리스트

프로젝트 시작 전 아래 항목을 모두 확인하세요:

- [ ] Firebase 프로젝트 생성 (aria-dev)
- [ ] iOS 앱 등록 + GoogleService-Info.plist 다운로드
- [ ] Android 앱 등록 + google-services.json 다운로드
- [ ] Authentication 활성화 (이메일, Google, Apple)
- [ ] Firestore Database 생성 (서울 리전)
- [ ] Storage 활성화
- [ ] `.env` 파일 생성 + API 키 입력
- [ ] Firebase Emulator 설치 + 실행 확인
- [ ] Security Rules 적용 (개발 중반 이후)
- [ ] Firestore 인덱스 생성

---

## 비용 안내

### Spark 플랜 (무료) — MVP 기간 사용
| 서비스 | 무료 한도 |
|--------|-----------|
| Firestore 읽기 | 50,000회/일 |
| Firestore 쓰기 | 20,000회/일 |
| Storage | 5GB |
| Authentication | 무제한 |
| Hosting | 10GB/월 |

### Blaze 플랜 (종량제) — v2 이후 전환
- Cloud Functions, FCM 등 사용 시 필요
- 무료 한도 동일 + 초과분만 과금
- 예상 비용: DAU 1,000명 기준 월 $5~15
