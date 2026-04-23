# Architecture Decision Records

## 철학

MVP 속도 최우선. 서버 구축 없이 BaaS로 빠르게 출시하고, 사용자 피드백으로 방향을 잡는다. 외부 의존성은 검증된 것만 최소한으로 도입한다. 초보 개발자가 유지보수할 수 있는 수준의 복잡도를 유지한다.

---

### ADR-001: React Native (Expo) 선택

**날짜**: 2026-04-23
**상태**: 확정

**결정**: React Native + Expo managed workflow (SDK 52+)로 iOS/Android 동시 개발
**이유**:
- 개발자가 앱 개발 초보 — Expo는 네이티브 빌드 설정(Xcode, Android Studio) 없이 `npx expo start`로 시작 가능
- 하나의 TypeScript 코드베이스로 두 플랫폼 커버
- Expo Router로 파일 기반 라우팅 제공 (Next.js와 유사한 멘탈 모델)
- EAS Build/Submit으로 앱스토어 배포까지 CLI 한 줄로 처리
- Expo SDK 52+는 New Architecture (Fabric, TurboModules) 지원으로 성능 향상

**대안 검토**:
| 대안 | 기각 이유 |
|------|-----------|
| Flutter | Dart 언어 학습 필요, Firebase RN SDK 대비 Flutter 플러그인 성숙도 차이 |
| Swift + Kotlin 네이티브 | 두 코드베이스 유지 불가 (1인 개발) |
| PWA | 네이티브 수준 이미지 뷰어(핀치줌), 갤러리 접근, 푸시 알림 제약 |

**트레이드오프**:
- 네이티브 모듈 직접 접근 제한 → Aria는 카메라, AR 등 무거운 네이티브 기능 불필요
- Expo Go에서 일부 라이브러리 미지원 → dev build(`npx expo run:ios`)로 해결
- OTA 업데이트(EAS Update) 사용 시 앱스토어 심사 없이 JS 번들 업데이트 가능 → MVP 이후 활용

**위험 요소**:
- Expo SDK 메이저 업그레이드 시 breaking changes → 출시 후 6개월은 SDK 고정, 이후 점진적 업그레이드

---

### ADR-002: Firebase BaaS 선택 (서버리스)

**날짜**: 2026-04-23
**상태**: 확정

**결정**: Firebase Auth + Firestore + Storage + Analytics + Crashlytics를 백엔드로 사용. 자체 서버 구축하지 않음

**이유**:
- 초보 개발자가 Express/NestJS 서버를 직접 구축·배포·운영하는 것은 MVP 속도를 크게 저해
- Firebase Auth: 이메일/Google/Apple 로그인을 SDK 호출 몇 줄로 구현
- Firestore: NoSQL 문서 DB로 스키마 마이그레이션 없이 유연하게 구조 변경 가능
- Storage: 이미지 업로드 → CDN URL 발급이 내장
- Analytics + Crashlytics: 별도 서비스 없이 사용자 행동 분석 + 크래시 수집
- 무료 Spark 플랜 한도: Firestore 읽기 50K/일, 쓰기 20K/일, Storage 5GB, Auth 무제한

**대안 검토**:
| 대안 | 기각 이유 |
|------|-----------|
| Supabase | PostgreSQL 기반으로 SQL 지식 필요, 실시간 기능은 Firebase 리스너 대비 설정 복잡 |
| AWS Amplify | Firebase 대비 초보자 진입장벽 높음, 문서·커뮤니티 규모 차이 |
| 자체 서버 (Express + PostgreSQL) | 서버 구축·배포·운영 부담, MVP 속도 저해 |
| Appwrite | 자체 호스팅 필요하거나 클라우드 버전 제약, Firebase 대비 생태계 작음 |

