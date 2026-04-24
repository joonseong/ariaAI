# Step 4: artwork-upload

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md` — CRITICAL 규칙 (화면은 UI만, 비즈니스 로직은 hooks/에 분리)
- `/docs/ARCHITECTURE.md` — "작품 등록 — Storage 롤백 패턴", "useDiscardGuard" 섹션
- `/docs/PRD.md` — 3-4. 작품 등록 (기본 동작, 입력 검증 규칙, 프리셋 도구 태그, 업로드 플로우, 에러 케이스), 7. 화면 전환 규칙 (작품 등록 이탈 시 discard guard)
- `/docs/DESIGN.md` — 색상, 타이포그래피, 버튼 규격, 입력 필드 규격
- `/hooks/useImagePicker.ts` — 이미지 선택 훅 (Step 1에서 생성)
- `/hooks/useDiscardGuard.ts` — 이탈 방지 훅 (Step 1에서 생성)
- `/hooks/useAuth.ts` — useAuth 훅 (인증 상태)
- `/services/artworks.ts` — createArtwork (Step 0에서 생성)
- `/components/artwork/TagChip.tsx` — 태그 칩 컴포넌트 (Step 2에서 생성)
- `/components/common/Button.tsx` — 버튼 컴포넌트
- `/components/common/Input.tsx` — 입력 컴포넌트
- `/lib/validators.ts` — 입력 검증 함수
- `/lib/constants.ts` — LIMITS (IMAGES_MAX, TITLE_MAX, DESCRIPTION_MAX, TAGS_MAX)
- `/app/(tabs)/upload/index.tsx` — 현재 placeholder (교체 대상)

## 작업

### 1. `hooks/useArtworkUpload.ts`

작품 업로드 비즈니스 로직 ��:

```typescript
export function useArtworkUpload() {
  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tool, setTool] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });

  // isDirty: 이미지 선택 또는 제목 입력 상태면 true (useDiscardGuard용)
  const isDirty: boolean;

  // 태그 추가/제거
  const addTag: (tag: string) => void;
  const removeTag: (tag: string) => void;

  // 클라이언트 검증
  const validate: () => { valid: boolean; errors: Record<string, string> };

  // 업로드 실행
  const submit: (images: SelectedImage[]) => Promise<Result<string>>;

  return { title, setTitle, description, setDescription, tags, addTag, removeTag,
           tool, setTool, isDirty, isUploading, uploadProgress, validate, submit };
}
```

### 2. `app/(tabs)/upload/index.tsx` (placeholder 교체)

작품 등록 화면을 구현한다:

```typescript
export default function UploadScreen() {
  // 1. useImagePicker()로 이미지 선택 관리
  // 2. useArtworkUpload()로 폼 상태 + 업로드 관리
  // 3. useDiscardGuard(isDirty)로 이탈 방지
  // 4. useAuth()로 인증 확인 (비회원이면 로그인 유도)
}
```

화면 구조 (ScrollView):
```
[← 뒤로가기] [작품 등록 제목]

[이미지 선택 영역]
  - 선택된 이미지 썸네일 (가로 스크롤, 드래그 재정렬은 MVP 제외)
  - + 추가 버튼 (최대 5장까지)
  - 각 이미지에 X 삭제 버튼

[제목 Input (필수)]
[설명 Input (선택, multiline)]

[사용 도구 선택]
  - 프리셋 태그: Midjourney, DALL-E, Stable Diffusion, ComfyUI, Leonardo AI, Adobe Firefly, 기타
  - 탭하여 선택 (단일 선택)

[커스텀 태그 추가]
  - Input + 추가 버튼
  - 추가된 태그 칩 목록 (X로 제거 가능)
  - 최대 10개

[등록 Button (Primary, fullWidth)]
  - 업로드 중: 프로그레스 바 표시 (1/5, 2/5...)
  - 비활성 조건: 이미지 0장 또는 제목 미입력

[업로드 중 오버레이]
  - 반투명 배경 + 프로그레스 표시
  - 버튼 비활성화
```

PRD 에러 케이스 반영:
- 갤러리 접근 권한 거부 → "사진 접근 권한이 필요합니다" + 설정 열기 버튼
- 업로드 중 네트워크 끊김 → "네트워크 연결이 끊겼습니다. 다시 시도해주세요" + 재시도 버튼
- 이미지 검증 실패 → 각 규칙별 한국어 에러 메시지 (PRD 3-4 입력 검증 규칙 표 참조)
- 등록 성공 → "작품이 등록되었습니다" 토스트 + router.push(`/artwork/${artworkId}`)

## Acceptance Criteria

```bash
npx tsc --noEmit                    # 타입 에러 없음
npx expo export --platform web 2>&1 | tail -5  # 빌드 에러 없음
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - 화면에 Firebase 호출이 없는가?
   - 비즈니스 로직이 useArtworkUpload 훅에 분리되어 있는가?
   - PRD 3-4의 입력 검증 규칙이 모두 반영되었는가?
   - useDiscardGuard가 적용되었는가?
   - 각 파일이 200줄을 넘지 않는가?
3. 결과에 따라 `phases/1-artworks/index.json`의 해당 step을 업데이트한다.

## 금지사항

- 화면에서 Firebase SDK를 직접 import하지 마라. 이유: CLAUDE.md CRITICAL 규칙.
- `StyleSheet.create`를 사용하지 마라. NativeWind만 사용.
- 이미지 드래그 재정렬을 구현하지 마라. 이유: MVP 범위 밖. 삭제+재선택으로 대체.
- 카메라 촬영 기능을 구현하지 마라. 이유: PRD에서 갤러리 선택만 지원.
