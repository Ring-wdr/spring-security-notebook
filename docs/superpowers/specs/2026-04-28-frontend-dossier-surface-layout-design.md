# Frontend Dossier Surface Layout Design

## Goal

`frontend/` 전반의 레이아웃을 `single primary surface` 중심으로 재구성해 텍스트 overflow와 과도한 카드 중첩을 줄인다. 결과물은 마케팅 카드 모음이 아니라 `Spring Security/JWT practice workspace`에 맞는 차분하고 통제된 학습용 인터페이스여야 한다.

## Problem Summary

현재 프론트엔드는 페이지마다 `panel`이 최상위 surface 역할을 하면서도, 그 내부에 다시 강한 카드형 surface가 반복된다. 특히 홈 화면은 큰 hero panel 안에 좁은 shortcut card 그리드를 넣고 있어, 열 수가 많아질수록 카드 폭이 급격히 줄고 텍스트가 불안정하게 줄바꿈된다.

이 구조는 아래 문제를 만든다.

1. 정보 위계보다 박스 위계가 먼저 보인다.
2. `panel` 안에 다시 `panel` 또는 그에 준하는 강한 카드가 들어가 시각적 중복이 크다.
3. 페이지마다 shell 규칙이 달라 홈, 학습, 프로필, 관리자 화면이 하나의 시스템처럼 보이지 않는다.
4. 텍스트가 좁은 카드 폭에 갇혀 screenshot 같은 wrapping/overflow 인상을 만든다.

## Design Context

### Users

이 화면의 사용자는 Spring Security, JWT, filter chain, protected route, role-based access 흐름을 강의와 함께 실습하는 개발자와 수강자다. 로그인, 세션 상태, 보호된 API, 관리자 전용 화면을 같은 흐름 안에서 점검해야 한다.

### Brand Personality

인터페이스는 `calm`, `disciplined`, `cold` 하게 느껴져야 한다. 장난스럽거나 마케팅적인 느낌보다, 정돈된 보안 실습 워크북이나 시스템 dossier에 가까운 인상을 목표로 한다.

### Aesthetic Direction

밝은 테마를 유지하되, 기존의 따뜻한 베이지 중심 인상은 줄이고 더 차갑고 중성적인 surface와 divider 리듬으로 재구성한다. 시각적 포인트는 큰 그림자나 중첩 카드가 아니라 `editorial hierarchy`, `thin dividers`, `compact tiles`, `context rail`에서 나온다.

## Chosen Direction

선택된 방향은 `Dossier Surface`다.

각 페이지는 하나의 큰 주 surface 안에 다음 레이어를 배치한다.

1. `Hero`
2. `Primary tracks` 또는 현재 페이지의 주요 진입/작업 링크
3. `Current page section`
4. `Context rail`

여기서 `Context rail`은 더 이상 독립된 옆 카드 컬럼이 아니라, 같은 surface 내부에서 세션 상태, route check, token timing 같은 보조 맥락을 정리하는 얇은 정보 영역이다.

## Layout Principles

### 1. One dominant surface per page

페이지 최상위에는 하나의 강한 surface만 둔다. 이 surface 안에서는 섹션 간 구분을 `divider`, `spacing rhythm`, `subheading`, `light inset area`로 해결하고, 동일한 무게의 카드 컨테이너를 반복하지 않는다.

### 2. Flatten interior hierarchy

강한 시각 무게를 가진 `panel`은 page-level container 또는 정말 필요한 guarded state 정도로 제한한다. 내부에서는 `compact tile`, `definition row`, `section list`, `soft tray`를 사용해 한 단계 낮은 강조로 정리한다.

### 3. Integrate support context

세션 상태, route guidance, token metadata, role hints는 우측 별도 카드 컬렉션으로 분리하지 않고 같은 reading flow 안에 포함한다. 사용자는 페이지의 목적과 현재 인증 상태를 한 문서 안에서 읽는 느낌을 받아야 한다.

### 4. Protect text width

좁은 고정 열에 긴 문장을 넣는 구조를 피한다. shortcut, audit, metadata, role controls는 `auto-fit/minmax` 또는 더 적은 column count를 사용하고, body copy는 넓은 measure 안에서 읽히도록 유지한다.

### 5. Consistent shell language

`home`, `learn`, `me`, `content`, `manage/content`, `manage/users`, 그리고 `GuardPanel` fallback이 모두 같은 surface 언어를 사용해야 한다. 페이지 종류가 달라도 시스템이 동일한 규칙 위에 있다는 인상이 중요하다.

## Information Architecture

### Home

- 기존 `좌 hero + 우 session snapshot` 2단 분리를 제거한다.
- 하나의 dossier surface 안에 hero, shortcut tracks, session context, demo account info를 순차적으로 배치한다.
- 현재의 `xl:grid-cols-5` shortcut row는 유지하지 않는다.
- shortcut은 2~3열 수준의 `compact action tiles` 또는 `definition-like rows`로 재구성한다.

