# 타이포그래피 가이드라인 — Aria

> 이 문서는 `docs/DESIGN.md`의 타이포그래피 섹션을 구체화한 실전 가이드입니다.
> NativeWind v4 클래스 기준. iOS(SF Pro) / Android(Roboto) 시스템 폰트 사용.

---

## 1. 타입 스케일 (Type Scale)

Aria에서 허용된 폰트 크기는 7단계로 제한한다. 이 외의 크기를 임의 추가하지 않는다.

| 토큰 | px | NativeWind | 용도 |
|------|----|------------|------|
| `display` | 32px | `text-3xl` | 온보딩, 숫자 대형 강조 (포인트 잔액 등) |
| `title` | 24px | `text-2xl` | 화면 제목, 작품 상세 제목 |
| `heading` | 20px | `text-xl` | 작가 닉네임(프로필), 섹션 대표 헤딩 |
| `subheading` | 18px | `text-lg` | 서브 섹션 헤딩, 통계 숫자 강조 |
| `body` | 16px | `text-base` | 본문, 버튼 라벨, 카드 제목 |
| `small` | 14px | `text-sm` | 보조 설명, 상세 본문, 입력 텍스트 |
| `caption` | 13px | `text-caption` | 날짜, 좋아요 수, 태그, 법적 고지 |

> **절대 사용하지 않는 크기**: `text-4xl`(36px) 이상 — 모바일 화면에서 지나치게 크며
> 주변 요소와 대비 불균형을 만든다. 포인트 잔액(`text-4xl`) 사용은 예외이나,
> 해당 화면에서 그 숫자 하나만 허용한다.

> **`text-caption` 설정**: NativeWind/Tailwind 기본값에 13px가 없으므로 `tailwind.config.js`에
> 커스텀 토큰을 추가해야 한다.
> ```js
> // tailwind.config.js
> theme: {
>   extend: {
>     fontSize: {
>       caption: ['13px', { lineHeight: '18px' }],
>     },
>   },
> },
> ```
> 설정 전까지는 임시로 `text-[13px]` 임의값을 사용한다.

---

## 2. 굵기 체계 (Weight System)

### 2.1 허용 굵기

시스템 폰트 기반이므로 4단계만 사용한다.

| 굵기 | NativeWind | px 값 | 역할 |
|------|------------|-------|------|
| Regular | `font-normal` | 400 | 사용하지 않음 (아래 참고) |
| Medium | `font-medium` | 500 | 부드러운 강조, 보조 정보 내 강조 |
| SemiBold | `font-semibold` | 600 | 섹션 헤딩, 카드 제목, 버튼 라벨 |
| Bold | `font-bold` | 700 | 화면 제목, 핵심 숫자, 최우선 정보 |

> **`font-normal`(400)을 사용하지 않는 이유**: 다크 배경(`#0D0D0D`) 위에서 400 굵기
> 텍스트는 가독성이 크게 저하된다. Airbnb가 다크 캔버스 없이도 500을 기본 굵기로 채택한
> 이유와 같다. Aria의 최소 굵기는 **500(Medium)** 이다.
> 단, `text-caption`(13px) 캡션에 한해 400 허용 — 이미 작은 크기이므로 굵기 강조가 불필요.

### 2.2 크기 × 굵기 매트릭스

같은 계층에서 크기와 굵기는 반드시 아래 조합을 따른다. **크기가 작아질수록 굵기는 높아지거나 같아야 한다.**

| 크기 | ✅ 허용 굵기 | ❌ 금지 굵기 |
|------|------------|------------|
| `text-3xl` (32px) | `font-bold` | `font-medium`, `font-semibold` |
| `text-2xl` (24px) | `font-bold` | `font-medium`, `font-semibold` |
| `text-xl` (20px) | `font-bold`, `font-semibold` | `font-medium` |
| `text-lg` (18px) | `font-bold`, `font-semibold` | `font-medium` |
| `text-base` (16px) | `font-bold`, `font-semibold`, `font-medium` | `font-normal` |
| `text-sm` (14px) | `font-semibold`, `font-medium` | `font-bold`\* |
| `text-caption` (13px) | `font-semibold`, `font-medium`, `font-normal` | `font-bold`\* |

