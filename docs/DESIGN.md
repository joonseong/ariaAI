# Design System — Aria

> 레퍼런스: Airbnb 패턴 기반 (docs/references/DESIGN-airbnb.md)
> 단, 색상·모드는 Aria 고유 값 사용

---

## 1. 모드

다크 모드 고정. 라이트 모드 없음 (ADR-006).

---

## 2. 색상 팔레트

### Background
| 토큰 | 값 | 용도 |
|------|------|------|
| `bg-primary` | `#0D0D0D` | 앱 전체 배경 |
| `bg-surface` | `#1A1A1A` | 카드, 모달, 바텀시트 |
| `bg-elevated` | `#262626` | 입력 필드, 검색바, 탭 바 |

### Accent
| 토큰 | 값 | 용도 |
|------|------|------|
| `accent-primary` | `#8B5CF6` | CTA 버튼, 활성 탭, 팔로우 버튼 |
| `accent-primary-hover` | `#7C3AED` | 버튼 pressed 상태 |
| `accent-heart` | `#EF4444` | 좋아요 하트 |

### Text
| 토큰 | 값 | 용도 |
|------|------|------|
| `text-primary` | `#F5F5F5` | 제목, 본문 |
| `text-secondary` | `#A3A3A3` | 부제목, 메타데이터, placeholder |
| `text-tertiary` | `#808080` | 비활성 텍스트, 힌트 |

### 텍스트 계층 사용 가이드
| 계층 | 사용 예시 | 주의 |
|------|-----------|------|
| `text-primary` | 작품 제목, 본문, 에러 메시지, 가격 등 중요 정보 | 핵심 정보는 반드시 primary |
| `text-secondary` | 작가 닉네임, 좋아요 수, 등록 시간, placeholder | 보조 정보 |
| `text-tertiary` | 비활성 탭 라벨, 비활성 버튼, 장식적 힌트 | 사용자가 반드시 읽어야 하는 정보에 사용 금지 |

### Semantic
| 토큰 | 값 | 용도 |
|------|------|------|
| `error` | `#EF4444` | 에러 메시지, 폼 검증 |
| `success` | `#22C55E` | 성공 토스트 |
| `warning` | `#F59E0B` | 경고 배너 (예: 네트워크 불안정) |
| `border` | `#2A2A2A` | 카드 테두리, 구분선 |

### 대비 규칙
- 모든 텍스트는 배경 대비 WCAG AA (4.5:1) 이상

---

## 3. 타이포그래피

시스템 폰트 기반 (iOS: SF Pro, Android: Roboto).

| 용도 | 크기 | 굵기 | 행간 |
|------|------|------|------|
| 화면 제목 | 24px | Bold (700) | 32px |
| 섹션 제목 | 18px | SemiBold (600) | 24px |
| 본문 | 14px | Regular (400) | 20px |
| 캡션 | 12px | Regular (400) | 16px |
| 작품 타이틀 | 16px | Medium (500) | 22px |

---

## 4. 간격 (Spacing)

Tailwind 기본 4px 단위: `p-1` = 4px, `p-2` = 8px, `p-4` = 16px, `p-6` = 24px

| 용도 | 값 |
|------|------|
| 화면 좌우 패딩 | 16px (`px-4`) |
| 카드 내부 패딩 | 12px (`p-3`) |
| 카드 간 간격 | 12px (`gap-3`) |
| 섹션 간 간격 | 24px (`gap-6`) |

---

## 5. 이미지 비율

| 용도 | 비율 |
|------|------|
| 피드 카드 | 4:3 |
| 포트폴리오 그리드 | 1:1 |
| 작품 상세 | 원본 비율 유지 |
| 프로필 아바타 | 1:1 원형 |

---

## 6. 컴포넌트 규격

### 버튼
- Primary: `bg-accent-primary`, 높이 48px, 라운드 12px
- Secondary: `border border-border`, 높이 40px, 라운드 8px
- Icon: 40x40px 원형, `bg-bg-elevated`

### 카드
- 라운드: 12px
- 배경: `bg-surface`
- 그림자 없음 (다크 모드에서 그림자는 비효과적)

### 하단 탭 바
- 배경: `bg-bg-elevated`
- 활성 아이콘: `accent-primary`
- 비활성 아이콘: `text-tertiary`

### 애니메이션
- 좋아요 하트: scale 바운스 (1.0 → 1.3 → 1.0, 300ms)
- 화면 전환: 슬라이드 (native stack default)
- 로딩: 스켈레톤 shimmer