### Learn

- 최상위에서 여러 개의 `panel`을 쌓는 대신 하나의 학습 surface로 합친다.
- `Current auth state`, `Guided route checks`, `Token lifecycle`, `Protected routes`, `Lecture audit`는 모두 section 단위로 통합한다.
- lecture audit 항목은 grid를 유지하더라도 더 가벼운 tile 언어로 바꾸고, 본문 line length를 안정적으로 확보한다.

### Me

- 프로필과 token timing을 두 개의 대등한 panel로 나누지 않는다.
- 한 surface 안에서 `identity summary`, `authorities`, `token timing`을 순차 section으로 배치한다.
- `ProfileMetric`은 강한 카드가 아니라 compact metric row 또는 light tile로 낮춘다.

### Content

- 콘텐츠 목록은 top-level surface 안의 한 section으로 배치한다.
- 각 content item은 지금보다 더 넓고 단순한 list/tile 패턴으로 구성한다.
- 목록 카드의 vertical rhythm을 줄여, "카드 갤러리"보다 "보호된 문서 목록"처럼 읽히게 한다.

### Manage Content

- editor panel과 existing items panel의 완전 분리감을 줄인다.
- 한 surface 안에서 `editing workspace`와 `content registry`를 section pair처럼 배치한다.
- item selection list는 과한 카드보다는 row/tile 패턴으로 바꾸고, 현재 선택 상태가 드러나는 방식도 카드 중첩 없이 표현한다.

### Manage Users

- 관리 화면 역시 하나의 admin dossier로 본다.
- user block은 각자 완전한 카드가 아니라, user header와 role control row 중심의 정돈된 반복 패턴으로 바꾼다.
- role toggle은 dense하지만 읽기 쉬운 정렬이 필요하며, `Saving...` 같은 상태 표시는 같은 줄의 utility text로 유지한다.

### Guard / Loading States

- `GuardPanel` fallback도 최상위 디자인 언어를 따라야 한다.
- protected route fallback이 별도 시각 체계처럼 보이면 안 된다.
- loading, access restricted, redirect wait 상태도 dossier surface의 간결한 variant처럼 보이게 한다.

## Visual System Direction

### Palette

- 기존 warm beige bias를 줄이고, cool-neutral page tone으로 이동한다.
- pure white/black는 피하고, 약간 푸른 회색 기운이 도는 background/surface/border를 사용한다.
- accent는 과도하게 화려하지 않아야 하며, 학습용 신뢰감과 차가운 정돈감을 해치지 않아야 한다.

### Typography

- display hierarchy는 더 분명하게 만든다.
- hero/title은 더 강하게, supporting copy는 더 절제된 contrast로 구분한다.
- 긴 설명 텍스트는 지나치게 좁은 박스에 넣지 않고 65~75ch 수준의 가독성을 유지한다.

### Dividers and Insets

- section 구분은 card outline보다 divider와 spacing으로 우선 해결한다.
- 필요한 경우에만 낮은 대비의 inset tray를 사용한다.
- `card-inside-card` 느낌을 만드는 두꺼운 border + shadow 조합은 피한다.

## Component/Token Implications

다음 요소는 공통화 후보로 본다.

1. page-level dossier surface
2. section header pattern
3. context rail block
4. compact action tile
5. compact data tile / metric row
6. list row for content/admin registries

구현 시 CSS 변수와 utility 조합을 정리해, 개별 페이지가 제각각 radius/background/border를 직접 가지지 않게 한다.

## Non-Goals

다음은 이번 작업의 목표가 아니다.

1. 인증 흐름, API contract, 권한 로직 변경
2. 새로운 정보 추가
3. 마케팅 랜딩 페이지처럼 대대적인 브랜드성 연출
4. dark mode 우선 재설계

## Verification Expectations

디자인 구현 후에는 다음을 확인한다.

1. 홈 화면 shortcut/summary 영역에서 긴 텍스트가 좁은 열 때문에 어색하게 깨지지 않는지
2. `learn`, `me`, `content`, `manage/*`가 같은 shell grammar를 공유하는지
3. `GuardPanel` 계열 상태가 고립된 다른 컴포넌트처럼 보이지 않는지
4. 데스크톱과 모바일에서 하나의 큰 surface가 무너지지 않는지
5. `next-browser` 기준으로 실제 페이지 인상이 선택된 `Dossier Surface` 방향과 일치하는지

## Implementation Notes

- 먼저 공통 shell/class/token을 정리한 뒤 page-by-page로 적용한다.
- 홈 화면에서 시작해, 같은 구조 언어를 `learn`, `me`, `content`, `manage/*`, `guard`로 확장한다.
- 기존 강한 `panel` 중첩은 제거하되, 접근성 및 라우트 구조는 보존한다.