**트레이드오프**:
- Firestore는 복잡한 쿼리(JOIN, 전문 검색, 집계)에 약함 → 비정규화 + prefix 검색으로 MVP 대응. v2에서 Algolia 도입 검토
- 벤더 종속 (Firebase → 타 서비스 마이그레이션 비용 큼) → services/ 레이어로 추상화하여 완화. 단 완전한 추상화는 과잉이므로 인터페이스만 분리
- 실시간 리스너(onSnapshot) 남용 시 읽기 비용 급증 → 작품 상세만 실시간, 피드는 단발 쿼리 + pull-to-refresh

**비용 시나리오 (Spark → Blaze 전환 시점)**:
| 지표 | Spark 한도 | 초과 시 비용 (Blaze) | Aria 예상 시점 |
|------|-----------|----------------------|---------------|
| Firestore 읽기 | 50K/일 | $0.06 / 100K | DAU 500+ |
| Firestore 쓰기 | 20K/일 | $0.18 / 100K | 일일 작품 등록 200+ |
| Storage | 5GB | $0.026/GB/월 | 작품 500장 (장당 ~10MB) |
| Auth | 무제한 | 무료 | 해당 없음 |

**위험 요소**:
- Firebase 장애 시 앱 전체 불능 → Crashlytics 알림 설정으로 빠른 인지. MVP에서는 수용
- Firestore 가격 모델 변경 가능 → Blaze 플랜에서 예산 알림 설정

---

### ADR-003: Zustand 상태 관리

**날짜**: 2026-04-23
**상태**: 확정

**결정**: 글로벌 클라이언트 상태 관리에 Zustand 사용. Redux/MobX 사용하지 않음

**이유**:
- Redux는 boilerplate(action, reducer, selector)가 많아 초보자에게 진입장벽 높음
- Zustand는 하나의 `create()` 호출로 스토어 생성, 훅으로 바로 사용
- 번들 크기 1.1KB (Redux Toolkit 12KB+ 대비)
- TypeScript 타입 추론이 자연스러움
- 서버 상태는 Firestore 리스너/커스텀 훅이 담당하므로, 전역 상태 관리의 역할이 작음

**스코프 결정 — Zustand에 넣을 것 / 넣지 않을 것**:
| 넣을 것 | 넣지 않을 것 |
|---------|-------------|
| 로그인 유저 정보 (authStore) | 작품 목록 (훅이 관리) |
| 피드 필터/정렬 설정 (feedStore) | 검색 결과 (훅이 관리) |
| | 좋아요/팔로우 상태 (훅이 관리) |
| | 폼 입력 상태 (useState) |

**트레이드오프**:
- Redux DevTools 수준의 디버깅 도구 부재 → Zustand devtools 미들웨어로 부분 해결
- 대규모 앱에서 스토어 분리 컨벤션이 덜 확립됨 → stores/ 폴더에 기능별 1파일 규칙으로 대응

---

### ADR-004: Expo Router 파일 기반 라우팅

**날짜**: 2026-04-23
**상태**: 확정

**결정**: React Navigation을 직접 설정하지 않고 Expo Router v4 사용

**이유**:
- 파일 시스템 = 라우팅 구조 → 화면 추가 시 파일만 만들면 됨
- Next.js와 동일한 멘탈 모델 (동적 라우트 `[id].tsx`, 그룹 `(tabs)`)
- 딥 링크가 파일 경로에서 자동 생성 (`artwork/[id]` → `aria://artwork/123`)
- 타입 안전 네비게이션 (`router.push('/artwork/123')`)
- React Navigation을 내부적으로 사용하므로 하위 호환성 유지

**트레이드오프**:
- Expo Router 특유의 컨벤션 학습 필요 (`_layout.tsx`, 그룹 `()`, 동적 `[]`)
- 복잡한 네비게이션 커스터마이징 시 React Navigation API를 직접 사용해야 할 수 있음
- 아직 React Navigation 대비 커뮤니티 레퍼런스가 적음 → Expo 공식 문서가 충분히 상세

---

### ADR-005: NativeWind v4 (Tailwind CSS for RN)

**날짜**: 2026-04-23
**상태**: 확정