> \*`text-sm font-bold`와 `text-caption font-bold`: 불가능하진 않으나 뱃지, 수치 강조 등 극히 제한된 용도에만 허용.
> 일반 본문/캡션에서 금지.

---

## 3. 계층 구조와 강약 조절

### 3.1 계층 정의

텍스트는 화면 내에서 반드시 3단계 이하로 구성한다. 4단계 이상이면 어느 정보가 중요한지 독자가 혼란스러워진다.

```
Level 1 — Primary (주인공)
  크기: text-xl 이상  /  굵기: font-bold  /  색상: text-text-primary
  → 화면 당 1~2개. 작품 제목, 작가 닉네임, 포인트 잔액 등

Level 2 — Secondary (보조)
  크기: text-base ~ text-sm  /  굵기: font-semibold  /  색상: text-text-primary
  → 섹션 헤딩, 카드 제목, 버튼 라벨

Level 3 — Tertiary (맥락)
  크기: text-sm ~ text-caption  /  굵기: font-medium ~ font-normal  /  색상: text-text-secondary
  → 날짜, 태그, 설명 텍스트, 메타데이터
```

### 3.2 대비 규칙 (Contrast Rule)

인접한 두 텍스트 요소 사이에는 **크기 or 굵기 중 최소 하나**가 달라야 한다.
둘 다 같으면 계층이 없는 것과 같다.

```
✅ 올바른 대비
  "작품" (text-base font-bold text-text-primary)    ← Level 2
  "123개" (text-caption text-text-tertiary)              ← Level 3
  → 크기 차이 2단계 + 색상 차이 → 강한 대비

✅ 올바른 대비
  "생성 프롬프트" (text-base font-semibold)         ← Level 2
  "이 작품의 프롬프트입니다" (text-sm font-medium text-text-secondary)  ← Level 3
  → 크기 1단계 차이 + 굵기 1단계 차이 + 색상 차이

❌ 잘못된 대비
  "섹션 제목" (text-base font-semibold text-text-primary)
  "카드 제목" (text-base font-semibold text-text-primary)
  → 동일 크기, 동일 굵기, 동일 색상 → 계층 없음
```

### 3.3 화면별 강약 패턴

각 화면에서 Level 1 → Level 2 → Level 3 흐름이 명확해야 한다.

#### 작품 상세 (`app/artwork/[id].tsx`)
```
[L1] 작품 제목          text-2xl font-bold   text-text-primary
[L2] 작가 닉네임        text-base font-semibold text-text-primary
[L3] 설명 텍스트        text-sm              text-text-secondary
[L3] 등록 일자          text-caption              text-text-tertiary
```

#### 작가 프로필 (`app/artist/[id].tsx`)
```
[L1] 작가 닉네임        text-xl font-bold    text-text-primary
[L2] 통계 수치 (숫자)   text-lg font-bold    text-text-primary
[L3] 통계 라벨 (작품/팔로워) text-caption         text-text-secondary
[L2] 섹션 헤딩          text-base font-bold  text-text-primary
[L3] 소개 텍스트        text-sm              text-text-secondary
```

#### 피드 카드 (`components/artwork/ArtworkCard.tsx`)
```
[L2] 작품 제목          text-base font-semibold text-text-primary
[L3] 작가 닉네임        text-caption font-medium  text-text-secondary
[L3] 좋아요 수          text-caption              text-text-secondary
[L3] 등록 일자          text-caption              text-text-tertiary
```

#### 포인트 화면 (`app/profile/points.tsx`)
```
[L1] 잔액 숫자          text-4xl font-bold   text-accent-primary
[L2] 잔액 라벨          text-sm              text-text-secondary
[L3] 안내 텍스트        text-caption              text-text-tertiary
[L2] 섹션 제목          text-sm font-semibold text-text-primary
[L2] 패키지 이름        text-base font-bold  text-text-primary
[L3] 패키지 가격        text-base font-semibold text-text-primary
```

---

## 4. 동일 레벨 폰트 일관성 (Same-Level Consistency)

