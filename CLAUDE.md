# 프로젝트: Aria

## 기술 스택
- React Native (Expo SDK 52+, managed workflow, Expo Router v4)
- TypeScript strict mode
- NativeWind v4 (Tailwind CSS for RN)
- Zustand (글로벌 클라이언트 상태 관리)
- Firebase (Auth, Firestore, Storage, Analytics, Crashlytics)
- expo-image (이미지 캐싱, 프로그레시브 로딩, blurhash)

## 아키텍처 규칙
- CRITICAL: 모든 Firebase 호출은 services/ 폴더의 래퍼 함수를 통해서만 수행. 컴포넌트·화면에서 Firebase SDK를 직접 import하지 말 것
- CRITICAL: 화면(Screen)은 UI 렌더링만 담당. 비즈니스 로직은 반드시 hooks/에 분리할 것 (Screen → Hook → Service → Firebase)
- CRITICAL: .env 파일과 Firebase 설정 키를 코드에 하드코딩하지 말 것. 반드시 환경 변수(EXPO_PUBLIC_*) 사용
- CRITICAL: 서비스 레이어에서 예외를 throw하지 말 것. Result<T> 타입으로 성공/실패를 반환하고, 훅에서 분기 처리할 것
- 컴포넌트는 components/ 폴더에, 타입은 types/ 폴더에 분리
- 한 컴포넌트 파일은 200줄을 넘기지 않는다. 넘기면 분리
- Firebase 에러는 lib/errors.ts의 mapFirebaseError()로 한국어 사용자 메시지로 변환

## 개발 프로세스
- CRITICAL: 새 기능 구현 시 반드시 테스트를 먼저 작성하고, 테스트가 통과하는 구현을 작성할 것 (TDD)
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)

## 명령어
npx expo start   # 개발 서버
npx expo export  # 프로덕션 빌드
npx eslint .     # ESLint
npx jest         # 테스트