**결정**: 스타일링에 NativeWind v4 사용. StyleSheet.create 직접 사용 최소화

**이유**:
- Tailwind 문법으로 인라인 스타일링 → 별도 스타일 파일 불필요, 생산성 높음
- 디자인 토큰(색상, 간격)을 `tailwind.config.js`에 중앙 관리
- DESIGN-airbnb.md의 컬러 시스템을 Tailwind 커스텀 테마로 매핑
- 웹 개발 경험이 있다면 즉시 활용 가능

**Tailwind 커스텀 테마 (예정)**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        surface: '#1A1A1A',
        elevated: '#262626',
        border: '#333333',
        primary: '#8B5CF6',
        'primary-pressed': '#7C3AED',
        heart: '#EF4444',
      },
    },
  },
};
```

**트레이드오프**:
- NativeWind v4는 비교적 새로워 일부 RN 컴포넌트와 호환 이슈 가능 → 이슈 발생 시 해당 컴포넌트만 StyleSheet 사용
- 복잡한 애니메이션 스타일은 Reanimated + StyleSheet로 처리해야 함
- Tailwind 클래스명이 길어지면 가독성 저하 → 컴포넌트를 작게 분리하여 해결

---

### ADR-006: 다크 모드 고정

**날짜**: 2026-04-23
**상태**: 확정

**결정**: 라이트/다크 모드 토글 없이 다크 모드만 지원

**이유**:
- AI 아트 감상 시 다크 배경이 작품의 색감과 대비를 극대화
- 모드 전환 로직 제거로 개발 복잡도 감소 (모든 컴포넌트의 두 가지 색상 변형 불필요)
- Instagram, Behance 등 비주얼 중심 앱들도 다크 모드 선호 트렌드
- 앱의 브랜드 아이덴티티를 다크 모드에 고정하여 일관된 경험 제공

**트레이드오프**:
- 밝은 환경에서 가독성 저하 가능 → 충분한 텍스트 대비(WCAG AA 4.5:1 이상)로 대응
- 일부 사용자의 라이트 모드 선호를 무시 → v2에서 선택적 라이트 모드 추가 검토
- 시스템 다크 모드 설정과 무관하게 항상 다크 → `expo-system-ui`에서 status bar 스타일 light-content 고정

---

### ADR-007: 이미지 처리 전략

**날짜**: 2026-04-23
**상태**: 확정

**결정**: expo-image 라이브러리 사용, Firebase Storage에 원본 저장, 업로드 전 클라이언트에서 리사이징

**이유**:
- expo-image는 캐싱, 프로그레시브 로딩, 블러 placeholder(blurhash)를 내장
- Firebase Storage는 별도 이미지 CDN 설정 없이 URL 기반 서빙
- MVP 단계에서 서버사이드 이미지 리사이징(Cloud Functions + Sharp)은 과도한 복잡도

**이미지 파이프라인**:
```
갤러리에서 선택 (HEIC/JPEG/PNG)
  → expo-image-picker가 HEIC→JPEG 자동 변환
    → 클라이언트 리사이징 (긴 변 기준 최대 2048px)
      → JPEG 품질 80%로 압축 (약 1~3MB)
        → Firebase Storage 업로드
          → download URL을 Firestore에 저장