같은 컴포넌트 역할을 맡는 텍스트는 앱 전체에서 동일한 스타일을 유지해야 한다.

### 4.1 역할별 표준 스타일

| 역할 | 표준 클래스 | 비고 |
|------|------------|------|
| 화면 헤더 제목 | `text-base font-semibold text-text-primary` | 상단 내비게이션 바 중앙 |
| 섹션 헤딩 | `text-base font-semibold text-text-primary` | 콘텐츠 구역 구분 제목 |
| 카드 제목 | `text-base font-semibold text-text-primary` | 피드 카드, 리스트 아이템 |
| 카드 부제 | `text-caption font-medium text-text-secondary` | 작가명, 날짜 등 |
| 섹션 카운트 | `text-caption text-text-tertiary` | "N개", "N명" 등 수량 표시 |
| 통계 수치 | `text-lg font-bold text-text-primary` | 프로필 작품/팔로워/팔로잉 |
| 통계 라벨 | `text-caption text-text-secondary` | "작품", "팔로워", "팔로잉" |
| 버튼 라벨 (Primary) | `text-base font-semibold text-white` | 주요 CTA 버튼 |
| 버튼 라벨 (Secondary) | `text-sm font-medium text-text-secondary` | 서브 액션 버튼 |
| 입력 필드 텍스트 | `text-base font-normal text-text-primary` | 사용자 입력 영역 |
| 입력 placeholder | `text-base text-text-tertiary` | 입력 안내 힌트 |
| 에러 메시지 | `text-caption text-error` | 폼 인라인 에러 |
| 토스트 메시지 | `text-sm font-medium text-white` | 알림 메시지 |
| 태그 칩 | `text-caption font-medium text-text-secondary` | 도구 태그 |
| 뱃지 / 레이블 | `text-caption font-semibold text-white` | "+10% 보너스" 등 강조 뱃지 |

### 4.2 현재 코드의 일관성 문제 및 수정 방향

아래는 현재 코드베이스에서 발견된 동일 레벨 불일치 사례다.

#### ❌ 문제 1: 섹션 헤딩 굵기 불일치

```tsx
// app/artist/[id].tsx:122 — font-bold 사용
<Text className="text-base font-bold text-text-primary">작품</Text>

// app/profile/points.tsx:147 — font-semibold 사용
<Text className="text-sm font-semibold text-text-primary">P 충전 패키지</Text>
```

두 요소는 모두 "섹션을 여는 헤딩"이지만 크기와 굵기가 다르다.
→ **표준: `text-base font-semibold text-text-primary`** 로 통일

#### ❌ 문제 2: 카드 제목과 내비게이션 헤더 굵기 불일치

```tsx
// components/artwork/ArtworkCard.tsx:55 — font-medium 사용
<Text className="text-base font-medium text-text-primary" />

// app/profile/points.tsx:31 — font-bold 사용
<Text className="text-base font-bold text-text-primary">{pkg.name}</Text>
```

동일한 `text-base` 크기에서 `font-medium`과 `font-bold`가 혼용되고 있다.
ArtworkCard의 작품 제목은 카드 내 주인공이므로 `font-semibold`가 적절하다.
→ **표준: 카드 제목은 `text-base font-semibold`**

#### ✅ 수정 후 기대 모습

```tsx
// 모든 섹션 헤딩
<Text className="text-base font-semibold text-text-primary">{sectionTitle}</Text>

// 모든 카드 제목
<Text className="text-base font-semibold text-text-primary">{cardTitle}</Text>

// 카드 부제 (작가명, 날짜 등)
<Text className="text-caption font-medium text-text-secondary">{subtitle}</Text>
```

---

## 5. 한국어 가독성 (Korean Readability)

시스템 폰트(SF Pro, Roboto)는 한국어 렌더링 시 영문과 다른 시각적 무게감을 가진다.
아래 규칙은 한국어 텍스트에 특화된 보정이다.

### 5.1 행간 (Line Height)

한국어는 글자 폭이 균일하고 상하 획이 많아 영문 대비 행간을 더 넉넉하게 줘야 한다.

| 용도 | 최소 행간 | NativeWind 클래스 | 이유 |
|------|----------|-----------------|------|
| 제목 1줄 | 자동 | (생략 가능) | 단일 줄은 행간 무의미 |
| 본문 2줄+ | 20px | `leading-5` | `text-sm`(14px) 기준 최소 1.43배 |
| 긴 설명 | 24px | `leading-6` | `text-base`(16px) 기준 1.5배 |
| 캡션 | 18px | `leading-[18px]` | `text-caption`(13px) 기준 1.38배 (tailwind.config의 lineHeight와 일치) |

```tsx
// ✅ 올바른 본문 행간
<Text className="text-sm leading-5 text-text-secondary">
  작품 설명 텍스트가 두 줄 이상 이어질 때는 반드시 leading-5 이상을 적용한다.
</Text>

// ❌ 행간 없는 다중 줄 텍스트 — 한국어에서 글자들이 붙어 보임
<Text className="text-sm text-text-secondary">
  행간을 명시하지 않으면 RN 기본값(약 1.2)이 적용되어 한국어는 너무 빽빽하다.
</Text>
```

### 5.2 줄 길이 (Line Length)

모바일 화면에서 한 줄에 들어가는 한국어 글자 수는 **최대 20~22자**가 적당하다.
이를 초과하면 `numberOfLines`와 줄 바꿈으로 제어한다.

```tsx
// 카드 제목 — 최대 2줄
<Text className="text-base font-semibold text-text-primary" numberOfLines={2}>
  {artwork.title}
</Text>

// 작가 소개 — 최대 3줄
<Text className="text-sm leading-5 text-text-secondary" numberOfLines={3}>
  {artist.bio}
</Text>
```

### 5.3 자간 (Letter Spacing)

React Native에서 자간(`letterSpacing`)은 NativeWind 기본 클래스로 제어하기 어려우므로
`style` prop 직접 사용. 한국어는 자간 조정이 거의 필요 없으나 아래 경우에만 적용한다.

| 경우 | 값 | 이유 |
|------|----|------|
| 영문 대문자 약어 ("P", "CP", "IAP") | `letterSpacing: 0.5` | 좁은 자간에서 대문자 뭉침 방지 |
| 제목 레벨 (text-2xl+) | `letterSpacing: -0.3` | 큰 글씨에서 자간이 넓어 보이는 현상 보정 |
| 일반 본문/캡션 | 0 (기본) | 조정 불필요 |

### 5.4 숫자와 한국어 혼용

숫자(특히 통계, 포인트)와 한국어가 같은 줄에 혼용될 때 시각적 무게 차이가 발생한다.

```tsx
// ✅ 올바른 처리 — 숫자를 굵게, 단위를 가볍게
<View className="flex-row items-baseline gap-0.5">
  <Text className="text-lg font-bold text-text-primary">1,234</Text>
  <Text className="text-caption text-text-secondary">팔로워</Text>
</View>

// ❌ 잘못된 처리 — 같은 굵기로 혼용하면 숫자가 묻힘
<Text className="text-base text-text-primary">1,234팔로워</Text>
```

---

## 6. 다크 배경 가독성 (Dark Mode Readability)

### 6.1 색상 × 굵기 매트릭스

다크 배경(`#0D0D0D`)에서 텍스트 색상과 굵기의 조합으로 실제 가독성이 달라진다.

| 배경 | 색상 | 굵기 | WCAG 대비비 | 가독성 |
|------|------|------|------------|--------|
| `#0D0D0D` | `#F5F5F5` (primary) | 700 Bold | 약 17:1 | ✅ 매우 좋음 |
| `#0D0D0D` | `#F5F5F5` (primary) | 500 Medium | 약 17:1 | ✅ 좋음 |
| `#0D0D0D` | `#A3A3A3` (secondary) | 600 SemiBold | 약 7:1 | ✅ 좋음 |
| `#0D0D0D` | `#A3A3A3` (secondary) | 400 Regular | 약 7:1 | ⚠️ 13px↓ 작은 크기에서 불안정 |
| `#0D0D0D` | `#808080` (tertiary) | 400 Regular | 약 4.6:1 | ⚠️ 최소 허용. 13px Regular 조합은 신중하게 |
| `#1A1A1A` | `#A3A3A3` (secondary) | 400 Regular | 약 5.5:1 | ⚠️ 카드 위에서 주의 |
| `#1A1A1A` | `#808080` (tertiary) | 400 Regular | 약 3.4:1 | ❌ WCAG AA 미달 — 사용 금지 |