```

**대안 검토**:
| 대안 | 기각 이유 |
|------|-----------|
| Cloudinary | 외부 서비스 의존 + 비용 발생, Firebase만으로 충분 |
| Firebase Extensions (Resize Images) | Cloud Functions Blaze 플랜 필요, MVP에서 과잉 |
| 원본 그대로 업로드 | 10~20MB 이미지 → 대역폭·로딩 속도·비용 문제 |

**트레이드오프**:
- 클라이언트 리사이징은 디바이스 성능에 의존 → 최신 2~3년 내 기기에서 2048px 리사이징은 1초 미만
- 원본 해상도 보존 불가 (최대 2048px) → AI 생성 이미지 대부분 1024~2048px이므로 충분
- 피드 썸네일에도 2048px 이미지를 사용하게 됨 → expo-image 내장 리사이징으로 표시 크기에 맞게 다운스케일. v2에서 서버사이드 썸네일 생성 도입

---

### ADR-008: 에러 핸들링 — Result 타입 패턴

**날짜**: 2026-04-23
**상태**: 확정

**결정**: 서비스 레이어에서 예외를 throw하지 않고 `Result<T>` 타입으로 반환. Firebase 에러를 한국어 사용자 메시지로 매핑.

**이유**:
- try-catch가 훅과 화면 전체에 퍼지면 에러 처리가 일관되지 않음
- `Result<T>` 패턴으로 성공/실패를 타입 레벨에서 강제하면 에러 처리 누락 방지
- Firebase 에러 코드(`auth/email-already-in-use`)를 사용자에게 그대로 보여줄 수 없음
- `lib/errors.ts`에 에러 매핑을 중앙화하여 메시지 일관성 유지

**패턴**:
```
Service: Firebase 호출 → try-catch → Result<T> 반환
Hook: Result 분기 → 성공 시 상태 업데이트, 실패 시 에러 상태/토스트
Screen: 상태에 따라 UI 분기 (로딩/데이터/에러/빈 상태)
```

**대안 검토**:
| 대안 | 기각 이유 |
|------|-----------|
| try-catch 전파 | 에러 처리 누락 위험, 타입 레벨 강제 불가 |
| 전역 에러 바운더리만 사용 | UI 에러 바운더리는 렌더 에러만 잡음, 비동기 에러는 잡지 못함 |
| react-query/SWR | 추가 의존성. Firestore 리스너 패턴과 충돌 가능 |

**트레이드오프**:
- 모든 서비스 함수에 try-catch + Result 래핑 필요 → 보일러플레이트 증가하지만 안전성 확보
- 컴파일 타임에 모든 에러 분기를 강제하지는 못함 (TypeScript 한계) → 리뷰로 보완

---

### ADR-009: 낙관적 업데이트 전략

**날짜**: 2026-04-23
**상태**: 확정

**결정**: 좋아요, 팔로우 등 빈번한 인터랙션에 낙관적 업데이트 적용. 서버 응답 전에 UI를 먼저 변경하고, 실패 시 롤백.

**이유**:
- 좋아요/팔로우는 사용자가 즉각적 피드백을 기대하는 인터랙션
- Firestore 쓰기는 평균 200~500ms 소요 → 로딩 스피너 표시 시 UX 저하
- Instagram, Twitter 등 모든 소셜 앱이 사용하는 검증된 패턴

**적용 범위**:
| 동작 | 낙관적 업데이트 | 이유 |
|------|----------------|------|
| 좋아요 토글 | O | 빈도 높음, 롤백 비용 낮음 |
| 팔로우 토글 | O | 빈도 높음, 롤백 비용 낮음 |
| 작품 등록 | X | 이미지 업로드 시간 필요, 프로그레스 바 표시 |
| 방명록 작성 | X | 서버 저장 후 확정 표시 (스팸 방지 로직 포함) |
| 프로필 수정 | X | 닉네임 중복 검사 필요, 서버 확인 후 반영 |

**롤백 규칙**:
1. 서버 응답이 실패(`Result.success === false`)일 때만 롤백
2. 롤백 시 토스트로 사용자에게 알림
3. 디바운싱(300ms)으로 빠른 연속 탭 방지

---

### ADR-010: Firestore 비정규화 전략

**날짜**: 2026-04-23
**상태**: 확정

**결정**: 피드 카드 렌더링에 필요한 작가 정보(닉네임, 프로필 사진)를 artworks 문서에 중복 저장

**이유**:
- Firestore에는 SQL의 JOIN이 없음
- 피드 카드에 작가 닉네임을 표시하려면 artworks + users 두 컬렉션을 읽어야 함
- 20개 카드 = 20번 추가 users 읽기 → 느리고 비용 증가
- 비정규화로 1번의 artworks 쿼리만으로 카드 렌더링 가능

**비정규화 필드 목록**:
```
artworks.authorNickname      ← users.nickname
artworks.authorProfileImageUrl  ← users.profileImageUrl
guestbooks.messages.authorNickname  ← users.nickname
```

**동기화 방식**:
- 닉네임/프로필 사진 변경 시 → Firestore batch update로 해당 유저의 모든 artworks + guestbook messages 업데이트
- MVP에서는 클라이언트에서 batch update 실행 (최대 500건/배치)
- 작품 수가 500건을 초과하면 Cloud Function으로 전환

**트레이드오프**:
- 닉네임 변경 시 모든 작품의 비정규화 필드 업데이트 필요 → 닉네임 변경 빈도가 낮으므로 수용 가능
- 데이터 불일치 가능성 (batch update 중 실패) → 앱에서 표시 시 최신 users 문서를 참조하는 fallback 없음. MVP에서는 수용
- 저장 공간 증가 → 문자열 몇 개 수준이므로 무시 가능

---

### ADR-011: 검색 전략 (Firestore 제약)

**날짜**: 2026-04-23
**상태**: 확정 (MVP), v2에서 재검토

**결정**: MVP에서는 Firestore의 prefix 매칭(`>=`, `<=` 범위 쿼리)으로 검색 구현. 전문 검색 엔진은 도입하지 않음.

**이유**:
- Firestore는 전문 검색(full-text search)을 지원하지 않음
- Algolia, Typesense 등 검색 엔진 도입은 추가 비용 + 데이터 동기화 복잡도
- prefix 매칭으로 "앞부분 일치" 검색은 가능 (예: "환상" → "환상의 숲" 매칭)
- 태그 검색은 `array-contains`로 정확히 지원됨

**한계**:
- 중간/끝 단어 검색 불가: "숲" 검색 시 "환상의 숲" 미매칭
- 초성 검색 불가
- 오타 허용(fuzzy search) 불가
- 복합 키워드 검색 불가 ("환상 숲" → AND 검색 미지원)

**v2 마이그레이션 계획**:
- Algolia 도입 (Typesense는 셀프 호스팅 필요 → 초보자에게 비추)
- Firestore → Algolia 데이터 동기화: Cloud Function으로 자동화
  - `onArtworkCreated` → Algolia에 인덱스 추가
  - `onArtworkUpdated` → Algolia 인덱스 업데이트
  - `onArtworkDeleted` → Algolia 인덱스 삭제
- `services/search.ts`만 교체하면 됨 (훅/화면 변경 불필요)
- 필요 API 키: `ALGOLIA_APP_ID`, `ALGOLIA_API_KEY` (.env에 추가)
- 예상 비용: 무료 한도 월 10,000건 검색, 유료 월 $29~

> **초보자 참고**: Algolia는 별도 가입이 필요한 외부 서비스입니다.
> MVP에서는 사용하지 않으므로 가입할 필요 없습니다.
> 검색 로직을 `services/search.ts`에 격리해두면 나중에 이 파일만 교체하면 됩니다.

---

### ADR-012: 테스트 전략

**날짜**: 2026-04-23
**상태**: 확정

**결정**: Jest + React Native Testing Library + Firebase Emulator 조합. E2E 테스트는 MVP에서 제외.

**이유**:
- TDD 프로세스(CLAUDE.md CRITICAL 규칙)를 따르기 위한 최소 테스트 인프라
- lib/ (validators, formatters, errors) → 순수 함수, 단위 테스트 효과 최대
- hooks/ → service mock으로 낙관적 업데이트, 롤백 로직 검증
- services/ → Firebase Emulator로 실제 Firestore/Auth 동작 검증

**테스트하지 않는 것 (MVP)**:
| 제외 항목 | 이유 |
|-----------|------|
| E2E (Detox/Maestro) | 설정 복잡도 높음, CI 환경 필요 |
| 스냅샷 테스트 | 초기 개발 단계에서 UI 변경 잦아 유지 비용 높음 |
| 성능 테스트 | MVP 규모에서 불필요 |

**v2 도입 검토**: Maestro E2E 테스트 (핵심 플로우: 로그인 → 작품 등록 → 좋아요)

---

### ADR-013: 오프라인 전략

**날짜**: 2026-04-23
**상태**: 확정

**결정**: Firestore 내장 로컬 캐시를 활용한 읽기 전용 오프라인 지원. 오프라인 쓰기 큐는 사용하지 않음.

**이유**:
- Firestore SDK는 기본적으로 `persistentLocalCache`를 지원 → 이전에 로딩한 문서는 오프라인에서도 읽기 가능
- 오프라인 쓰기 큐(좋아요, 팔로우 등을 로컬에 저장했다가 온라인 복귀 시 전송)는 충돌 해결 로직이 복잡

**트레이드오프**:
- 오프라인에서 좋아요/팔로우 불가 → 토스트로 안내. 사용자 불편은 있지만 데이터 정합성 보장
- 오프라인에서 새 피드 로딩 불가 → 이전에 캐시된 피드만 표시 + 오프라인 배너
- 오프라인에서 검색 불가 → "인터넷 연결이 필요합니다" 안내

---

### ADR-014: 분석 도구 선택

**날짜**: 2026-04-23
**상태**: 확정

**결정**: Firebase Analytics + Firebase Crashlytics 사용. 별도 분석 도구(Amplitude, Mixpanel) 도입하지 않음.

**이유**:
- Firebase 생태계 내에서 무료로 사용 가능
- Expo와 통합 용이 (`expo-firebase-analytics`)
- PRD의 성공 지표(가입 후 등록률, DAU/MAU) 측정에 충분
- Crashlytics로 크래시 수집 + 비치명적 에러 기록 가능

**트레이드오프**:
- Firebase Analytics는 퍼널 분석, 코호트 분석 등 고급 분석에 약함 → BigQuery 내보내기로 보완 가능 (Blaze 플랜)
- Amplitude/Mixpanel 대비 리텐션 분석 기능 부족 → MVP 수준에서는 기본 지표면 충분
- 이벤트 디버깅이 Firebase Debug View에서 약간 불편 → 개발 단계에서 console 로깅 병행

---

### ADR-015: 푸시 알림 — Firebase Cloud Messaging (FCM)
- **날짜**: 2026-04-24
- **상태**: 승인 (v2 구현 예정, 아키텍처 사전 설계)
- **결정**: Firebase Cloud Messaging + expo-notifications 사용

**이유**
1. Firebase 프로젝트에 이미 포함 (추가 비용 없음)
2. Expo에서 expo-notifications로 간편하게 연동 가능
3. iOS APNs + Android FCM 모두 단일 API로 처리
4. Cloud Functions와 자연스럽게 연동 (이벤트 트리거 → 알림 전송)

**대안 검토**

| 대안 | 장점 | 단점 | 결론 |
|------|------|------|------|
| OneSignal | 관리 대시보드 편리 | 별도 서비스 의존, 무료 한도 제한 | 기각 |
| AWS SNS | 대규모 처리 가능 | AWS 계정 별도 필요, 설정 복잡 | 기각 |
| FCM (선택) | Firebase 통합, 무료, Expo 지원 | Cloud Functions 필요 (Blaze 플랜) | 채택 |

**트레이드오프**
- FCM 사용을 위해 Firebase Blaze 플랜(종량제)으로 업그레이드 필요
- Blaze 플랜도 무료 한도가 넉넉 (월 125K 알림, Cloud Functions 월 2M 호출)
- MVP에서는 Spark 플랜 유지, v2에서 Blaze로 전환

**위험 요소**
- iOS에서 APNs 인증서/키 설정 필요 (Apple Developer 계정 필수)
- 알림 권한 거부 시 대체 경험 설계 필요 (인앱 알림 목록)