> **규칙**: `#1A1A1A` Surface 위에서 `text-tertiary`(`#808080`)는 사용하지 않는다.
> Surface 위에서는 `text-secondary`(`#A3A3A3`)가 최소 색상이다.

### 6.2 텍스트 위계와 색상 연동

강약 조절의 핵심은 **크기·굵기·색상** 세 축을 동시에 활용하는 것이다.

```
✅ 3축 모두 활용한 강약 — 가장 명확한 계층
  [L1] text-2xl font-bold   #F5F5F5  → 크고 + 굵고 + 밝음
  [L2] text-base font-semibold #F5F5F5 → 중간 + 반굵고 + 밝음
  [L3] text-sm font-medium  #A3A3A3  → 작고 + 보통 + 회색
  [L3] text-caption              #808080  → 가장 작고 + 가장 어두움

✅ 2축 활용한 강약 — 수용 가능
  [L2] text-base font-semibold #F5F5F5
  [L3] text-sm font-medium    #A3A3A3
  → 크기 1단계 + 색상 1단계 차이

❌ 1축만 활용 — 너무 약한 구분
  [L2] text-base font-semibold #F5F5F5
  [L3] text-base font-medium  #F5F5F5
  → 굵기만 다름. 스캔 시 계층 파악 어려움
```

---

## 7. 특수 케이스

### 7.1 강조 색상(Accent) 텍스트

`text-accent-primary`(`#8B5CF6`)는 링크, CTA 인라인 텍스트, 활성 상태 라벨에만 허용한다.

```tsx
// ✅ 허용 — 인라인 액션 링크
<Text className="text-caption text-accent-primary">포인트 충전하기</Text>

// ✅ 허용 — 포인트 잔액 (화면 내 유일한 accent 사용)
<Text className="text-4xl font-bold text-accent-primary">
  {balance.toLocaleString()}P
</Text>

// ❌ 금지 — 강조용으로 남발
<Text className="text-base text-accent-primary">섹션 제목</Text>
<Text className="text-sm text-accent-primary">설명 텍스트</Text>
```

**한 화면에 `text-accent-primary` 요소가 2개 이상 보인다면 하나를 `text-text-primary`로 교체한다.**

### 7.2 에러 / 성공 / 경고 텍스트

의미 색상은 `text-caption` 또는 `text-sm`에서만 사용. 본문 크기 이상에서 사용하지 않는다.

```tsx
// ✅ 폼 에러 메시지
<Text className="text-caption text-error">이메일 형식이 올바르지 않습니다.</Text>

// ❌ 너무 큰 에러 텍스트 — 경고음처럼 시각적 충격이 과함
<Text className="text-base font-bold text-error">에러가 발생했습니다.</Text>
```

### 7.3 뱃지 및 칩 (Badge / Chip)

작은 컨테이너 안의 텍스트는 일반 규칙을 일부 예외 적용한다.

```tsx
// 보너스 뱃지 — text-caption + font-semibold 허용
<View className="rounded-full bg-accent-primary px-2 py-0.5">
  <Text className="text-caption font-semibold text-white">+10% 보너스</Text>
</View>

// 도구 태그 칩
<View className="rounded-md bg-bg-elevated px-2 py-1">
  <Text className="text-caption font-medium text-text-secondary">Midjourney</Text>
</View>
```

### 7.4 빈 상태 / 에러 상태 메시지

화면 중앙에 표시되는 상태 메시지는 2단 구조를 유지한다.

```tsx
// 제목
<Text className="text-base font-semibold text-text-primary">
  아직 작품이 없습니다
</Text>

// 설명
<Text className="mt-2 text-center text-sm leading-5 text-text-secondary">
  첫 번째 AI 작품을 등록해보세요.
</Text>
```

---

## 8. 안티패턴 (Anti-Patterns)

개발 중 자주 발생하는 잘못된 패턴. 코드 리뷰 시 체크포인트로 사용한다.

| 안티패턴 | 문제 | 수정 |
|----------|------|------|
| `text-base font-normal` | 다크 배경에서 가독성 저하 | `text-base font-medium` 이상 |
| `text-caption font-bold` 남용 | 캡션 레벨에서 Bold는 시각적 소음 | `text-caption font-medium` 또는 `font-semibold` |
| `text-3xl font-semibold` | display 크기에 SemiBold — 무게 부족 | `text-3xl font-bold` |
| 같은 크기+굵기의 두 요소 나란히 | 계층 없음 | 한쪽을 크기 1단계 줄이거나 색상을 secondary로 |
| `#1A1A1A` surface 위 `text-tertiary` | 대비비 3.4:1 — WCAG AA 미달 | `text-secondary` 사용 |
| `text-accent-primary` 2개 이상 노출 | 강조 희석 | 하나는 `text-text-primary`로 교체 |
| 행간 없는 한국어 다중 줄 | 줄이 뭉쳐 보임 | `leading-5` 또는 `leading-6` 추가 |
| `numberOfLines` 없는 카드 제목 | 길이 초과 시 레이아웃 붕괴 | `numberOfLines={1}` 또는 `{2}` 추가 |

---

## 9. 빠른 참조 (Quick Reference)

### NativeWind 조합 치트시트

```tsx
// ── Level 1 ─────────────────────────────────────────
// 화면 제목 (작품 상세 등)
className="text-2xl font-bold text-text-primary"

// 프로필 이름
className="text-xl font-bold text-text-primary"

// 포인트 잔액 숫자
className="text-4xl font-bold text-accent-primary"

// ── Level 2 ─────────────────────────────────────────
// 화면 헤더 / 섹션 헤딩 / 카드 제목
className="text-base font-semibold text-text-primary"

// 통계 숫자 (팔로워 수 등)
className="text-lg font-bold text-text-primary"

// 버튼 라벨 (Primary CTA)
className="text-base font-semibold text-white"

// 버튼 라벨 (Secondary)
className="text-sm font-medium text-text-secondary"

// ── Level 3 ─────────────────────────────────────────
// 보조 설명 본문 (다중 줄)
className="text-sm leading-5 text-text-secondary"

// 작가명, 날짜 등 카드 부제
className="text-caption font-medium text-text-secondary"

// 통계 라벨 ("작품", "팔로워")
className="text-caption text-text-secondary"

// 날짜, 등록일 등 최하위 메타
className="text-caption text-text-tertiary"

// 안내 힌트 텍스트
className="text-caption leading-5 text-text-tertiary"

// ── 특수 ─────────────────────────────────────────────
// 인라인 액션 링크
className="text-caption text-accent-primary"

// 에러 메시지 (폼)
className="text-caption text-error"

// 뱃지 텍스트
className="text-caption font-semibold text-white"
```

---

## 10. 체크리스트 (Code Review)

PR 리뷰 시 아래 항목을 확인한다.

- [ ] `font-normal`(400)을 12px 미만에서 사용하지 않았는가?
- [ ] `text-2xl` 이상에 `font-bold`가 적용되어 있는가?
- [ ] 섹션 헤딩이 `text-base font-semibold`로 통일되어 있는가?
- [ ] 카드 제목이 `text-base font-semibold`로 통일되어 있는가?
- [ ] 다중 줄 한국어 텍스트에 `leading-5` 이상이 적용되어 있는가?
- [ ] `#1A1A1A` surface 위에서 `text-tertiary`를 사용하지 않았는가?
- [ ] 한 화면에 `text-accent-primary`가 2개 이상 노출되지 않는가?
- [ ] 인접한 두 텍스트의 크기/굵기/색상 중 최소 하나가 다른가?
- [ ] 카드 제목 등 길이 변동 요소에 `numberOfLines`가 지정되어 있는가?
