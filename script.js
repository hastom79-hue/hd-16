/* ============================================================
   GMES 문제해결과제(PDCA) 인터랙티브 목업 v2
   화면: 01 부서별 메인 / 02 조회(List) / 03 중요과제 대시보드
   모달: 등록 Part 잠금 + 진행 Part(P/D/C/A 파일첨부·검토) + 사후검증
   ============================================================ */

const STAGES = ["P", "D", "C", "A"];
const STAGE_LABEL = { P: "Plan", D: "Do", C: "Check", A: "Act" };
const CURRENT_USER = { name: "이향기", team: "HDPS파트", dept: "생산기술부" };
const NUM_REGEX = /^\d+(\.\d+)?$/;
const HIGH_GRADES = ["S+", "S", "A"];
function gradeSlug(grade){
  return { "S+": "splus", "S": "s", "A": "a", "B": "b", "C": "c" }[grade] || "";
}
function isHighGrade(grade){ return HIGH_GRADES.includes(grade); }

let CONFIG = { noti: 3, esc: 60, post: 3 };
let activeTaskId = null;
let lastViewedTaskId = null;
let taskCounter = 43;
let fileTargetCtx = null; // 'P' | 'DCA'
let favOnly = false;

let TASKS = [
  {
    id: "T-2026-0031", dept: "생산운영부", team: "설비관리팀",
    title: "도킹 크레인 고장 예방 대책 수립",
    user: "구본무", resource: "생산비가동이슈", improve: "안전성 개선",
    category: "important", sqdc: "S",
    phenomenon: "횡행 모터 및 감속기 반복 고장", current: "재공장비 27건 이상", target: "32 DPTU 감소", effect: "라인 비가동 손실 예방",
    actFrom: "2026-02-12", actTo: "2026-05-12",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2026-02-14", D: "2026-02-28", C: "2026-03-10", A: "2026-03-20" },
    filesP: [{ name: "P단계_원인분석.xlsx", date: "2026-02-14" }],
    filesDCA: [{ name: "개선대책서_v2.pptx", date: "2026-03-18" }],
    review: { C: "승인", A: "승인" },
    result: "32.0",
    postcheck: ["2026-04-20", "2026-05-20", "2026-06-20"], completeYN: "Y",
    parentId: null, regenOf: null, favorite: true,
    regDate: "2026-02-12"
  },
  {
    id: "T-2026-0042", dept: "생산품질부", team: "라인품질팀",
    title: "요소수 Tank 센서 불량 산발 발생 개선",
    user: "정민아", resource: "정기과제접수(반기별)", improve: "품질 개선",
    category: "normal", sqdc: "Q",
    phenomenon: "안돈 발생건수 6건 (최근 2주)", current: "안돈 발생건수 6건(2주)", target: "안돈/필드 문제발생 0건", effect: "필드 클레임 예방",
    actFrom: "2026-03-02", actTo: "2026-06-02",
    registered: true, stageIndex: 2, stageStatus: "in_progress",
    stageDates: { P: "2026-03-05", D: "2026-03-15", C: null, A: null },
    filesP: [{ name: "요소수센서_현상사진.zip", date: "2026-03-05" }],
    filesDCA: [],
    review: { C: "", A: "" },
    result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: null, regenOf: null, favorite: false,
    regDate: "2026-03-02"
  },
  {
    id: "T-2026-0018", dept: "생산품질부", team: "최종검사팀",
    title: "OEM 검사팀 자전거 사전점검 지연 개선",
    user: "박태준", resource: "모듈 미해결과제", improve: "납기 개선",
    category: "normal", sqdc: "D",
    phenomenon: "사전점검 지연으로 재공장비 누적", current: "발생 0건 목표 대비 미달", target: "재공장비 27건 이상 → 0건", effect: "출고 리드타임 단축",
    actFrom: "2025-11-04", actTo: "2026-02-04",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2025-11-06", D: "2025-11-20", C: "2025-12-05", A: "2025-12-18" },
    filesP: [{ name: "사전점검_체크리스트.xlsx", date: "2025-11-06" }],
    filesDCA: [{ name: "개선전후_비교.pptx", date: "2025-12-15" }],
    review: { C: "승인", A: "승인" },
    result: "0",
    postcheck: ["2026-01-18", "2026-02-18", "2026-03-18"], completeYN: "Y",
    parentId: null, regenOf: null, favorite: false,
    regDate: "2025-11-04"
  },
  {
    id: "T-2026-0009", dept: "생산운영부", team: "생산계획과",
    title: "글로벌 자재 입고 지연 대응 프로세스 표준화",
    user: "최다인", resource: "정기과제접수(반기별)", improve: "납기 개선",
    category: "important", sqdc: "D",
    phenomenon: "해외 협력사 자재 입고 리드타임 편차", current: "입고 지연 평균 4.2일", target: "입고 지연 평균 1일 이내", effect: "생산계획 변경 최소화",
    actFrom: "2025-09-01", actTo: "2025-12-01",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2025-09-03", D: "2025-09-20", C: "2025-10-10", A: "2025-10-25" },
    filesP: [{ name: "입고데이터_분석.xlsx", date: "2025-09-03" }],
    filesDCA: [{ name: "표준프로세스_매뉴얼.docx", date: "2025-10-22" }],
    review: { C: "승인", A: "승인" },
    result: "0.9",
    postcheck: ["2025-11-25", "2025-12-25", "2026-01-25"], completeYN: "Y",
    parentId: null, regenOf: null, favorite: true,
    regDate: "2025-09-01"
  },
  {
    id: "T-2026-0005", dept: "생산기술부", team: "제작기술과",
    title: "제작공정 스팟용접 품질 산포 저감",
    user: "이향기", resource: "생산비가동이슈", improve: "품질 개선",
    category: "important", sqdc: "Q",
    phenomenon: "용접 강도 산포로 인한 재작업 발생", current: "재작업률 8.4%", target: "재작업률 2% 이하", effect: "재작업 공수 절감",
    actFrom: "2025-12-01", actTo: "2026-01-20",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2025-12-03", D: "2025-12-15", C: "2025-12-29", A: "2026-01-12" },
    filesP: [],
    filesDCA: [{ name: "용접조건_최적화보고서.pdf", date: "2026-01-10" }],
    review: { C: "승인", A: "승인" },
    result: "9.1",
    postcheck: ["2026-02-12", "2026-03-12", "2026-04-12"], completeYN: "N",
    parentId: null, regenOf: null, favorite: false,
    regDate: "2025-12-01"
  },
  {
    id: "T-2026-0006", dept: "생산기술부", team: "제작기술과",
    title: "제작공정 스팟용접 품질 산포 저감 (재발생 대응)",
    user: "이향기", resource: "모듈 미해결과제", improve: "품질 개선",
    category: "important", sqdc: "Q",
    phenomenon: "1차 개선 후에도 재작업률 목표 미달 재발", current: "재작업률 9.1%", target: "재작업률 2% 이하", effect: "재작업 공수 절감",
    actFrom: "2026-04-13", actTo: "2026-06-13",
    registered: true, stageIndex: 1, stageStatus: "in_progress",
    stageDates: { P: "2026-04-15", D: null, C: null, A: null },
    filesP: [{ name: "재발원인_추가분석.xlsx", date: "2026-04-15" }],
    filesDCA: [],
    review: { C: "", A: "" },
    result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: "T-2026-0005", regenOf: "T-2026-0005", favorite: false,
    regDate: "2026-04-13"
  },
  {
    id: "T-2026-0002", dept: "자재운영부", team: "내자운영팀",
    title: "포장 자재 파손율 저감 활동",
    user: "한지수", resource: "정기과제접수(반기별)", improve: "품질 개선",
    category: "normal", sqdc: "Q",
    phenomenon: "포장재 파손으로 인한 재포장 발생", current: "파손율 4.8%", target: "파손율 1% 이하", effect: "재포장 공수 절감",
    actFrom: "2025-07-10", actTo: "2025-09-10",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2025-07-12", D: "2025-07-25", C: "2025-08-08", A: "2025-08-22" },
    filesP: [{ name: "파손유형_분석.xlsx", date: "2025-07-12" }],
    filesDCA: [{ name: "포장재_개선안.pptx", date: "2025-08-20" }],
    review: { C: "승인", A: "승인" },
    result: "0.9",
    postcheck: ["2025-09-22", "2025-10-22", "2025-11-22"], completeYN: "Y",
    parentId: null, regenOf: null, favorite: false,
    regDate: "2025-07-10"
  },
  {
    id: "T-2026-0003", dept: "자재운영부", team: "외자운영팀",
    title: "해외 부품 통관 지연 대응 표준화",
    user: "윤성민", resource: "생산비가동이슈", improve: "납기 개선",
    category: "important", sqdc: "D",
    phenomenon: "통관 서류 미비로 인한 입고 지연", current: "통관 지연 평균 3.5일", target: "통관 지연 평균 1일 이내", effect: "생산계획 변경 최소화",
    actFrom: "2025-08-05", actTo: "2025-10-05",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2025-08-07", D: "2025-08-20", C: "2025-09-05", A: "2025-09-20" },
    filesP: [{ name: "통관프로세스_현황.xlsx", date: "2025-08-07" }],
    filesDCA: [{ name: "통관체크리스트_v1.docx", date: "2025-09-18" }],
    review: { C: "승인", A: "승인" },
    result: "0.8",
    postcheck: ["2025-10-20", "2025-11-20", "2025-12-20"], completeYN: "Y",
    parentId: null, regenOf: null, favorite: false,
    regDate: "2025-08-05"
  },
  {
    id: "T-2026-0007", dept: "생산관리부", team: "기준정보과",
    title: "BOM 데이터 정합성 오류 개선",
    user: "장서윤", resource: "모듈 미해결과제", improve: "품질 개선",
    category: "normal", sqdc: "Q",
    phenomenon: "BOM 오류로 인한 자재 불일치 발생", current: "BOM 오류건수 월 14건", target: "BOM 오류건수 월 3건 이하", effect: "자재 불일치 클레임 감소",
    actFrom: "2025-09-12", actTo: "2025-11-12",
    registered: true, stageIndex: 1, stageStatus: "in_progress",
    stageDates: { P: "2025-09-15", D: null, C: null, A: null },
    filesP: [{ name: "BOM오류_현황집계.xlsx", date: "2025-09-15" }],
    filesDCA: [],
    review: { C: "", A: "" },
    result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: null, regenOf: null, favorite: false,
    regDate: "2025-09-12"
  },
  {
    id: "T-2026-0010", dept: "생산관리부", team: "오더데스크과",
    title: "수주 변경 프로세스 리드타임 단축",
    user: "김도현", resource: "정기과제접수(반기별)", improve: "납기 개선",
    category: "important", sqdc: "D",
    phenomenon: "수주 변경 승인 지연으로 생산계획 재조정 빈발", current: "변경 승인 리드타임 2.8일", target: "변경 승인 리드타임 1일 이내", effect: "생산계획 안정성 향상",
    actFrom: "2025-10-01", actTo: "2025-12-01",
    registered: true, stageIndex: 2, stageStatus: "in_progress",
    stageDates: { P: "2025-10-04", D: "2025-10-18", C: null, A: null },
    filesP: [{ name: "수주변경_프로세스맵.pptx", date: "2025-10-04" }],
    filesDCA: [],
    review: { C: "", A: "" },
    result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: null, regenOf: null, favorite: false,
    regDate: "2025-10-01"
  },
  {
    id: "T-2026-0013", dept: "생산품질부", team: "부품품질팀",
    title: "협력사 납품 불량률 저감",
    user: "오세훈", resource: "생산비가동이슈", improve: "품질 개선",
    category: "important", sqdc: "Q",
    phenomenon: "협력사 납품 부품 불량 산발 발생", current: "납품 불량률 2.1%", target: "납품 불량률 0.5% 이하", effect: "라인 정지 리스크 감소",
    actFrom: "2025-11-15", actTo: "2026-01-15",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2025-11-17", D: "2025-11-30", C: "2025-12-15", A: "2026-01-05" },
    filesP: [{ name: "협력사불량_이력.xlsx", date: "2025-11-17" }],
    filesDCA: [{ name: "협력사품질개선_협약서.pdf", date: "2026-01-03" }],
    review: { C: "승인", A: "승인" },
    result: "0.4",
    postcheck: ["2026-02-05", "2026-03-05", "2026-04-05"], completeYN: "Y",
    parentId: null, regenOf: null, favorite: true,
    regDate: "2025-11-15"
  },
  {
    id: "T-2026-0015", dept: "생산품질부", team: "트러블슈팅팀",
    title: "설비 돌발정지 MTTR 단축",
    user: "정하윤", resource: "생산비가동이슈", improve: "납기 개선",
    category: "important", sqdc: "D",
    phenomenon: "돌발정지 시 원인파악 지연으로 복구시간 증가", current: "평균 MTTR 92분", target: "평균 MTTR 40분 이하", effect: "라인 가동률 향상",
    actFrom: "2025-12-02", actTo: "2026-02-02",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2025-12-04", D: "2025-12-18", C: "2026-01-05", A: "2026-01-20" },
    filesP: [{ name: "돌발정지_로그분석.xlsx", date: "2025-12-04" }],
    filesDCA: [{ name: "MTTR개선_대책서.pptx", date: "2026-01-18" }],
    review: { C: "승인", A: "승인" },
    result: "78",
    postcheck: ["2026-02-20", "2026-03-20", "2026-04-20"], completeYN: "N",
    parentId: null, regenOf: null, favorite: false,
    regDate: "2025-12-02"
  },
  {
    id: "T-2026-0016", dept: "생산품질부", team: "트러블슈팅팀",
    title: "설비 돌발정지 MTTR 단축 (재발생 대응)",
    user: "정하윤", resource: "모듈 미해결과제", improve: "납기 개선",
    category: "important", sqdc: "D",
    phenomenon: "1차 개선 후에도 MTTR 목표 미달 재발", current: "평균 MTTR 78분", target: "평균 MTTR 40분 이하", effect: "라인 가동률 향상",
    actFrom: "2026-04-21", actTo: "2026-06-21",
    registered: true, stageIndex: 0, stageStatus: "in_progress",
    stageDates: { P: null, D: null, C: null, A: null },
    filesP: [],
    filesDCA: [],
    review: { C: "", A: "" },
    result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: "T-2026-0015", regenOf: "T-2026-0015", favorite: false,
    regDate: "2026-04-21"
  },
  {
    id: "T-2026-0017", dept: "생산운영부", team: "글로벌운영팀",
    title: "생산계획 변경 승인 리드타임 단축",
    user: "최다인", resource: "정기과제접수(반기별)", improve: "납기 개선",
    category: "normal", sqdc: "D",
    phenomenon: "생산계획 변경 시 다단계 승인으로 지연", current: "승인 리드타임 2.2일", target: "승인 리드타임 0.5일 이내", effect: "생산 유연성 확보",
    actFrom: "2026-01-20", actTo: "2026-03-20",
    registered: true, stageIndex: 0, stageStatus: "in_progress",
    stageDates: { P: null, D: null, C: null, A: null },
    filesP: [],
    filesDCA: [],
    review: { C: "", A: "" },
    result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: null, regenOf: null, favorite: false,
    regDate: "2026-01-20"
  },
  {
    id: "T-2026-0020", dept: "생산기술부", team: "가공부",
    title: "가공 치수 불량 재발방지",
    user: "서준혁", resource: "생산비가동이슈", improve: "품질 개선",
    category: "important", sqdc: "Q",
    phenomenon: "가공 치수 산포로 인한 불량 재발", current: "치수불량률 3.6%", target: "치수불량률 1% 이하", effect: "재작업 공수 절감",
    actFrom: "2026-02-05", actTo: "2026-04-05",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2026-02-07", D: "2026-02-20", C: "2026-03-08", A: "2026-03-22" },
    filesP: [{ name: "치수불량_공정분석.xlsx", date: "2026-02-07" }],
    filesDCA: [{ name: "가공조건_표준화서.pdf", date: "2026-03-20" }],
    review: { C: "승인", A: "승인" },
    result: "0.9",
    postcheck: ["2026-04-22", "2026-05-22", "2026-06-22"], completeYN: "Y",
    parentId: null, regenOf: null, favorite: true,
    regDate: "2026-02-05"
  },
  {
    id: "T-2026-0023", dept: "생산기술부", team: "조립부",
    title: "조립 라인 밸런싱 개선",
    user: "이하늘", resource: "정기과제접수(반기별)", improve: "납기 개선",
    category: "normal", sqdc: "D",
    phenomenon: "공정간 부하 불균형으로 병목 발생", current: "라인 가동률 76%", target: "라인 가동률 90% 이상", effect: "생산량 증대",
    actFrom: "2026-03-10", actTo: "2026-05-10",
    registered: true, stageIndex: 1, stageStatus: "in_progress",
    stageDates: { P: "2026-03-12", D: null, C: null, A: null },
    filesP: [{ name: "라인밸런싱_현황.xlsx", date: "2026-03-12" }],
    filesDCA: [],
    review: { C: "", A: "" },
    result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: null, regenOf: null, favorite: false,
    regDate: "2026-03-10"
  },
  {
    id: "T-2026-0026", dept: "생산품질부", team: "최종검사팀",
    title: "출하검사 샘플링 기준 표준화",
    user: "박태준", resource: "생산비가동이슈", improve: "품질 개선",
    category: "normal", sqdc: "Q",
    phenomenon: "검사자별 샘플링 기준 상이로 판정 편차 발생", current: "판정 편차율 12%", target: "판정 편차율 3% 이하", effect: "출하품질 신뢰도 향상",
    actFrom: "2026-05-01", actTo: "2026-07-01",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2026-05-03", D: "2026-05-16", C: "2026-06-01", A: "2026-06-15" },
    filesP: [{ name: "샘플링기준_현황.xlsx", date: "2026-05-03" }],
    filesDCA: [{ name: "샘플링기준_표준서.pdf", date: "2026-06-12" }],
    review: { C: "승인", A: "승인" },
    result: "4",
    postcheck: ["2026-07-15", null, null], completeYN: null,
    parentId: null, regenOf: null, favorite: false,
    regDate: "2026-05-01"
  },
  {
    id: "T-2026-0028", dept: "생산관리부", team: "오더데스크과",
    title: "긴급수주 대응 리드타임 단축",
    user: "김도현", resource: "생산비가동이슈", improve: "납기 개선",
    category: "important", sqdc: "D",
    phenomenon: "긴급수주 발생 시 공정 재배치 지연으로 납기 임박", current: "긴급수주 대응 리드타임 5.2일", target: "긴급수주 대응 리드타임 2일 이내", effect: "긴급 대응력 강화",
    actFrom: "2025-10-15", actTo: "2025-12-15",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2025-10-17", D: "2025-10-30", C: "2025-11-14", A: "2025-11-28" },
    filesP: [{ name: "긴급수주_대응현황.xlsx", date: "2025-10-17" }],
    filesDCA: [{ name: "리드타임_개선안.pptx", date: "2025-11-26" }],
    review: { C: "승인", A: "승인" },
    result: "3.8",
    postcheck: ["2025-12-28", "2026-01-28", "2026-02-28"], completeYN: "N",
    parentId: null, regenOf: null, favorite: false,
    regDate: "2025-10-15"
  },
  {
    id: "T-2026-0029", dept: "생산관리부", team: "오더데스크과",
    title: "긴급수주 대응 리드타임 단축 (재발생 대응)",
    user: "김도현", resource: "모듈 미해결과제", improve: "납기 개선",
    category: "important", sqdc: "D",
    phenomenon: "1차 개선 후에도 목표 리드타임 미달 재발", current: "긴급수주 대응 리드타임 3.8일", target: "긴급수주 대응 리드타임 2일 이내", effect: "긴급 대응력 강화",
    actFrom: "2026-03-01", actTo: "2026-05-01",
    registered: true, stageIndex: 2, stageStatus: "in_progress",
    stageDates: { P: "2026-03-03", D: "2026-03-18", C: null, A: null },
    filesP: [{ name: "재발원인_공정재분석.xlsx", date: "2026-03-03" }],
    filesDCA: [],
    review: { C: "", A: "" },
    result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: "T-2026-0028", regenOf: "T-2026-0028", favorite: false,
    regDate: "2026-03-01"
  },
  {
    id: "T-2026-0032", dept: "생산운영부", team: "설비관리팀",
    title: "노후 컨베이어 소음 개선",
    user: "구본무", resource: "생산비가동이슈", improve: "안전성 개선",
    category: "normal", sqdc: "S",
    phenomenon: "컨베이어 베어링 마모로 인한 소음 증가", current: "소음 82dB", target: "소음 70dB 이하", effect: "작업환경 개선",
    actFrom: "2026-04-01", actTo: "2026-06-01",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2026-04-03", D: "2026-04-16", C: "2026-05-02", A: "2026-05-18" },
    filesP: [{ name: "소음측정_결과.xlsx", date: "2026-04-03" }],
    filesDCA: [{ name: "베어링교체_대책서.pdf", date: "2026-05-16" }],
    review: { C: "승인", A: "승인" },
    result: "71",
    postcheck: ["2026-06-18", null, null], completeYN: null,
    parentId: null, regenOf: null, favorite: false,
    regDate: "2026-04-01"
  },
  {
    id: "T-2026-0034", dept: "자재운영부", team: "외자운영팀",
    title: "수입 원자재 검수 리드타임 단축",
    user: "윤성민", resource: "정기과제접수(반기별)", improve: "납기 개선",
    category: "normal", sqdc: "D",
    phenomenon: "검수 서류 대조 방식이 수작업으로 지연 발생", current: "검수 리드타임 1.8일", target: "검수 리드타임 0.5일 이내", effect: "입고 처리 속도 향상",
    actFrom: "2026-03-15", actTo: "2026-05-15",
    registered: true, stageIndex: 3, stageStatus: "done_all",
    stageDates: { P: "2026-03-17", D: "2026-03-30", C: "2026-04-15", A: "2026-04-30" },
    filesP: [{ name: "검수프로세스_현황.xlsx", date: "2026-03-17" }],
    filesDCA: [{ name: "검수전산화_제안서.pptx", date: "2026-04-28" }],
    review: { C: "승인", A: "승인" },
    result: "0.6",
    postcheck: ["2026-05-30", "2026-06-30", "2026-07-30"], completeYN: null,
    parentId: null, regenOf: null, favorite: false,
    regDate: "2026-03-15"
  },
];

/* ---------------- 소그룹활동 데이터 ---------------- */
let sgCounter = 17;
let SG_TASKS = [
  {
    id: "SG-2026-0007", dept: "생산품질부", team: "라인품질팀", user: "정민아",
    improve: "품질 개선", sqdc: "Q",
    title: "라인 안돈 반복 발생 원인분석 및 개선활동 (2026 1분기)",
    phenomenon: "동일 설비에서 안돈(Andon) 반복 발생", current: "안돈 발생건수 12건(분기)", target: "안돈 발생건수 3건 이하",
    files: [{ name: "안돈원인분석_보고서.xlsx", date: "2026-02-10" }],
    resultLevel: "88", doneYN: true, doneDate: "2026-03-20",
    eval1: { grade: "S", date: "2026-03-22", checked: 6 },
    eval2: { grade: "S+", date: "2026-03-28", checked: 5 },
    verifyDesc: "안돈 발생건수 9건 감소, 라인 정지시간 단축 확인", verifyMh: "8M/H, 320,000원",
    stdTimeApplied: true, stdTimeDate: "2026-03-29",
    horizontalDeployments: [
      { workplace: "조립2라인", appliedDate: "2026-04-10" },
      { workplace: "품질검사3라인", appliedDate: "2026-05-02" }
    ],
    favorite: false, regDate: "2026-02-08"
  },
  {
    id: "SG-2026-0011", dept: "생산운영부", team: "설비관리팀", user: "구본무",
    improve: "안전성 개선", sqdc: "S",
    title: "크레인 주변 안전펜스 정비 소그룹활동",
    phenomenon: "안전펜스 노후로 인한 끼임 위험", current: "안전점검 미흡 3건", target: "안전점검 미흡 0건",
    files: [],
    resultLevel: "", doneYN: false, doneDate: null,
    eval1: { grade: "", date: "", checked: 0 },
    eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "", verifyMh: "",
    stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [],
    favorite: false, regDate: "2026-03-15"
  },
  {
    id: "SG-2026-0004", dept: "생산기술부", team: "조립부", user: "이향기",
    improve: "원가 개선", sqdc: "C",
    title: "제작공정 부자재 재고 절감 활동",
    phenomenon: "부자재 과다 발주로 재고 비용 증가", current: "재고금액 1,200만원", target: "재고금액 800만원 이하",
    files: [{ name: "재고분석_전후.xlsx", date: "2026-01-12" }],
    resultLevel: "62", doneYN: true, doneDate: "2026-01-30",
    eval1: { grade: "B", date: "2026-02-02", checked: 4 },
    eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "", verifyMh: "",
    stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [],
    favorite: false, regDate: "2026-01-05"
  },
  {
    id: "SG-2026-0009", dept: "자재운영부", team: "내자운영팀", user: "최다인",
    improve: "납기 개선", sqdc: "D",
    title: "자재 입고 검수 체크리스트 표준화 활동",
    phenomenon: "검수 누락으로 인한 재작업 발생", current: "검수 누락률 6%", target: "검수 누락률 1% 이하",
    files: [{ name: "체크리스트_v1.pdf", date: "2025-12-20" }],
    resultLevel: "91", doneYN: true, doneDate: "2026-01-15",
    eval1: { grade: "A", date: "2026-01-18", checked: 5 },
    eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "검수 누락률 5%p 개선, 재작업 공수 절감", verifyMh: "5M/H, 210,000원",
    stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [
      { workplace: "자재2팀", appliedDate: "2026-02-20" }
    ],
    favorite: false, regDate: "2025-12-18"
  },
  {
    id: "SG-2026-0002", dept: "생산운영부", team: "설비관리팀", user: "장서윤",
    improve: "품질 개선", sqdc: "Q",
    title: "설비 가동일지 기록 오류 감소 활동",
    phenomenon: "수기 기록 방식으로 인한 가동일지 오류 반복", current: "기록 오류 월 9건", target: "기록 오류 월 2건 이하",
    files: [{ name: "기록오류_유형표.xlsx", date: "2025-07-20" }],
    resultLevel: "70", doneYN: true, doneDate: "2025-08-25",
    eval1: { grade: "B", date: "2025-08-28", checked: 4 },
    eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "", verifyMh: "",
    stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [],
    favorite: false, regDate: "2025-08-01"
  },
  {
    id: "SG-2026-0003", dept: "생산품질부", team: "부품품질팀", user: "김도현",
    improve: "납기 개선", sqdc: "D",
    title: "품질 클레임 현장 대응시간 단축 소그룹",
    phenomenon: "클레임 접수 후 현장 담당자 배정 지연", current: "평균 대응시간 14시간", target: "평균 대응시간 4시간 이내",
    files: [{ name: "클레임대응_프로세스.pptx", date: "2025-09-08" }],
    resultLevel: "95", doneYN: true, doneDate: "2025-09-28",
    eval1: { grade: "A", date: "2025-09-30", checked: 6 },
    eval2: { grade: "S", date: "2025-10-06", checked: 5 },
    verifyDesc: "클레임 대응시간 10시간 단축, 현장 만족도 상승", verifyMh: "6M/H, 260,000원",
    stdTimeApplied: true, stdTimeDate: "2025-10-08",
    horizontalDeployments: [
      { workplace: "부품검사2라인", appliedDate: "2025-11-10" }
    ],
    favorite: true, regDate: "2025-09-05"
  },
  {
    id: "SG-2026-0005", dept: "자재운영부", team: "내자운영팀", user: "한지수",
    improve: "품질 개선", sqdc: "Q",
    title: "자재 불출 오류 저감 소그룹",
    phenomenon: "동일 규격 자재 혼재로 오불출 발생", current: "오불출 건수 월 7건", target: "오불출 건수 월 1건 이하",
    files: [],
    resultLevel: "55", doneYN: true, doneDate: "2025-11-05",
    eval1: { grade: "C", date: "2025-11-08", checked: 3 },
    eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "", verifyMh: "",
    stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [],
    favorite: false, regDate: "2025-10-10"
  },
  {
    id: "SG-2026-0006", dept: "자재운영부", team: "내자운영팀", user: "윤성민",
    improve: "원가 개선", sqdc: "C",
    title: "포장 자재 재사용률 향상 활동",
    phenomenon: "1회성 포장재 폐기 비용 증가", current: "재사용률 22%", target: "재사용률 60% 이상",
    files: [{ name: "재사용포장_설계안.pdf", date: "2025-11-25" }],
    resultLevel: "93", doneYN: true, doneDate: "2025-12-10",
    eval1: { grade: "S+", date: "2025-12-12", checked: 6 },
    eval2: { grade: "S", date: "2025-12-18", checked: 6 },
    verifyDesc: "포장재 비용 32% 절감, 재사용률 68% 달성", verifyMh: "10M/H, 410,000원",
    stdTimeApplied: true, stdTimeDate: "2025-12-19",
    horizontalDeployments: [
      { workplace: "포장2라인", appliedDate: "2026-01-15" },
      { workplace: "외자창고B동", appliedDate: "2026-02-10" }
    ],
    favorite: true, regDate: "2025-11-01"
  },
  {
    id: "SG-2026-0008", dept: "생산기술부", team: "가공부", user: "서준혁",
    improve: "품질 개선", sqdc: "Q",
    title: "가공설비 예방보전 체크리스트 개선",
    phenomenon: "점검항목 누락으로 돌발고장 발생", current: "돌발고장 월 5건", target: "돌발고장 월 1건 이하",
    files: [{ name: "예방보전_체크리스트_v2.xlsx", date: "2026-01-05" }],
    resultLevel: "88", doneYN: true, doneDate: "2026-01-25",
    eval1: { grade: "A", date: "2026-01-28", checked: 5 },
    eval2: { grade: "A", date: "2026-02-03", checked: 5 },
    verifyDesc: "돌발고장 4건 감소, 설비 가동률 향상", verifyMh: "7M/H, 290,000원",
    stdTimeApplied: true, stdTimeDate: "2026-02-04",
    horizontalDeployments: [
      { workplace: "가공2라인", appliedDate: "2026-03-01" }
    ],
    favorite: false, regDate: "2025-12-20"
  },
  {
    id: "SG-2026-0010", dept: "생산기술부", team: "조립부", user: "이하늘",
    improve: "납기 개선", sqdc: "D",
    title: "조립 지그 표준화 소그룹",
    phenomenon: "지그 규격 상이로 작업 준비시간 증가", current: "준비시간 22분", target: "준비시간 8분 이하",
    files: [],
    resultLevel: "60", doneYN: true, doneDate: "2026-02-10",
    eval1: { grade: "B", date: "2026-02-13", checked: 4 },
    eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "", verifyMh: "",
    stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [],
    favorite: false, regDate: "2026-01-15"
  },
  {
    id: "SG-2026-0013", dept: "생산품질부", team: "부품품질팀", user: "오세훈",
    improve: "품질 개선", sqdc: "Q",
    title: "수입검사 판정기준 명확화",
    phenomenon: "검사자별 판정기준 상이로 재검사 발생", current: "재검사율 9%", target: "재검사율 2% 이하",
    files: [{ name: "판정기준_표준서.pdf", date: "2026-02-20" }],
    resultLevel: "97", doneYN: true, doneDate: "2026-03-08",
    eval1: { grade: "S", date: "2026-03-10", checked: 6 },
    eval2: { grade: "A", date: "2026-03-16", checked: 5 },
    verifyDesc: "재검사율 7%p 개선, 검사 리드타임 단축", verifyMh: "5M/H, 180,000원",
    stdTimeApplied: true, stdTimeDate: "2026-03-17",
    horizontalDeployments: [
      { workplace: "부품검사2팀", appliedDate: "2026-04-05" }
    ],
    favorite: false, regDate: "2026-02-01"
  },
  {
    id: "SG-2026-0014", dept: "생산품질부", team: "트러블슈팅팀", user: "정하윤",
    improve: "납기 개선", sqdc: "D",
    title: "돌발 트러블 초동대응 매뉴얼화",
    phenomenon: "초동대응 표준 부재로 복구 지연", current: "초동대응 소요 25분", target: "초동대응 소요 10분 이하",
    files: [{ name: "초동대응_매뉴얼_초안.docx", date: "2026-03-10" }],
    resultLevel: "82", doneYN: true, doneDate: "2026-03-25",
    eval1: { grade: "A", date: "2026-03-27", checked: 5 },
    eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "", verifyMh: "",
    stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [],
    favorite: false, regDate: "2026-03-05"
  },
  {
    id: "SG-2026-0015", dept: "생산운영부", team: "설비관리팀", user: "최다인",
    improve: "품질 개선", sqdc: "Q",
    title: "설비 가동 일정 변경 알림체계 개선",
    phenomenon: "설비 가동 일정 변경 알림 누락으로 현장 혼선 발생", current: "알림 누락률 15%", target: "알림 누락률 2% 이하",
    files: [],
    resultLevel: "50", doneYN: false, doneDate: null,
    eval1: { grade: "C", date: "2026-04-20", checked: 3 },
    eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "", verifyMh: "",
    stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [],
    favorite: false, regDate: "2026-04-01"
  },
  {
    id: "SG-2026-0016", dept: "생산운영부", team: "설비관리팀", user: "구본무",
    improve: "안전성 개선", sqdc: "S",
    title: "설비 청소 표준시간 재산정 소그룹",
    phenomenon: "청소시간 과다산정으로 비가동 손실 발생", current: "청소 소요 65분", target: "청소 소요 30분 이하",
    files: [{ name: "청소표준_재산정안.xlsx", date: "2026-05-15" }],
    resultLevel: "96", doneYN: true, doneDate: "2026-06-05",
    eval1: { grade: "S+", date: "2026-06-07", checked: 6 },
    eval2: { grade: "S+", date: "2026-06-13", checked: 6 },
    verifyDesc: "청소시간 35분 단축, 설비 가동률 4%p 향상", verifyMh: "9M/H, 380,000원",
    stdTimeApplied: true, stdTimeDate: "2026-06-14",
    horizontalDeployments: [
      { workplace: "설비관리2팀", appliedDate: "2026-07-01" },
      { workplace: "조립설비라인", appliedDate: "2026-07-20" }
    ],
    favorite: true, regDate: "2026-05-10"
  }
];

/* ---------------- 5S 점검항목 (평가 기준정보) ---------------- */
let S5S_ITEMS = [
  { no: 1, team: "라인품질팀", type: "정리", code: "AD5SA01014", name: "미사용 자재 적치로 공간의 낭비요소는 없는가?", use: "사용", user: "구본무", date: "2023-02-03" },
  { no: 2, team: "라인품질팀", type: "정리", code: "AD5SA01009", name: "불필요한 부품, 재료, 기계등으로 공간의 낭비요소는 없는가?", use: "사용", user: "구본무", date: "2023-02-03" },
  { no: 3, team: "라인품질팀", type: "정리", code: "AD5SA01013", name: "불필요한 치공구, 대차등으로 작업의 방해요소는 없는가?", use: "사용", user: "구본무", date: "2023-02-03" },
  { no: 4, team: "라인품질팀", type: "정돈", code: "AD5SA01021", name: "여분의 재고로 관리/품질/정리/물류이동의 낭비 요소는 없는가?", use: "사용", user: "구본무", date: "2023-02-03" },
  { no: 5, team: "라인품질팀", type: "정돈", code: "AD5SA01020", name: "불필요한 자재, 공구류(장기방치)가 라인에 있는가?", use: "", user: "", date: "" },
  { no: 6, team: "라인품질팀", type: "청소", code: "AD5SA01011", name: "필요한 것과 불필요한 것이 구분되지 않고 혼재되어 있지 않은가?", use: "사용", user: "구본무", date: "2023-02-03" },
  { no: 7, team: "설비관리팀", type: "정리", code: "AD5SA02011", name: "설비 주변 정리정돈 상태가 양호한가?", use: "사용", user: "박태준", date: "2023-05-10" },
  { no: 8, team: "설비관리팀", type: "청결", code: "AD5SA02015", name: "안전펜스/방호장치 상태가 양호한가?", use: "사용", user: "박태준", date: "2023-05-10" },
  { no: 9, team: "제작기술과", type: "정리", code: "AD5SA03007", name: "부자재 재고가 기준수량 이내로 관리되는가?", use: "사용", user: "이향기", date: "2024-01-19" },
  { no: 10, team: "제작기술과", type: "습관화", code: "AD5SA03012", name: "5S 점검 체크리스트가 주기적으로 작성되는가?", use: "", user: "", date: "" },
];

/* ---------------- helpers ---------------- */
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return document.querySelectorAll(sel); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function getTask(id){ return TASKS.find(t => t.id === id); }
function toast(msg, kind){
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (kind ? " toast-" + kind : "");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=> t.className = "toast", 2800);
}
function daysSince(dateStr){
  const ms = Date.now() - new Date(dateStr + "T00:00:00").getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}
function notiStatusText(t){
  if (t.stageStatus === "done_all" && t.completeYN === "Y") return "완료 · 알림 없음";
  const elapsed = daysSince(t.regDate);
  if (elapsed >= CONFIG.esc) return `가속 독촉 · ${CONFIG.esc}일 초과`;
  const remainder = elapsed % CONFIG.noti;
  const daysToNext = remainder === 0 ? CONFIG.noti : CONFIG.noti - remainder;
  return `다음 알림 D-${daysToNext}`;
}

/* ================= SCREEN TAB SWITCHING ================= */
function bindTabs(){
  $all(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      $all(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      $all(".screen").forEach(s => s.classList.remove("active"));
      $("#" + btn.dataset.screen).classList.add("active");
      if (btn.dataset.screen === "listScreen") renderListScreen();
      if (btn.dataset.screen === "dashScreen") renderDashScreen();
      if (btn.dataset.screen === "regenTrendScreen") renderRegenTrendScreen();
      if (btn.dataset.screen === "sgMainScreen") renderSgMainScreen();
      if (btn.dataset.screen === "sgListScreen") renderSgListScreen();
      if (btn.dataset.screen === "sgEvalHistoryScreen") renderSgEvalHistoryScreen();
      if (btn.dataset.screen === "sgPerfScreen") renderSgPerfScreen();
      if (btn.dataset.screen === "hdStatusScreen") renderHdStatusScreen();
      if (btn.dataset.screen === "masterDataScreen") renderMasterDataScreen();
    });
  });
}

/* ================= SCREEN 1 — 부서별 메인 ================= */
function groupByDept(tasks){
  const groups = {};
  tasks.forEach(t => {
    if (!groups[t.dept]) groups[t.dept] = {};
    if (!groups[t.dept][t.team]) groups[t.dept][t.team] = [];
    groups[t.dept][t.team].push(t);
  });
  return groups;
}

function renderMainScreen(){
  const visible = TASKS.filter(t => !favOnly || t.favorite);
  const groups = groupByDept(visible);
  const wrap = $("#deptTree");
  wrap.innerHTML = "";

  Object.keys(groups).forEach(dept => {
    const teams = groups[dept];
    let done = 0, inprog = 0;
    Object.values(teams).flat().forEach(t => t.stageStatus === "done_all" && t.completeYN === "Y" ? done++ : inprog++);

    const group = document.createElement("div");
    group.className = "dept-group";
    group.innerHTML = `
      <div class="dept-header">
        <div class="dept-name"><span class="dept-caret">▾</span>${dept}</div>
        <div class="dept-counts">진행 <b>${inprog}</b> · 완료 <b>${done}</b></div>
      </div>
      <div class="dept-body"></div>
    `;
    const body = group.querySelector(".dept-body");
    Object.keys(teams).forEach(team => {
      teams[team].forEach(t => {
        const row = document.createElement("div");
        row.className = "team-row";
        const catCls = t.category === "important" ? "important" : "normal";
        const catLabel = t.category === "important" ? "● 중요" : t.category === "normal" ? "○ 일상" : "판정대기";
        row.innerHTML = `
          <div class="team-name">${team}</div>
          <div class="task-title-cell">
            <a data-open="${t.id}">${t.title}</a>
            <small>${t.current} → ${t.target} · ${notiStatusText(t)}</small>
          </div>
          <div class="mini-metric"><b>${t.effect || "—"}</b></div>
          <div><span class="sqdc-pill">${t.sqdc || "-"}</span></div>
          <div class="cat-dot ${catCls}">${catLabel}</div>
          <div class="progress-counts">
            <button class="star-btn" data-star="${t.id}">${t.favorite ? "★" : "☆"}</button>
          </div>
        `;
        body.appendChild(row);
      });
    });
    group.querySelector(".dept-header").addEventListener("click", () => group.classList.toggle("collapsed"));
    wrap.appendChild(group);
  });

  $all("[data-open]").forEach(a => a.addEventListener("click", (e) => { e.stopPropagation(); openTaskModal(a.dataset.open); }));
  $all("[data-star]").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const t = getTask(btn.dataset.star);
    t.favorite = !t.favorite;
    renderMainScreen();
  }));
}

function bindMainToolbar(){
  $("#btnSearch").addEventListener("click", () => { renderMainScreen(); toast("조회 조건으로 재조회했습니다.", "navy"); });

  $("#btnSaveAll").addEventListener("click", () => toast("변경사항이 저장되었습니다.", "green"));
  $("#btnExportMain").addEventListener("click", () => toast("출력 미리보기를 생성합니다. (데모)", "navy"));
  $("#btnFavToggle").addEventListener("click", () => {
    favOnly = !favOnly;
    $("#btnFavToggle").classList.toggle("active-fav", favOnly);
    $("#btnFavToggle").textContent = favOnly ? "★ 즐겨찾기만" : "☆ 즐겨찾기";
    renderMainScreen();
  });
  $("#btnCopyTask").addEventListener("click", () => {
    const src = getTask(lastViewedTaskId) || TASKS[TASKS.length - 1];
    if (!src){ toast("복사할 과제가 없습니다.", "red"); return; }
    const id = "T-2026-" + String(taskCounter++).padStart(4, "0");
    const clone = { ...src, id, registered: false, stageIndex: 0, stageStatus: "in_progress",
      stageDates: { P: null, D: null, C: null, A: null }, filesP: [], filesDCA: [],
      review: { C: "", A: "" }, result: "", postcheck: [null, null, null], completeYN: null,
      parentId: null, regenOf: null, favorite: false, regDate: todayStr(), isNew: true };
    TASKS.push(clone);
    toast(`"${src.title}" 등록정보를 복사해 신규 과제 초안(${id})을 생성했습니다. (btn_copy)`, "navy");
    openTaskModal(id);
  });
}

/* ================= SCREEN 2 — 조회 (List) ================= */
function stageIconHtml(done){ return `<span class="chk-ico ${done ? "on" : "off"}">${done ? "✅" : "—"}</span>`; }

function renderListScreen(){
  const uf = $("#lstUser").value.trim().toLowerCase();
  const cf = $("#lstCategory").value;
  const impf = $("#lstImprove").value;
  const resf = $("#lstResource").value;
  const donef = $("#lstDone").value;
  const dFrom = $("#lstDateFrom").value;
  const dTo = $("#lstDateTo").value;

  const filtered = TASKS.filter(t => {
    if (uf && !t.user.toLowerCase().includes(uf)) return false;
    if (cf && t.category !== cf) return false;
    if (impf && t.improve !== impf) return false;
    if (resf && t.resource !== resf) return false;
    if (dFrom && t.regDate < dFrom) return false;
    if (dTo && t.regDate > dTo) return false;
    const isDone = t.completeYN === "Y" ? "Y" : "N";
    if (donef !== "All" && donef !== isDone) return false;
    return true;
  });

  const body = $("#listTableBody");
  body.innerHTML = filtered.map(t => `
    <tr>
      <td>${t.regDate}</td>
      <td>${t.user}</td>
      <td>${t.team}</td>
      <td>${t.title}</td>
      <td>${t.category === "important" ? "중요" : t.category === "normal" ? "일상" : "1차"} / ${t.registered ? "확정" : "미확정"}</td>
      <td>${t.improve}</td>
      <td>${stageIconHtml(!!t.stageDates.P)} / ${t.filesP.length ? "📎" + t.filesP.length : "—"}</td>
      <td>${stageIconHtml(!!t.stageDates.D)} ${stageIconHtml(!!t.stageDates.C)} ${stageIconHtml(!!t.stageDates.A)} / ${t.filesDCA.length ? "📎" + t.filesDCA.length : "—"}</td>
      <td>${t.current || "—"} / ${t.target || "—"} / ${t.result || "—"}</td>
      <td>${t.postcheck.map(p => p ? "✅" : "⏳").join(" ")}</td>
      <td>${t.completeYN === "Y" ? "✅ Y" : "N"}</td>
      <td style="text-align:left;font-size:11px;color:var(--ink-soft)">${notiStatusText(t)}${t.regenOf ? ` · ↳${t.regenOf}` : ""}</td>
    </tr>
  `).join("") || `<tr><td colspan="12" style="padding:24px;color:#9AA7B2">조건에 맞는 과제가 없습니다.</td></tr>`;
}

function bindListScreen(){
  $("#btnListSearch").addEventListener("click", renderListScreen);
  const teamSel = $("#lstTeam");
  [...new Set(TASKS.map(t => t.team))].forEach(team => {
    const opt = document.createElement("option");
    opt.value = team; opt.textContent = team;
    teamSel.appendChild(opt);
  });
  teamSel.addEventListener("change", () => {
    // simple client filter add-on (team not in main filter fn above) -> quick reapply
    const val = teamSel.value;
    renderListScreen();
    if (val){
      const rows = [...$all("#listTableBody tr")];
      rows.forEach(r => { if (!r.children[2] || r.children[2].textContent !== val) r.style.display = "none"; });
    }
  });
}

/* ================= SCREEN 3 — 중요과제 대시보드 ================= */
const SQDC_KEYS = ["S", "Q", "D", "C"];
function renderDashScreen(){
  const important = TASKS.filter(t => t.category === "important");
  const depts = [...new Set(TASKS.map(t => t.dept))];

  // --- SQDC matrix ---
  const matrix = $("#sqdcMatrix");
  let thead = `<tr><th>중요 안건</th>${depts.map(d => `<th>${d}</th>`).join("")}<th>계</th></tr>`;
  let rows = "";
  SQDC_KEYS.forEach(k => {
    let rowTotal = 0;
    const cells = depts.map(d => {
      const cnt = important.filter(t => t.sqdc === k && t.dept === d).length;
      rowTotal += cnt;
      return `<td>${cnt || ""}</td>`;
    }).join("");
    rows += `<tr><th>${k} (${{S:"안전",Q:"품질",D:"납기",C:"원가"}[k]})</th>${cells}<td class="total">${rowTotal || ""}</td></tr>`;
  });
  let colTotal = important.length;
  const totalCells = depts.map(d => `<td class="total">${important.filter(t => t.dept === d).length}</td>`).join("");
  rows += `<tr><th>계</th>${totalCells}<td class="total">${colTotal}</td></tr>`;
  matrix.innerHTML = thead + rows;

  // --- bar chart (완료/진행 per dept) ---
  const chart = $("#deptBarChart");
  chart.innerHTML = "";
  const maxCount = Math.max(1, ...depts.map(d => TASKS.filter(t => t.dept === d).length));
  depts.forEach(d => {
    const list = TASKS.filter(t => t.dept === d);
    const done = list.filter(t => t.completeYN === "Y").length;
    const inprog = list.length - done;
    const total = list.length;
    const doneH = Math.round((done / maxCount) * 140);
    const inprogH = Math.round((inprog / maxCount) * 140);
    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <div class="bar-stack" style="height:${Math.max(doneH + inprogH, 2)}px">
        <div class="bar-seg-inprog" style="height:${inprogH}px" title="진행 ${inprog}건"></div>
        <div class="bar-seg-done" style="height:${doneH}px" title="완료 ${done}건"></div>
      </div>
      <div class="bar-label">${d}<br><b>${total}건</b></div>
    `;
    chart.appendChild(col);
  });

  // --- follow-up table ---
  const body = $("#followupBody");
  body.innerHTML = important.map(t => `
    <tr>
      <td>${t.regDate}</td><td>${t.user}</td><td>${t.team}</td><td>${t.resource}</td>
      <td style="text-align:left;font-weight:600">${t.title}</td>
      <td>중요 / ${t.registered ? "확정" : "미확정"}</td>
      <td>${t.improve}</td>
      <td>${stageIconHtml(!!t.stageDates.P)}</td>
      <td>${stageIconHtml(!!t.stageDates.D)} ${stageIconHtml(!!t.stageDates.C)} ${stageIconHtml(!!t.stageDates.A)}</td>
      <td>${t.current || "—"} / ${t.target || "—"}</td>
      <td>${t.result || "—"}</td>
      <td>${t.postcheck.map(p => p ? "✅" : "⏳").join(" ")}</td>
      <td>${t.completeYN === "Y" ? "✅" : "N"}</td>
      <td style="text-align:left;font-size:11px;color:var(--ink-soft)">${t.regenOf ? "↳ " + t.regenOf : "Root"}</td>
    </tr>
  `).join("") || `<tr><td colspan="13" style="padding:20px;color:#9AA7B2">중요과제가 없습니다.</td></tr>`;

  // --- SQDC 목표 달성 과제 ---
  const achieved = TASKS.filter(t => t.completeYN === "Y");
  $("#achievedBody").innerHTML = achieved.length ? achieved.map(t => `
    <tr>
      <td>${t.stageDates.A || t.regDate}</td>
      <td style="text-align:left;font-weight:600">${t.title}</td>
      <td>${t.team}</td>
      <td><span class="sqdc-pill">${t.sqdc || "-"}</span></td>
      <td style="text-align:left">${t.current || "—"} → ${t.target || "—"}</td>
      <td>${t.result || "—"}</td>
      <td style="font-size:11px;color:var(--ink-soft)">${t.regenOf ? "↳ " + t.regenOf : "Root"}</td>
    </tr>
  `).join("") : `<tr><td colspan="7" style="padding:20px;color:#9AA7B2">SQDC 목표를 달성한 과제가 아직 없습니다.</td></tr>`;

  // --- SQDC 목표 미달성 과제 ---
  const unachieved = TASKS.filter(t => t.completeYN === "N");
  $("#unachievedBody").innerHTML = unachieved.length ? unachieved.map(t => {
    const child = TASKS.find(x => x.regenOf === t.id);
    return `
    <tr>
      <td>${t.postcheck[t.postcheck.length - 1] || t.regDate}</td>
      <td style="text-align:left;font-weight:600">${t.title}</td>
      <td>${t.team}</td>
      <td><span class="sqdc-pill">${t.sqdc || "-"}</span></td>
      <td style="text-align:left">${t.current || "—"} → ${t.target || "—"}</td>
      <td>${t.result || "—"}</td>
      <td style="font-size:11px;color:var(--ink-soft)">${child ? `↻ ${child.id}` : "미생성"}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="7" style="padding:20px;color:#9AA7B2">SQDC 목표 미달성 과제가 없습니다.</td></tr>`;
}

function bindDashScreen(){
  $("#btnExportCsv").addEventListener("click", () => {
    const important = TASKS.filter(t => t.category === "important");
    const header = ["등록일","등록자","진행팀","과제리소스","제목","개선구분","현수준","목표수준","결과","과제완료"];
    const rows = important.map(t => [t.regDate, t.user, t.team, t.resource, t.title, t.improve, t.current, t.target, t.result, t.completeYN === "Y" ? "Y" : "N"]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "중요과제_Followup.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("중요과제 Follow-up 데이터를 CSV로 내보냈습니다.", "green");
  });
}

/* ================= 유효성 검증·재이관 추이 대시보드 ================= */
function buildRegenRecords(){
  return TASKS.filter(t => t.completeYN === "N").map(t => {
    const child = TASKS.find(x => x.regenOf === t.id);
    return {
      id: t.id, title: t.title, dept: t.dept, team: t.team,
      failDate: t.postcheck[2] || t.postcheck[1] || t.postcheck[0] || t.regDate,
      childId: child ? child.id : null,
      childRegDate: child ? child.regDate : null,
      childProgress: child
        ? (child.stageStatus === "done_all" ? "완료" : `${STAGES[child.stageIndex]}단계 진행중`)
        : "미생성"
    };
  }).sort((a, b) => (b.failDate || "").localeCompare(a.failDate || ""));
}

function renderRegenTrendScreen(){
  const regenRecords = buildRegenRecords();
  const decided = TASKS.filter(t => t.completeYN === "Y" || t.completeYN === "N").length;
  const failCount = regenRecords.length;
  const rate = decided ? Math.round((failCount / decided) * 100) : 0;
  const regenerated = regenRecords.filter(r => r.childId).length;

  $("#regenStatStrip").innerHTML = `
    <div class="stat-card"><span class="stat-label">완료판정 건수(달성+미달성)</span><span class="stat-value">${decided}</span></div>
    <div class="stat-card accent-red"><span class="stat-label">미달성(재이관) 확정 건수</span><span class="stat-value">${failCount}</span></div>
    <div class="stat-card accent-amber"><span class="stat-label">재이관율</span><span class="stat-value">${rate}%</span></div>
    <div class="stat-card accent-navy"><span class="stat-label">신규과제로 재생성 완료</span><span class="stat-value">${regenerated}<small>/${failCount}</small></span></div>
  `;

  // --- M+1/M+2/M+3 단계별 현황 (사후검증 진행중, 완료판정 전) ---
  const pipeline = TASKS.filter(t => t.stageStatus === "done_all" && t.completeYN === null);
  const m1 = pipeline.filter(t => t.postcheck[0]).length;
  const m2 = pipeline.filter(t => t.postcheck[1]).length;
  const m3 = pipeline.filter(t => t.postcheck[2]).length;
  const maxM = Math.max(1, pipeline.length);
  $("#regenFunnel").innerHTML = [
    ["M+1", m1], ["M+2", m2], ["M+3", m3]
  ].map(([label, count]) => `
    <div class="funnel-step">
      <div class="funnel-label">${label} 완료</div>
      <div class="funnel-bar-track"><div class="funnel-bar-fill" style="width:${Math.max(Math.round((count / maxM) * 100), count ? 8 : 0)}%">${count ? count + "건" : ""}</div></div>
      <div class="funnel-count">${count} / ${pipeline.length}</div>
    </div>
  `).join("") + (pipeline.length ? "" : `<div class="case-empty">현재 사후검증 진행중인 과제가 없습니다.</div>`);

  // --- 분기별 재이관 추이 ---
  const byQuarter = {};
  regenRecords.forEach(r => {
    const q = dateToQuarterLabel(r.failDate);
    if (!q) return;
    byQuarter[q] = (byQuarter[q] || 0) + 1;
  });
  const labels = Object.keys(byQuarter).sort();
  const chart = $("#regenTrendChart");
  chart.innerHTML = "";
  const maxV = Math.max(1, ...labels.map(l => byQuarter[l]));
  labels.forEach(l => {
    const v = byQuarter[l];
    const h = Math.round((v / maxV) * 140);
    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <div class="bar-rate" style="color:var(--red)">${v}건</div>
      <div class="bar-stack" style="height:${Math.max(h, 2)}px">
        <div class="bar-seg-fail" style="height:${h}px" title="${v}건"></div>
      </div>
      <div class="bar-label">${l}</div>
    `;
    chart.appendChild(col);
  });
  if (!labels.length) chart.innerHTML = `<div class="case-empty" style="padding:20px">재이관 확정 데이터가 아직 없습니다.</div>`;
  $("#regenTrendTable").innerHTML = `<tr><th>분기</th><th>재이관 확정 건수</th></tr>` +
    labels.map(l => `<tr><th>${l}</th><td>${byQuarter[l]}</td></tr>`).join("");

  // --- 재이관 이력 테이블 ---
  $("#regenHistoryBody").innerHTML = regenRecords.length ? regenRecords.map(r => `
    <tr>
      <td>${r.dept} / ${r.team}</td>
      <td style="text-align:left;font-weight:600">${r.id} · ${r.title}</td>
      <td>${r.failDate}</td>
      <td>${r.childId || "—"}</td>
      <td>${r.childRegDate || "—"}</td>
      <td>${r.childProgress}</td>
    </tr>
  `).join("") : `<tr><td colspan="6" style="padding:20px;color:#9AA7B2">재이관 이력이 없습니다.</td></tr>`;
}

function bindRegenTrendScreen(){
  // 정적 필터 없음 — 탭 진입 시 자동 렌더 (bindTabs에서 처리)
}

/* ================= MODAL: 등록/진행 ================= */
function openRegisterModal(){
  const id = "T-2026-" + String(taskCounter++).padStart(4, "0");
  TASKS.push({
    id, dept: CURRENT_USER.dept, team: CURRENT_USER.team, title: "",
    user: CURRENT_USER.name, resource: "정기과제접수(반기별)", improve: "품질 개선",
    category: "pending", sqdc: "", phenomenon: "", current: "", target: "", effect: "",
    actFrom: todayStr(), actTo: "",
    registered: false, stageIndex: 0, stageStatus: "in_progress",
    stageDates: { P: null, D: null, C: null, A: null },
    filesP: [], filesDCA: [], review: { C: "", A: "" }, result: "",
    postcheck: [null, null, null], completeYN: null,
    parentId: null, regenOf: null, favorite: false, regDate: todayStr(), isNew: true
  });
  openTaskModal(id);
}

function openTaskModal(id){
  activeTaskId = id;
  lastViewedTaskId = id;
  fileTargetCtx = null;
  const t = getTask(id);
  $("#modalTitle").textContent = t.registered ? `문제해결 과제 — ${t.id}` : "문제해결 과제 등록";
  $("#favBtn").textContent = t.favorite ? "★" : "☆";
  $("#favBtn").classList.toggle("active", t.favorite);

  $("#fRegDate").value = t.regDate;
  $("#fRegUser").value = `${t.user} / ${t.team}`;
  $("#fResource").value = t.resource;
  $("#fCategory").value = t.category === "important" ? "중요과제 (임원진 결재선 확장)"
    : t.category === "normal" ? "일상과제 (팀장 단독 승인)"
    : "판정 대기 — 모듈리더 1차 판정 예정";
  $("#fImprove").value = t.improve;
  $("#fSqdc").value = t.sqdc || "";
  $("#fTitle").value = t.title;
  $("#fPhenomenon").value = t.phenomenon;
  $("#fCurrent").value = t.current;
  $("#fTarget").value = t.target;
  $("#fEffect").value = t.effect;
  $("#fActFrom").value = t.actFrom || "";
  $("#fActTo").value = t.actTo || "";

  // lock / unlock registration part
  const formCol = $("#formCol");
  formCol.classList.toggle("locked-part", t.registered);
  $all("#formCol input, #formCol select").forEach(el => el.disabled = t.registered || el.id === "fRegDate" || el.id === "fRegUser" || el.id === "fCategory");
  $("#confirmRegBtn").style.display = t.registered ? "none" : "flex";

  // progress part
  $("#progressLockedMsg").style.display = t.registered ? "none" : "block";
  $("#stageBlocks").style.display = t.registered ? "flex" : "none";
  $("#stageBlocks").style.flexDirection = "column";

  if (t.registered){
    renderGauge(t);
    renderStageBlocks(t);
    renderPostcheck(t);
  }

  $("#taskOverlay").classList.add("open");
}

function closeTaskModal(){
  $("#taskOverlay").classList.remove("open");
  const t = getTask(activeTaskId);
  if (t && t.isNew && !t.registered){
    TASKS = TASKS.filter(x => x.id !== activeTaskId);
  }
  activeTaskId = null;
  refreshAllScreens();
}

function refreshAllScreens(){
  renderMainScreen();
  if ($("#listScreen").classList.contains("active")) renderListScreen();
  if ($("#dashScreen").classList.contains("active")) renderDashScreen();
  if ($("#regenTrendScreen").classList.contains("active")) renderRegenTrendScreen();
  renderKpiStrip();
}

/* ---- 상단 배너 실시간 KPI ---- */
function renderKpiStrip(){
  const problemTotal = TASKS.length;
  const problemInProgress = TASKS.filter(t => !(t.stageStatus === "done_all" && t.completeYN === "Y")).length;
  const sgTotal = SG_TASKS.length;
  const sgInProgress = SG_TASKS.filter(t => !t.doneYN).length;

  const totalAccepted = problemTotal + sgTotal;
  const totalInProgress = problemInProgress + sgInProgress;
  const progressRate = totalAccepted ? Math.round((totalInProgress / totalAccepted) * 100) : 0;

  const escalateCount = TASKS.filter(t => {
    if (t.stageStatus === "done_all" && t.completeYN === "Y") return false;
    return daysSince(t.regDate) >= CONFIG.esc;
  }).length;
  const hd = computeHdStats();

  $("#kpiStrip").innerHTML = `
    <div class="kpi-chip">
      <span class="kpi-value">${problemInProgress} <small>/ ${problemTotal}건</small></span>
      <span class="kpi-label">문제해결과제 진행중</span>
    </div>
    <div class="kpi-chip">
      <span class="kpi-value">${sgInProgress} <small>/ ${sgTotal}건</small></span>
      <span class="kpi-label">소그룹활동 진행중</span>
    </div>
    <div class="kpi-chip">
      <span class="kpi-value">${totalInProgress} <small>/ ${totalAccepted}건 (${progressRate}%)</small></span>
      <span class="kpi-label">접수 대비 진행 비율</span>
    </div>
    <div class="kpi-chip">
      <span class="kpi-value">${hd.highCount}</span>
      <span class="kpi-label">고등급(S+·S·A) 사례 누적</span>
    </div>
    <div class="kpi-chip">
      <span class="kpi-value">${TASKS.filter(t => t.completeYN === "Y").length}</span>
      <span class="kpi-label">SQDC 목표 달성 누적</span>
    </div>
    <div class="kpi-chip">
      <span class="kpi-value">${TASKS.filter(t => t.completeYN === "N").length}</span>
      <span class="kpi-label">SQDC 목표 미달성 누적</span>
    </div>
    <div class="kpi-chip ${escalateCount > 0 ? "warn" : ""}">
      <span class="kpi-value">${escalateCount}</span>
      <span class="kpi-label">지연 가속 독촉 대상</span>
    </div>
    <div class="kpi-chip">
      <span class="kpi-value">${hd.deployCount}</span>
      <span class="kpi-label">수평전개 적용 누적</span>
    </div>
    <div class="kpi-chip ${hd.noDeployCount > 0 ? "warn" : ""}">
      <span class="kpi-value">${hd.noDeployCount}</span>
      <span class="kpi-label">미전개 고등급 사례</span>
    </div>
  `;
}

/* ---- 등록 확정 (Part 잠금 전환) ---- */
function confirmRegistration(){
  const t = getTask(activeTaskId);
  const title = $("#fTitle").value.trim();
  const sqdc = $("#fSqdc").value;
  if (!title){ toast("제목을 입력해 주세요.", "red"); return; }
  if (!sqdc){ toast("개선위치(S·Q·D·C)를 선택해 주세요.", "red"); return; }

  t.title = title; t.sqdc = sqdc;
  t.resource = $("#fResource").value;
  t.improve = $("#fImprove").value;
  t.phenomenon = $("#fPhenomenon").value.trim();
  t.current = $("#fCurrent").value.trim();
  t.target = $("#fTarget").value.trim();
  t.effect = $("#fEffect").value.trim();
  t.actFrom = $("#fActFrom").value;
  t.actTo = $("#fActTo").value;
  t.isNew = false;

  // 지능형 라우팅: 백엔드 중요도 판정 시뮬레이션
  const importantRoll = (title.length + sqdc.length) % 3 === 0;
  t.category = importantRoll ? "important" : "normal";
  t.registered = true;

  toast(`등록 확정 완료 → 지능형 라우팅: ${t.category === "important" ? "중요과제 (팀장→모듈리더→임원진)" : "일상과제 (팀장 단독 승인)"}`, "navy");
  openTaskModal(t.id);
  refreshAllScreens();
}

/* ---- PDCA GAUGE ---- */
function renderGauge(t, flashIndex){
  const gauge = $("#pdcaGauge");
  gauge.innerHTML = "";
  STAGES.forEach((s, i) => {
    const seg = document.createElement("div");
    seg.className = "gauge-seg";
    if (t.stageStatus === "done_all" || i < t.stageIndex) seg.classList.add("done");
    else if (i === t.stageIndex) seg.classList.add("active");
    else seg.classList.add("locked");
    if (i === flashIndex) seg.classList.add("rollback-flash");
    seg.innerHTML = `${s}<span class="seg-sub">${STAGE_LABEL[s]}</span>`;
    gauge.appendChild(seg);
  });
}

/* ---- STAGE BLOCKS (P/D/C/A) ---- */
function fileRowsHtml(files){
  if (!files.length) return `<tr class="empty-row"><td colspan="3">Nothing to display</td></tr>`;
  return files.map((f, i) => `
    <tr>
      <td>${i + 1}</td><td>${f.date}</td><td>${f.name}</td>
      <td><button class="file-del" data-del-file="${i}">삭제</button></td>
    </tr>`).join("");
}

function renderStageBlocks(t){
  const blocks = { P: $("#blockP"), D: $("#blockD"), C: $("#blockC"), A: $("#blockA") };
  STAGES.forEach((s, i) => {
    const block = blocks[s];
    const isDone = t.stageDates[s] !== null;
    const isActive = i === t.stageIndex && t.stageStatus !== "done_all";
    const isLocked = i > t.stageIndex || t.stageStatus === "done_all";
    block.classList.toggle("locked", !isDone && !isActive);

    const chk = $("#done" + s);
    chk.checked = isDone;
    chk.disabled = !isActive;
    $("#date" + s).textContent = "완료일자 " + (t.stageDates[s] || "—");

    if (s === "C" || s === "A"){
      const sel = $("#review" + s);
      sel.value = t.review[s] || "";
      sel.disabled = !isActive;
    }
  });

  // C 개선결과 입력
  const resultInput = $("#fResult");
  resultInput.value = t.result || "";
  resultInput.disabled = t.stageIndex !== 2 || t.stageStatus === "done_all";
  resultInput.classList.remove("invalid");
  $("#resultHint").textContent = "숫자 형식만 허용됩니다 (정규식 검증)";
  $("#resultHint").classList.remove("error");

  // 파일첨부 (P)
  $("#filesP").innerHTML = fileRowsHtml(t.filesP);
  $("#lastModP").textContent = t.filesP.length ? t.filesP[t.filesP.length - 1].date : "—";
  $all('[data-del-file]').forEach(b => {}); // rebound below globally

  // 파일첨부 (DCA) - available once stage reached D or beyond
  $("#filesDCA").innerHTML = fileRowsHtml(t.filesDCA);
  $("#lastModDCA").textContent = t.filesDCA.length ? t.filesDCA[t.filesDCA.length - 1].date : "—";
  const dcaEnabled = t.stageIndex >= 1;
  $("#addFileDCA").disabled = !dcaEnabled || t.stageStatus === "done_all";

  bindFileDeleteButtons(t);

  // action button label/state
  const btn = $("#stageActionBtn");
  if (t.stageStatus === "done_all"){
    btn.style.display = "none";
  } else {
    btn.style.display = "block";
    const stage = STAGES[t.stageIndex];
    const labels = { P: "P단계 완료 처리", D: "D단계 완료 처리", C: "C단계 검토 처리", A: "A단계 최종 검토 처리" };
    btn.textContent = labels[stage];
  }
}

function bindFileDeleteButtons(t){
  $all("#filesP [data-del-file]").forEach(b => b.addEventListener("click", () => {
    t.filesP.splice(+b.dataset.delFile, 1);
    renderStageBlocks(t);
  }));
  $all("#filesDCA [data-del-file]").forEach(b => b.addEventListener("click", () => {
    t.filesDCA.splice(+b.dataset.delFile, 1);
    renderStageBlocks(t);
  }));
}

function handleAddFile(target){
  const t = getTask(activeTaskId);
  if (!t) return;
  fileTargetCtx = target;
  $("#hiddenFileInput").value = "";
  $("#hiddenFileInput").click();
}

function handleStageAction(){
  const t = getTask(activeTaskId);
  const stage = STAGES[t.stageIndex];

  if (stage === "P"){
    if (!$("#doneP").checked){ toast("P단계 완료여부를 체크해 주세요.", "red"); return; }
    t.stageDates.P = todayStr();
    t.stageIndex = 1;
    toast("P단계 완료 → D단계로 이동", "green");
  }
  else if (stage === "D"){
    if (!$("#doneD").checked){ toast("D단계 완료여부를 체크해 주세요.", "red"); return; }
    t.stageDates.D = todayStr();
    t.stageIndex = 2;
    toast("D단계 완료 → C단계로 이동", "green");
  }
  else if (stage === "C"){
    const resultVal = $("#fResult").value.trim();
    if (!resultVal || !NUM_REGEX.test(resultVal)){
      $("#fResult").classList.add("invalid");
      $("#resultHint").textContent = "ERR_INVALID_FORMAT — 숫자만 입력 가능합니다.";
      $("#resultHint").classList.add("error");
      toast("정량 결과 형식 오류 (ERR_INVALID_FORMAT)", "red");
      return;
    }
    const review = $("#reviewC").value;
    if (!review){ toast("검토 결과(승인/반려)를 선택해 주세요.", "red"); return; }
    t.result = resultVal;
    t.review.C = review;
    if (review === "승인"){
      t.stageDates.C = todayStr();
      t.stageIndex = 3;
      toast("C단계 승인 완료 → A단계로 이동", "green");
    } else {
      t.stageDates.D = null;
      t.stageIndex = 1;
      toast("C단계 반려 — N-1(D단계)로 안전 회귀했습니다.", "red");
      renderGauge(t, 1);
      renderStageBlocks(t);
      renderPostcheck(t);
      refreshAllScreens();
      return;
    }
  }
  else if (stage === "A"){
    if (!$("#doneA").checked){ toast("A단계 완료여부를 체크해 주세요.", "red"); return; }
    const review = $("#reviewA").value;
    if (!review){ toast("검토 결과(승인/반려)를 선택해 주세요.", "red"); return; }
    t.review.A = review;
    if (review === "승인"){
      t.stageDates.A = todayStr();
      t.stageStatus = "done_all";
      toast("A단계 최종 승인 완료. 사후 유효성 검증 대상으로 등록되었습니다.", "green");
    } else {
      t.stageDates.C = null;
      t.stageIndex = 2;
      toast("A단계 반려 — N-1(C단계)로 안전 회귀했습니다.", "red");
      renderGauge(t, 2);
      renderStageBlocks(t);
      renderPostcheck(t);
      refreshAllScreens();
      return;
    }
  }

  renderGauge(t);
  renderStageBlocks(t);
  renderPostcheck(t);
  refreshAllScreens();
}

/* ---- POSTCHECK (M+1..M+N) ---- */
function renderPostcheck(t){
  const grid = $("#postcheckGrid");
  grid.innerHTML = "";
  const n = CONFIG.post;
  while (t.postcheck.length < n) t.postcheck.push(null);
  const unlocked = t.stageStatus === "done_all";
  for (let i = 0; i < n; i++){
    const div = document.createElement("div");
    div.className = "pc-item" + (unlocked ? "" : " locked");
    const val = t.postcheck[i];
    div.innerHTML = `
      <span class="pc-label">M+${i+1}</span>
      <input type="date" value="${val || ""}" disabled data-pc-date="${i}">
      <button data-pc-checkin="${i}" ${!unlocked || val ? "disabled" : ""}>${val ? "확인 완료" : "Key-in 확인"}</button>
    `;
    grid.appendChild(div);
  }
  $all("[data-pc-checkin]").forEach(btn => btn.addEventListener("click", () => {
    const idx = +btn.dataset.pcCheckin;
    t.postcheck[idx] = todayStr();
    toast(`M+${idx+1} 유효성 점검 Key-in 완료 (다음 알림 ${CONFIG.noti}일 후)`, "green");
    renderPostcheck(t);
    refreshAllScreens();
  }));

  const lastChecked = t.postcheck[n - 1] !== null && t.postcheck[n - 1] !== undefined;
  $("#passM3Btn").disabled = !unlocked || !lastChecked || t.completeYN === "Y";
  $("#failM3Btn").disabled = !unlocked || !lastChecked || t.completeYN === "Y";
  $("#passM3Btn").textContent = t.completeYN === "Y" ? "✅ 과제완료 확정됨" : `목표 달성 확정 (M+${n})`;
  $("#failM3Btn").textContent = `목표 미달성 처리 (M+${n} 재생성 트리거)`;
}

function handlePassM3(){
  const t = getTask(activeTaskId);
  t.completeYN = "Y";
  toast(`M+${CONFIG.post} 목표 달성 확정 — 과제완료 처리되었습니다.`, "green");
  renderPostcheck(t);
  refreshAllScreens();
}

function handleFailM3(){
  const t = getTask(activeTaskId);
  const newId = "T-2026-" + String(taskCounter++).padStart(4, "0");
  const clone = {
    ...t, id: newId, title: t.title, current: t.target, result: "",
    registered: true, stageIndex: 0, stageStatus: "in_progress",
    stageDates: { P: null, D: null, C: null, A: null },
    filesP: [], filesDCA: [], review: { C: "", A: "" },
    postcheck: [null, null, null], completeYN: null,
    parentId: t.id, regenOf: t.id, favorite: false, regDate: todayStr(), isNew: false
  };
  t.completeYN = "N";
  TASKS.push(clone);
  toast(`M+${CONFIG.post} 목표 미달 — 마스터 데이터를 복제해 신규 PLAN 과제 ${newId} 를 생성했습니다 (parent_task_id: ${t.id})`, "red");
  closeTaskModal();
}

/* ================= TYPE SELECT POPUP ================= */
function openTypeSelect(){ $("#typeSelectOverlay").classList.add("open"); }
function closeTypeSelect(){ $("#typeSelectOverlay").classList.remove("open"); }

function bindTypeSelect(){
  $("#openRegisterBtn").addEventListener("click", openTypeSelect);
  $("#btnNewFromToolbar").addEventListener("click", openTypeSelect);
  $("#closeTypeSelectBtn").addEventListener("click", closeTypeSelect);
  $("#typeSelectOverlay").addEventListener("click", (e) => { if (e.target.id === "typeSelectOverlay") closeTypeSelect(); });
  $("#selectTypeProblem").addEventListener("click", () => { closeTypeSelect(); openRegisterModal(); });
  $("#selectTypeGroup").addEventListener("click", () => { closeTypeSelect(); openSgRegisterModal(); });
}

function refreshSgScreens(){
  if ($("#sgMainScreen").classList.contains("active")) renderSgMainScreen();
  if ($("#sgListScreen").classList.contains("active")) renderSgListScreen();
  if ($("#sgEvalHistoryScreen").classList.contains("active")) renderSgEvalHistoryScreen();
  if ($("#sgPerfScreen").classList.contains("active")) renderSgPerfScreen();
  if ($("#hdStatusScreen").classList.contains("active")) renderHdStatusScreen();
  renderKpiStrip();
}

/* ================= SCREEN 4 — 소그룹활동 (메인, 부서별) ================= */
function sgGroupByDept(tasks){
  const groups = {};
  tasks.forEach(t => {
    if (!groups[t.dept]) groups[t.dept] = {};
    if (!groups[t.dept][t.team]) groups[t.dept][t.team] = [];
    groups[t.dept][t.team].push(t);
  });
  return groups;
}

function renderSgMainScreen(){
  const visible = SG_TASKS.filter(t => !favOnlySg || t.favorite);
  const groups = sgGroupByDept(visible);
  const wrap = $("#sgDeptTree");
  wrap.innerHTML = "";

  Object.keys(groups).forEach(dept => {
    const teams = groups[dept];
    let done = 0, inprog = 0;
    Object.values(teams).flat().forEach(t => t.doneYN ? done++ : inprog++);

    const group = document.createElement("div");
    group.className = "dept-group";
    group.innerHTML = `
      <div class="dept-header">
        <div class="dept-name"><span class="dept-caret">▾</span>${dept}</div>
        <div class="dept-counts">진행 <b>${inprog}</b> · 완료 <b>${done}</b></div>
      </div>
      <div class="dept-body"></div>
    `;
    const body = group.querySelector(".dept-body");
    Object.keys(teams).forEach(team => {
      teams[team].forEach(t => {
        const finalGrade = t.eval2.grade || t.eval1.grade || "";
        const gradeBadge = finalGrade
          ? `<span class="cat-dot ${isHighGrade(finalGrade) ? "important" : "normal"}">${finalGrade}등급</span>`
          : `<span class="cat-dot" style="color:var(--ink-soft)">미평가</span>`;
        const row = document.createElement("div");
        row.className = "team-row";
        row.innerHTML = `
          <div class="team-name">${team}</div>
          <div class="task-title-cell">
            <a data-sg-open="${t.id}">${t.title || "(제목 미입력)"}</a>
            <small>${t.current || "—"} → ${t.target || "—"} · ${t.doneYN ? "완료 " + t.doneDate : "진행중"}</small>
          </div>
          <div class="mini-metric"><b>${t.resultLevel || "—"}</b></div>
          <div><span class="sqdc-pill">${t.sqdc || "-"}</span></div>
          <div>${gradeBadge}</div>
          <div class="progress-counts">
            ${(() => { const ea = evalActionFor(t); return ea ? `<button class="eval-btn" data-eval-open="${t.id}" data-eval-round="${ea.round}">📝 ${ea.label}</button>` : ""; })()}
            <button class="star-btn" data-sg-star="${t.id}">${t.favorite ? "★" : "☆"}</button>
          </div>
        `;
        body.appendChild(row);
      });
    });
    group.querySelector(".dept-header").addEventListener("click", () => group.classList.toggle("collapsed"));
    wrap.appendChild(group);
  });

  $all("[data-sg-open]").forEach(a => a.addEventListener("click", (e) => { e.stopPropagation(); openSgTaskModal(a.dataset.sgOpen); }));
  $all("[data-sg-star]").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const t = sgGetTask(btn.dataset.sgStar);
    t.favorite = !t.favorite;
    renderSgMainScreen();
  }));
  $all("[data-eval-open]").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openEvalPopupDirect(btn.dataset.evalOpen, btn.dataset.evalRound);
  }));
}

function bindSgMainToolbar(){
  $("#btnSgmSearch").addEventListener("click", () => { renderSgMainScreen(); toast("소그룹활동 조회 조건으로 재조회했습니다.", "navy"); });
  $("#btnSgmNew").addEventListener("click", openSgRegisterModal);
  $("#btnSgmSave").addEventListener("click", () => toast("변경사항이 저장되었습니다.", "green"));
  $("#btnSgmExport").addEventListener("click", () => toast("출력 미리보기를 생성합니다. (데모)", "navy"));
  $("#btnSgmFavToggle").addEventListener("click", () => {
    favOnlySg = !favOnlySg;
    $("#btnSgmFavToggle").classList.toggle("active-fav", favOnlySg);
    $("#btnSgmFavToggle").textContent = favOnlySg ? "★ 즐겨찾기만" : "☆ 즐겨찾기";
    renderSgMainScreen();
  });
  $("#btnSgmCopy").addEventListener("click", () => {
    const src = sgGetTask(lastViewedSgId) || SG_TASKS[SG_TASKS.length - 1];
    if (!src){ toast("복사할 소그룹활동 과제가 없습니다.", "red"); return; }
    const id = "SG-2026-" + String(sgCounter++).padStart(4, "0");
    const clone = { ...src, id, files: [], doneYN: false, doneDate: null,
      eval1: { grade: "", date: "", checked: 0 }, eval2: { grade: "", date: "", checked: 0 },
      verifyDesc: "", verifyMh: "", stdTimeApplied: false, stdTimeDate: null,
      horizontalDeployments: [],
      favorite: false, regDate: todayStr(), isNew: true };
    SG_TASKS.push(clone);
    toast(`"${src.title}" 등록정보를 복사해 신규 소그룹활동 초안(${id})을 생성했습니다. (btn_copy)`, "navy");
    openSgTaskModal(id);
  });
}

/* ================= SCREEN 4b — 소그룹활동 조회 ================= */
function sgGetTask(id){ return SG_TASKS.find(t => t.id === id); }

/* 평가 액션 판정: 다음에 실시해야 할 평가 차수를 반환 (없으면 null) */
function evalActionFor(t){
  if (!t.title) return null;
  if (!t.eval1.grade) return { round: "eval1", label: "1차평가 실시" };
  if (isHighGrade(t.eval1.grade) && !t.eval2.grade) return { round: "eval2", label: "2차평가 실시" };
  return null;
}

/* 탭/리스트에서 바로 평가 팝업 열기 (등록 모달을 거치지 않는 직접 진입 경로) */
function openEvalPopupDirect(taskId, round){
  activeSgId = taskId;
  lastViewedSgId = taskId;
  openEvalPopup(round);
}

function renderSgListScreen(){
  const uf = $("#sgUser").value.trim().toLowerCase();
  const sqdcF = $("#sgSqdc").value;
  const statusF = $("#sgStatus").value;
  const teamF = $("#sgTeam").value;
  const evalF = $("#sgEvalFilter").value;
  const dFrom = $("#sgDateFrom").value, dTo = $("#sgDateTo").value;
  const permOk = $("#sgPermToggle").checked;

  const filtered = SG_TASKS.filter(t => {
    if (uf && !t.user.toLowerCase().includes(uf)) return false;
    if (sqdcF && t.sqdc !== sqdcF) return false;
    if (statusF && (t.doneYN ? "완료" : "진행") !== statusF) return false;
    if (teamF && t.team !== teamF) return false;
    if (dFrom && t.regDate < dFrom) return false;
    if (dTo && t.regDate > dTo) return false;
    if (evalF){
      const finalGrade = t.eval2.grade || t.eval1.grade || "미평가";
      if (finalGrade !== evalF) return false;
    }
    return true;
  });

  $("#sgListBody").innerHTML = filtered.map(t => {
    const finalGrade = t.eval2.grade || t.eval1.grade || "미평가";
    const ea = evalActionFor(t);
    const evalCell = permOk
      ? `${t.eval1.grade || "—"} / ${isHighGrade(t.eval1.grade) ? (t.eval2.grade || "대기") : "불필요"}${ea ? ` <button class="eval-btn eval-btn-sm" data-eval-open="${t.id}" data-eval-round="${ea.round}">📝 ${ea.label}</button>` : ""}`
      : `<span class="locked-cell">🔒 권한없음</span>`;
    const verifyCell = permOk ? (t.verifyDesc ? "✅ " + (t.stdTimeApplied ? "반영" : "미반영") : "—") : `<span class="locked-cell">🔒</span>`;
    return `
      <tr>
        <td>${t.regDate}</td><td>${t.user}</td><td>${t.team}</td>
        <td style="text-align:left;font-weight:600">${t.title}</td>
        <td><span class="sqdc-pill">${t.sqdc}</span></td>
        <td>${t.current || "—"} / ${t.target || "—"}</td>
        <td>${t.doneYN ? "완료" : "진행"}</td>
        <td>${t.doneDate || "—"}</td>
        <td>${t.files.length ? "📎" + t.files.length : "—"}</td>
        <td>${evalCell}</td>
        <td>${verifyCell}</td>
        <td style="font-size:11px;color:var(--ink-soft)">${finalGrade === "미평가" ? "평가대기" : ""}</td>
      </tr>`;
  }).join("") || `<tr><td colspan="12" style="padding:20px;color:#9AA7B2">조건에 맞는 소그룹활동 과제가 없습니다.</td></tr>`;

  $all("#sgListBody [data-eval-open]").forEach(btn => btn.addEventListener("click", (e) => {
    e.stopPropagation();
    openEvalPopupDirect(btn.dataset.evalOpen, btn.dataset.evalRound);
  }));
}

function bindSgListScreen(){
  $("#btnSgSearch").addEventListener("click", renderSgListScreen);
  $("#sgPermToggle").addEventListener("change", renderSgListScreen);
  const teamSel = $("#sgTeam");
  [...new Set(SG_TASKS.map(t => t.team))].forEach(team => {
    const opt = document.createElement("option");
    opt.value = team; opt.textContent = team;
    teamSel.appendChild(opt);
  });
}

/* ================= SCREEN 5 — 소그룹 평가이력 조회 ================= */
function buildEvalRecords(){
  const records = [];
  SG_TASKS.forEach(t => {
    [["1차", t.eval1], ["2차", t.eval2]].forEach(([round, ev]) => {
      if (!ev || !ev.grade) return;
      records.push({
        taskId: t.id, title: t.title, team: t.team, user: t.user,
        round, grade: ev.grade, date: ev.date, checked: ev.checked,
        verifyDesc: t.verifyDesc, stdTimeApplied: t.stdTimeApplied
      });
    });
  });
  return records.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

/* 분기 계산: today 기준 앞뒤 분기 라벨 생성 */
function currentQuarterLabel(){
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()} Q${q}`;
}
function quarterOptionsAround(){
  const d = new Date();
  const labels = [];
  for (let offset = -1; offset <= 1; offset++){
    const base = new Date(d.getFullYear(), d.getMonth() + offset * 3, 1);
    const q = Math.floor(base.getMonth() / 3) + 1;
    labels.push(`${base.getFullYear()} Q${q}`);
  }
  return [...new Set(labels)];
}

let MAIL_LOG = []; // { date, quarter, count, recipients, caseIds }
let sentRecordKeys = new Set(); // "taskId|round" 이미 발송된 사례

function recordKey(r){ return r.taskId + "|" + r.round; }

/* ---- 수평전개(Horizontal Deployment) ---- */
function buildDeploymentRecords(){
  const records = [];
  SG_TASKS.forEach(t => {
    (t.horizontalDeployments || []).forEach(hd => {
      records.push({ taskId: t.id, title: t.title, team: t.team, workplace: hd.workplace, appliedDate: hd.appliedDate });
    });
  });
  return records.sort((a, b) => (b.appliedDate || "").localeCompare(a.appliedDate || ""));
}

let activeHdTaskId = null;
function openHdPopup(taskId){
  activeHdTaskId = taskId;
  const t = sgGetTask(taskId);
  $("#hdPopupTitle").textContent = `수평전개 적용 등록 — ${t.title}`;
  $("#hdWorkplace").value = "";
  $("#hdDate").value = todayStr();
  renderHdList();
  $("#hdOverlay").classList.add("open");
}
function renderHdList(){
  const t = sgGetTask(activeHdTaskId);
  const list = t.horizontalDeployments || [];
  $("#hdList").innerHTML = list.length ? list.map((hd, i) => `
    <div class="hd-item">
      <div><b>${hd.workplace}</b> <span>적용일 ${hd.appliedDate}</span></div>
      <button class="hd-del" data-hd-del="${i}">삭제</button>
    </div>
  `).join("") : `<div class="hd-empty">아직 등록된 수평전개 이력이 없습니다.</div>`;
  $all("[data-hd-del]").forEach(b => b.addEventListener("click", () => {
    t.horizontalDeployments.splice(+b.dataset.hdDel, 1);
    renderHdList();
    renderSgEvalHistoryScreen();
    if ($("#sgPerfScreen").classList.contains("active")) renderSgPerfScreen();
    if ($("#hdStatusScreen").classList.contains("active")) renderHdStatusScreen();
    renderKpiStrip();
  }));
}
function handleAddDeployment(){
  const t = sgGetTask(activeHdTaskId);
  const workplace = $("#hdWorkplace").value.trim();
  const date = $("#hdDate").value;
  if (!workplace){ toast("적용 작업장/라인명을 입력해 주세요.", "red"); return; }
  if (!date){ toast("적용일을 선택해 주세요.", "red"); return; }
  t.horizontalDeployments = t.horizontalDeployments || [];
  t.horizontalDeployments.push({ workplace, appliedDate: date });
  toast(`"${workplace}" 수평전개 이력이 등록되었습니다.`, "green");
  $("#hdWorkplace").value = "";
  renderHdList();
  renderSgEvalHistoryScreen();
  if ($("#sgPerfScreen").classList.contains("active")) renderSgPerfScreen();
  if ($("#hdStatusScreen").classList.contains("active")) renderHdStatusScreen();
  renderKpiStrip();
}
function bindHdPopup(){
  $("#closeHdPopupBtn").addEventListener("click", () => $("#hdOverlay").classList.remove("open"));
  $("#hdOverlay").addEventListener("click", (e) => { if (e.target.id === "hdOverlay") $("#hdOverlay").classList.remove("open"); });
  $("#hdAddBtn").addEventListener("click", handleAddDeployment);
}

function renderSgEvalHistoryScreen(){
  const all = buildEvalRecords();
  const gradeF = $("#ehGrade").value;
  const roundF = $("#ehRound").value;
  const teamF = $("#ehTeam").value;
  const dFrom = $("#ehDateFrom").value, dTo = $("#ehDateTo").value;

  const filtered = all.filter(r => {
    if (gradeF && r.grade !== gradeF) return false;
    if (roundF && r.round !== roundF) return false;
    if (teamF && r.team !== teamF) return false;
    if (dFrom && r.date && r.date < dFrom) return false;
    if (dTo && r.date && r.date > dTo) return false;
    return true;
  });

  /* ---- 고등급(S+·S·A) 사례 멀티셀렉트 + 메일 발송 테이블 ---- */
  const highCases = all.filter(r => isHighGrade(r.grade));
  const highBody = $("#highGradeBody");
  highBody.innerHTML = highCases.length ? highCases.map(r => {
    const key = recordKey(r);
    const sent = sentRecordKeys.has(key);
    const t = sgGetTask(r.taskId);
    const hdCount = (t && t.horizontalDeployments) ? t.horizontalDeployments.length : 0;
    return `
      <tr>
        <td><input type="checkbox" class="high-chk" data-key="${key}" ${sent ? "disabled" : ""}></td>
        <td><span class="grade-pill grade-${gradeSlug(r.grade)}">${r.grade}</span></td>
        <td>${r.round}</td><td>${r.date}</td><td>${r.team}</td>
        <td style="text-align:left;font-weight:600">${r.title}</td>
        <td style="text-align:left;font-size:11.5px">${r.verifyDesc || "—"}</td>
        <td>${sent ? `<span class="sent-tag">✅ 발송완료</span>` : "미발송"}</td>
        <td><button class="hd-count-btn" data-hd-open="${r.taskId}">🔁 ${hdCount}건</button></td>
      </tr>`;
  }).join("") : `<tr><td colspan="9" style="padding:16px;color:#9AA7B2">고등급(S+·S·A) 사례가 아직 없습니다.</td></tr>`;

  $all(".high-chk").forEach(chk => chk.addEventListener("change", updateSendMailBtn));
  $all("[data-hd-open]").forEach(b => b.addEventListener("click", () => openHdPopup(b.dataset.hdOpen)));
  updateSendMailBtn();
  renderMailLog();

  /* ---- 전체 평가이력 표 ---- */
  $("#ehBody").innerHTML = filtered.map(r => `
    <tr>
      <td>${r.round}</td><td>${r.date}</td><td>${r.team}</td>
      <td style="text-align:left;font-weight:600">${r.title}</td>
      <td><span class="grade-pill grade-${gradeSlug(r.grade)}">${r.grade}</span></td>
      <td>${r.checked}건</td>
      <td style="text-align:left;font-size:11.5px">${r.verifyDesc || "—"}</td>
      <td>${r.stdTimeApplied ? "✅ 반영" : "—"}</td>
    </tr>
  `).join("") || `<tr><td colspan="8" style="padding:20px;color:#9AA7B2">조건에 맞는 평가이력이 없습니다.</td></tr>`;
}

function updateSendMailBtn(){
  const checked = $all(".high-chk:checked").length;
  $("#btnSendMail").disabled = checked === 0;
  $("#btnSendMail").textContent = checked > 0 ? `📧 선택 항목 메일 발송 (${checked}건)` : "📧 선택 항목 메일 발송";
}

function renderMailLog(){
  const log = $("#mailLog");
  if (!MAIL_LOG.length){ log.innerHTML = ""; return; }
  log.innerHTML = "<div style='font-size:11.5px;font-weight:700;color:var(--ink-soft);margin-bottom:4px'>발송 이력</div>" +
    MAIL_LOG.slice().reverse().map(m => `
      <div class="mail-log-item">
        📧 <b>${m.quarter}</b> 분기 배포 · ${m.date} · 고등급 사례 <b>${m.count}건</b> → ${m.recipients}
      </div>
    `).join("");
}

function handleSendMail(){
  const checked = [...$all(".high-chk:checked")];
  if (!checked.length){ toast("발송할 고등급 사례를 선택해 주세요.", "red"); return; }
  const all = buildEvalRecords();
  const keys = checked.map(c => c.dataset.key);
  const selectedRecords = all.filter(r => keys.includes(recordKey(r)));
  const teams = [...new Set(selectedRecords.map(r => r.team))];
  const quarter = $("#mailQuarter").value;
  const recipients = `관리자 그룹(생산혁신팀 임원진) + 현업 담당팀(${teams.join(", ")})`;

  keys.forEach(k => sentRecordKeys.add(k));
  MAIL_LOG.push({ date: todayStr(), quarter, count: selectedRecords.length, recipients, caseIds: keys });

  toast(`${quarter} 분기 고등급 사례 ${selectedRecords.length}건을 ${recipients}에 메일 발송했습니다.`, "green");
  renderSgEvalHistoryScreen();
}

function bindSgEvalHistoryScreen(){
  $("#btnEhSearch").addEventListener("click", renderSgEvalHistoryScreen);
  const teamSel = $("#ehTeam");
  [...new Set(SG_TASKS.map(t => t.team))].forEach(team => {
    const opt = document.createElement("option");
    opt.value = team; opt.textContent = team;
    teamSel.appendChild(opt);
  });

  const qSel = $("#mailQuarter");
  quarterOptionsAround().forEach(q => {
    const opt = document.createElement("option");
    opt.value = q; opt.textContent = q;
    if (q === currentQuarterLabel()) opt.selected = true;
    qSel.appendChild(opt);
  });

  $("#chkAllHigh").addEventListener("change", (e) => {
    $all(".high-chk:not(:disabled)").forEach(c => c.checked = e.target.checked);
    updateSendMailBtn();
  });
  $("#btnSelectAllHigh").addEventListener("click", () => {
    $all(".high-chk:not(:disabled)").forEach(c => c.checked = true);
    $("#chkAllHigh").checked = true;
    updateSendMailBtn();
  });
  $("#btnSendMail").addEventListener("click", handleSendMail);
}

/* ================= SCREEN 6 — 소그룹 성과 대시보드 (발굴율) ================= */
function dateToQuarterLabel(dateStr){
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()} Q${q}`;
}
function dateToYear(dateStr){
  if (!dateStr) return null;
  return dateStr.slice(0, 4);
}

function aggregateBy(records, keyFn){
  const map = {};
  records.forEach(r => {
    const key = keyFn(r.date);
    if (!key) return;
    if (!map[key]) map[key] = { total: 0, high: 0 };
    map[key].total++;
    if (isHighGrade(r.grade)) map[key].high++;
  });
  return map;
}

function renderRateChart(chartEl, tableEl, map, unitLabel){
  const labels = Object.keys(map).sort();
  chartEl.innerHTML = "";
  const maxTotal = Math.max(1, ...labels.map(l => map[l].total));

  labels.forEach(label => {
    const { total, high } = map[label];
    const normal = total - high;
    const rate = total ? Math.round((high / total) * 100) : 0;
    const highH = Math.round((high / maxTotal) * 140);
    const normalH = Math.round((normal / maxTotal) * 140);
    const col = document.createElement("div");
    col.className = "bar-col";
    col.innerHTML = `
      <div class="bar-rate">${rate}%</div>
      <div class="bar-stack" style="height:${Math.max(highH + normalH, 2)}px">
        <div class="bar-seg-inprog" style="height:${normalH}px" title="일반 ${normal}건"></div>
        <div class="bar-seg-done" style="height:${highH}px" title="고등급 ${high}건"></div>
      </div>
      <div class="bar-label">${label}<br><b>${total}건</b></div>
    `;
    chartEl.appendChild(col);
  });
  if (!labels.length){
    chartEl.innerHTML = `<div class="case-empty" style="padding:20px">${unitLabel} 평가 데이터가 아직 없습니다.</div>`;
  }

  tableEl.innerHTML = `<tr><th>${unitLabel}</th><th>전체 평가건수</th><th>고등급(S+·S·A)</th><th>발굴율</th></tr>` +
    labels.map(label => {
      const { total, high } = map[label];
      const rate = total ? Math.round((high / total) * 100) : 0;
      return `<tr><th>${label}</th><td>${total}</td><td>${high}</td><td class="${rate >= 50 ? "rate-high" : ""}">${rate}%</td></tr>`;
    }).join("");
}

function aggregateCountBy(records, keyFn, dateField){
  const map = {};
  records.forEach(r => {
    const key = keyFn(r[dateField]);
    if (!key) return;
    map[key] = (map[key] || 0) + 1;
  });
  return map;
}

function computeHdStats(){
  const evalRecords = buildEvalRecords();
  const deployRecords = buildDeploymentRecords();
  const highTaskIds = new Set(evalRecords.filter(r => isHighGrade(r.grade)).map(r => r.taskId));
  const noDeployCount = [...highTaskIds].filter(id => {
    const t = sgGetTask(id);
    return !t || !(t.horizontalDeployments && t.horizontalDeployments.length);
  }).length;
  const highCount = evalRecords.filter(r => isHighGrade(r.grade)).length;
  const deployCount = deployRecords.length;
  const rate = highCount ? Math.round((deployCount / highCount) * 100) : 0;
  return { highCount, deployCount, rate, noDeployCount };
}

function renderHdStatStrip(){
  const s = computeHdStats();
  $("#hdStatStrip").innerHTML = `
    <div class="stat-card accent-navy"><span class="stat-label">누적 고등급 발굴건수</span><span class="stat-value">${s.highCount}</span></div>
    <div class="stat-card accent-amber"><span class="stat-label">수평전개 적용건수</span><span class="stat-value">${s.deployCount}</span></div>
    <div class="stat-card accent-red"><span class="stat-label">수평전개율</span><span class="stat-value">${s.rate}%</span></div>
    <div class="stat-card"><span class="stat-label">미전개 고등급 사례</span><span class="stat-value">${s.noDeployCount}</span></div>
  `;
}

function renderTrendChart(chartEl, tableEl, highMap, deployMap){
  const labels = [...new Set([...Object.keys(highMap), ...Object.keys(deployMap)])].sort();
  if (!labels.length){
    chartEl.innerHTML = `<div class="case-empty" style="padding:20px">분기 추이 데이터가 아직 없습니다.</div>`;
    tableEl.innerHTML = "";
    return;
  }
  const w = 680, h = 190, padL = 34, padR = 16, padT = 16, padB = 26;
  const maxVal = Math.max(1, ...labels.map(l => Math.max(highMap[l] || 0, deployMap[l] || 0)));
  const stepX = labels.length > 1 ? (w - padL - padR) / (labels.length - 1) : 0;
  const yFor = (v) => padT + (h - padT - padB) * (1 - v / maxVal);
  const xFor = (i) => padL + stepX * i;

  const gridLines = [0, 0.5, 1].map(f => {
    const y = padT + (h - padT - padB) * f;
    const val = Math.round(maxVal * (1 - f));
    return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#E2E8EE" stroke-width="1"/><text x="2" y="${y + 4}" font-size="10" fill="#8792A0">${val}</text>`;
  }).join("");

  const highPts = labels.map((l, i) => `${xFor(i)},${yFor(highMap[l] || 0)}`).join(" ");
  const depPts = labels.map((l, i) => `${xFor(i)},${yFor(deployMap[l] || 0)}`).join(" ");
  const highDots = labels.map((l, i) => `<circle cx="${xFor(i)}" cy="${yFor(highMap[l] || 0)}" r="3.5" fill="#2C5F8A"/>`).join("");
  const depDots = labels.map((l, i) => `<circle cx="${xFor(i)}" cy="${yFor(deployMap[l] || 0)}" r="3.5" fill="#E8A23D"/>`).join("");
  const xLabels = labels.map((l, i) => `<text x="${xFor(i)}" y="${h - 8}" font-size="10" fill="#8792A0" text-anchor="middle">${l}</text>`).join("");

  chartEl.innerHTML = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    ${gridLines}
    <polyline points="${highPts}" fill="none" stroke="#2C5F8A" stroke-width="2.5"/>
    <polyline points="${depPts}" fill="none" stroke="#E8A23D" stroke-width="2.5"/>
    ${highDots}${depDots}${xLabels}
  </svg>`;

  tableEl.innerHTML = `<tr><th>분기</th><th>고등급 발굴건수</th><th>수평전개 적용건수</th><th>전개율</th></tr>` +
    labels.map(l => {
      const hv = highMap[l] || 0, dv = deployMap[l] || 0;
      const rate = hv ? Math.round((dv / hv) * 100) : 0;
      return `<tr><th>${l}</th><td>${hv}</td><td>${dv}</td><td class="${rate >= 50 ? "rate-high" : ""}">${rate}%</td></tr>`;
    }).join("");
}

function renderSgPerfScreen(){
  const all = buildEvalRecords();
  const byQuarter = aggregateBy(all, dateToQuarterLabel);
  const byYear = aggregateBy(all, dateToYear);
  renderRateChart($("#perfQuarterChart"), $("#perfQuarterTable"), byQuarter, "분기");
  renderRateChart($("#perfYearChart"), $("#perfYearTable"), byYear, "연도");

  renderHdStatStrip();
  const deployRecords = buildDeploymentRecords();
  const highOnly = all.filter(r => isHighGrade(r.grade));
  const quarterHighMap = aggregateCountBy(highOnly, dateToQuarterLabel, "date");
  const quarterDeployMap = aggregateCountBy(deployRecords, dateToQuarterLabel, "appliedDate");
  renderTrendChart($("#hdTrendChart"), $("#hdTrendTable"), quarterHighMap, quarterDeployMap);
}

/* ================= SCREEN — 수평전개 팀·작업장 현황 ================= */
function teamDiscoveryRanking(){
  const map = {};
  buildEvalRecords().filter(r => isHighGrade(r.grade)).forEach(r => {
    map[r.team] = (map[r.team] || 0) + 1;
  });
  return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function workplaceApplyRanking(){
  const map = {};
  buildDeploymentRecords().forEach(r => {
    map[r.workplace] = (map[r.workplace] || 0) + 1;
  });
  return Object.entries(map).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function renderRankList(el, data, type){
  if (!data.length){ el.innerHTML = `<div class="case-empty">데이터가 아직 없습니다.</div>`; return; }
  const max = Math.max(1, ...data.map(d => d.count));
  el.innerHTML = data.map(d => `
    <div class="rank-row">
      <div class="rank-label" title="${d.label}">${d.label}</div>
      <div class="rank-track"><div class="rank-fill ${type}" style="width:${Math.max(Math.round((d.count / max) * 100), 12)}%">${d.count}건</div></div>
      <div class="rank-count">${d.count}건</div>
    </div>
  `).join("");
}

function renderHdStatusScreen(){
  const discoverRanking = teamDiscoveryRanking();
  const applyRanking = workplaceApplyRanking();
  const topDiscover = discoverRanking[0];
  const topApply = applyRanking[0];

  $("#hdStatusStrip").innerHTML = `
    <div class="stat-card accent-navy"><span class="stat-label">고등급 발굴팀 수</span><span class="stat-value">${discoverRanking.length}</span></div>
    <div class="stat-card accent-amber"><span class="stat-label">수평전개 적용 작업장 수</span><span class="stat-value">${applyRanking.length}</span></div>
    <div class="stat-card accent-green"><span class="stat-label">최다 발굴팀</span><span class="stat-value" style="font-size:16px">${topDiscover ? topDiscover.label : "—"}<small>${topDiscover ? " " + topDiscover.count + "건" : ""}</small></span></div>
    <div class="stat-card accent-red"><span class="stat-label">최다 적용 작업장</span><span class="stat-value" style="font-size:16px">${topApply ? topApply.label : "—"}<small>${topApply ? " " + topApply.count + "건" : ""}</small></span></div>
  `;

  renderRankList($("#discoverRankList"), discoverRanking, "discover");
  renderRankList($("#applyRankList"), applyRanking, "apply");

  const details = buildDeploymentRecords().map(r => {
    const t = sgGetTask(r.taskId);
    const grade = t ? (t.eval2.grade || t.eval1.grade || "-") : "-";
    return { ...r, originTeam: t ? t.team : r.team, grade };
  }).sort((a, b) => (b.appliedDate || "").localeCompare(a.appliedDate || ""));

  $("#hdDetailBody").innerHTML = details.length ? details.map(r => `
    <tr>
      <td>${r.originTeam}</td>
      <td style="text-align:left;font-weight:600">${r.title}</td>
      <td><span class="grade-pill grade-${gradeSlug(r.grade)}">${r.grade}</span></td>
      <td>${r.workplace}</td>
      <td>${r.appliedDate}</td>
    </tr>
  `).join("") : `<tr><td colspan="5" style="padding:20px;color:#9AA7B2">수평전개 이력이 아직 없습니다.</td></tr>`;
}

/* ================= SCREEN — 통합기준정보 ================= */
let MASTER_DEPT_USE = {};        // key `${dept}|${team}` -> boolean (기본 true)
let MASTER_WORKPLACE_USE = {};   // key workplace -> boolean (기본 true)
let MASTER_USER_EVAL_AUTH = { "이향기": true, "정민아": true };  // key user -> boolean (기본 false, 평가권한자 일부 시드)

function buildDeptTeamMaster(){
  const map = {};
  TASKS.forEach(t => {
    const key = t.dept + "|" + t.team;
    if (!map[key]) map[key] = { key, dept: t.dept, team: t.team, problemCount: 0, sgCount: 0 };
    map[key].problemCount++;
  });
  SG_TASKS.forEach(t => {
    const key = t.dept + "|" + t.team;
    if (!map[key]) map[key] = { key, dept: t.dept, team: t.team, problemCount: 0, sgCount: 0 };
    map[key].sgCount++;
  });
  return Object.values(map).sort((a, b) => a.dept.localeCompare(b.dept) || a.team.localeCompare(b.team));
}

function buildWorkplaceMaster(){
  const map = {};
  buildDeploymentRecords().forEach(r => { map[r.workplace] = (map[r.workplace] || 0) + 1; });
  return Object.entries(map).map(([workplace, count]) => ({ workplace, count })).sort((a, b) => b.count - a.count);
}

function buildUserMaster(){
  const map = {};
  TASKS.forEach(t => {
    if (!map[t.user]) map[t.user] = { user: t.user, team: t.team, problemCount: 0, sgCount: 0 };
    map[t.user].problemCount++;
  });
  SG_TASKS.forEach(t => {
    if (!map[t.user]) map[t.user] = { user: t.user, team: t.team, problemCount: 0, sgCount: 0 };
    map[t.user].sgCount++;
  });
  return Object.values(map).sort((a, b) => a.user.localeCompare(b.user));
}

function renderMasterDataScreen(){
  const deptRows = buildDeptTeamMaster();
  $("#masterDeptBody").innerHTML = deptRows.length ? deptRows.map(r => {
    const use = MASTER_DEPT_USE[r.key] !== false;
    return `<tr>
      <td>${r.dept}</td><td>${r.team}</td><td>${r.problemCount}</td><td>${r.sgCount}</td>
      <td><label class="chk"><input type="checkbox" ${use ? "checked" : ""} data-master-dept="${r.key}"> 사용</label></td>
    </tr>`;
  }).join("") : `<tr><td colspan="5" style="padding:20px;color:#9AA7B2">등록된 부서/팀이 없습니다.</td></tr>`;

  const wpRows = buildWorkplaceMaster();
  $("#masterWorkplaceBody").innerHTML = wpRows.length ? wpRows.map(r => {
    const use = MASTER_WORKPLACE_USE[r.workplace] !== false;
    return `<tr>
      <td style="text-align:left;font-weight:600">${r.workplace}</td><td>${r.count}</td>
      <td><label class="chk"><input type="checkbox" ${use ? "checked" : ""} data-master-wp="${r.workplace}"> 사용</label></td>
    </tr>`;
  }).join("") : `<tr><td colspan="3" style="padding:20px;color:#9AA7B2">등록된 작업장/라인이 없습니다.</td></tr>`;

  const userRows = buildUserMaster();
  $("#masterUserBody").innerHTML = userRows.length ? userRows.map(r => {
    const auth = MASTER_USER_EVAL_AUTH[r.user] === true;
    return `<tr>
      <td style="text-align:left;font-weight:600">${r.user}</td><td>${r.team}</td><td>${r.problemCount}</td><td>${r.sgCount}</td>
      <td><label class="chk"><input type="checkbox" ${auth ? "checked" : ""} data-master-eval-auth="${r.user}"> 평가권한</label></td>
    </tr>`;
  }).join("") : `<tr><td colspan="5" style="padding:20px;color:#9AA7B2">등록된 담당자가 없습니다.</td></tr>`;

  $all("[data-master-dept]").forEach(cb => cb.addEventListener("change", () => {
    MASTER_DEPT_USE[cb.dataset.masterDept] = cb.checked;
    toast(`${cb.dataset.masterDept.replace("|", " / ")} 사용여부가 ${cb.checked ? "사용" : "미사용"}으로 변경되었습니다.`, cb.checked ? "green" : "red");
  }));
  $all("[data-master-wp]").forEach(cb => cb.addEventListener("change", () => {
    MASTER_WORKPLACE_USE[cb.dataset.masterWp] = cb.checked;
    toast(`"${cb.dataset.masterWp}" 사용여부가 ${cb.checked ? "사용" : "미사용"}으로 변경되었습니다.`, cb.checked ? "green" : "red");
  }));
  $all("[data-master-eval-auth]").forEach(cb => cb.addEventListener("change", () => {
    MASTER_USER_EVAL_AUTH[cb.dataset.masterEvalAuth] = cb.checked;
    toast(`${cb.dataset.masterEvalAuth}님의 소그룹 평가권한이 ${cb.checked ? "부여" : "회수"}되었습니다.`, cb.checked ? "green" : "red");
  }));
}

/* ================= 소그룹활동 등록/평가 모달 ================= */
let activeSgId = null;
let lastViewedSgId = null;
let favOnlySg = false;
let evalPopupCtx = null; // 'eval1' | 'eval2'

function openSgRegisterModal(){
  const id = "SG-2026-" + String(sgCounter++).padStart(4, "0");
  SG_TASKS.push({
    id, dept: CURRENT_USER.dept, team: CURRENT_USER.team, user: CURRENT_USER.name,
    improve: "품질 개선", sqdc: "", title: "", phenomenon: "", current: "", target: "",
    files: [], resultLevel: "", doneYN: false, doneDate: null,
    eval1: { grade: "", date: "", checked: 0 }, eval2: { grade: "", date: "", checked: 0 },
    verifyDesc: "", verifyMh: "", stdTimeApplied: false, stdTimeDate: null,
    horizontalDeployments: [],
    favorite: false, regDate: todayStr(), isNew: true
  });
  openSgTaskModal(id);
}

function openSgTaskModal(id){
  activeSgId = id;
  lastViewedSgId = id;
  const t = sgGetTask(id);
  $("#sgModalTitle").textContent = t.isNew ? "소그룹활동 과제 등록" : `소그룹활동 과제 — ${t.id}`;
  $("#sgRegDate").value = t.regDate;
  $("#sgUserField").value = t.user;
  $("#sgTeamField").value = t.team;
  $("#sgImprove").value = t.improve;
  $("#sgSqdcField").value = t.sqdc;
  $("#sgTitle").value = t.title;
  $("#sgPhenomenon").value = t.phenomenon;
  $("#sgCurrent").value = t.current;
  $("#sgTarget").value = t.target;
  $("#sgResultLevel").value = t.resultLevel;
  $("#sgDoneYN").checked = t.doneYN;
  $("#sgDoneDate").textContent = "완료일 " + (t.doneDate || "—");
  $("#sgVerifyDesc").value = t.verifyDesc;
  $("#sgVerifyMh").value = t.verifyMh;
  $("#sgStdTime").checked = t.stdTimeApplied;
  $("#sgStdTimeDate").textContent = "완료 저장일 " + (t.stdTimeDate || "—");

  $("#sgFiles").innerHTML = fileRowsHtml(t.files);

  // 평가 버튼 활성화 조건
  const hasTitle = !!t.title;
  $("#openEval1Btn").disabled = !hasTitle;
  $("#eval1Result").textContent = t.eval1.grade ? `${t.eval1.grade}등급 · ${t.eval1.date} (점검 ${t.eval1.checked}건 충족)` : "미평가";
  $("#eval1Result").className = "eval-result" + (t.eval1.grade ? " grade-" + gradeSlug(t.eval1.grade) : "");

  const eval2Eligible = isHighGrade(t.eval1.grade);
  $("#eval2Block").style.opacity = eval2Eligible ? "1" : ".5";
  $("#openEval2Btn").disabled = !eval2Eligible;
  $("#eval2Result").textContent = !eval2Eligible ? "대상 아님 (1차 고등급 S+·S·A만 해당)" : (t.eval2.grade ? `${t.eval2.grade}등급 · ${t.eval2.date}` : "미평가");
  $("#eval2Result").className = "eval-result" + (eval2Eligible && t.eval2.grade ? " grade-" + gradeSlug(t.eval2.grade) : "");

  $("#sgOverlay").classList.add("open");
}

function closeSgModal(){
  $("#sgOverlay").classList.remove("open");
  const t = sgGetTask(activeSgId);
  if (t && t.isNew && !t.title){ SG_TASKS = SG_TASKS.filter(x => x.id !== activeSgId); }
  activeSgId = null;
  refreshSgScreens();
}

function saveSgRegistration(){
  const t = sgGetTask(activeSgId);
  const title = $("#sgTitle").value.trim();
  if (!title){ toast("제목을 입력해 주세요.", "red"); return; }
  t.title = title;
  t.improve = $("#sgImprove").value;
  t.sqdc = $("#sgSqdcField").value;
  t.phenomenon = $("#sgPhenomenon").value.trim();
  t.current = $("#sgCurrent").value.trim();
  t.target = $("#sgTarget").value.trim();
  t.resultLevel = $("#sgResultLevel").value.trim();
  t.doneYN = $("#sgDoneYN").checked;
  t.doneDate = t.doneYN ? (t.doneDate || todayStr()) : null;
  t.verifyDesc = $("#sgVerifyDesc").value.trim();
  t.verifyMh = $("#sgVerifyMh").value.trim();
  t.stdTimeApplied = $("#sgStdTime").checked;
  t.stdTimeDate = t.stdTimeApplied ? (t.stdTimeDate || todayStr()) : null;
  t.isNew = false;
  toast("소그룹활동 과제가 저장되었습니다.", "green");
  openSgTaskModal(t.id);
  refreshSgScreens();
}

function openEvalPopup(which){
  evalPopupCtx = which;
  const t = sgGetTask(activeSgId);
  $("#evalPopupTitle").textContent = which === "eval1" ? "소그룹활동 1차평가표" : "소그룹활동 2차평가표";
  $("#evalDate").value = todayStr();
  const items = S5S_ITEMS.filter(it => it.team === t.team && it.use === "사용");
  const list = items.length ? items : S5S_ITEMS.filter(it => it.use === "사용");
  $("#evalChecklist").innerHTML = list.map(it => `
    <label><input type="checkbox" checked data-eval-item="${it.no}"> [${it.type}] ${it.name}</label>
  `).join("") || "<p style='font-size:12px;color:#9AA7B2'>사용 중인 5S 점검항목이 없습니다.</p>";
  $("#evalGrade").value = "A";
  $("#evalPopupOverlay").classList.add("open");
}

function saveEvalPopup(){
  const t = sgGetTask(activeSgId);
  const checked = $all("[data-eval-item]:checked").length;
  const grade = $("#evalGrade").value;
  const date = $("#evalDate").value;
  const record = { grade, date, checked };
  if (evalPopupCtx === "eval1") t.eval1 = record;
  else t.eval2 = record;
  $("#evalPopupOverlay").classList.remove("open");
  toast(`${evalPopupCtx === "eval1" ? "1차" : "2차"}평가 저장 완료 — ${grade}등급`, "green");
  openSgTaskModal(t.id);
  refreshSgScreens();
}

function bindSgModal(){
  $("#closeSgModalBtn").addEventListener("click", closeSgModal);
  $("#sgOverlay").addEventListener("click", (e) => { if (e.target.id === "sgOverlay") closeSgModal(); });
  $("#sgConfirmBtn").addEventListener("click", saveSgRegistration);
  $("#openEval1Btn").addEventListener("click", () => openEvalPopup("eval1"));
  $("#openEval2Btn").addEventListener("click", () => openEvalPopup("eval2"));
  $("#closeEvalPopupBtn").addEventListener("click", () => $("#evalPopupOverlay").classList.remove("open"));
  $("#evalPopupOverlay").addEventListener("click", (e) => { if (e.target.id === "evalPopupOverlay") $("#evalPopupOverlay").classList.remove("open"); });
  $("#saveEvalBtn").addEventListener("click", saveEvalPopup);
  $("#sgAddFileBtn").addEventListener("click", () => { fileTargetCtx = "SG"; $("#hiddenFileInput").value = ""; $("#hiddenFileInput").click(); });
}

/* ================= ADMIN DRAWER ================= */
function bindAdmin(){
  $("#openAdminBtn").addEventListener("click", () => $("#adminOverlay").classList.add("open"));
  $("#openAdminFromHook").addEventListener("click", () => $("#adminOverlay").classList.add("open"));
  $("#closeAdminBtn").addEventListener("click", () => $("#adminOverlay").classList.remove("open"));
  $("#adminOverlay").addEventListener("click", (e) => { if (e.target.id === "adminOverlay") $("#adminOverlay").classList.remove("open"); });

  $("#cfgNoti").addEventListener("input", (e) => { CONFIG.noti = +e.target.value; renderConfigPreview(); refreshAllScreens(); });
  $("#cfgEsc").addEventListener("input", (e) => { CONFIG.esc = +e.target.value; renderConfigPreview(); refreshAllScreens(); });
  $("#cfgPost").addEventListener("input", (e) => {
    CONFIG.post = +e.target.value;
    renderConfigPreview();
    if (activeTaskId){ const t = getTask(activeTaskId); if (t && t.registered) renderPostcheck(t); }
    refreshAllScreens();
  });
}
function renderConfigPreview(){
  $("#cfgNotiVal").textContent = CONFIG.noti;
  $("#cfgEscVal").textContent = CONFIG.esc;
  $("#cfgPostVal").textContent = CONFIG.post;
  $("#cfgPreviewText").innerHTML =
    `현재 정책: <b>${CONFIG.noti}일</b>마다 리마인드, <b>${CONFIG.esc}일</b> 경과 시 에스컬레이션 가속, <b>M+${CONFIG.post}</b> 시점 최종 검증`;
}

/* ================= INIT ================= */
function bindEvents(){
  $("#closeModalBtn").addEventListener("click", closeTaskModal);
  $("#taskOverlay").addEventListener("click", (e) => { if (e.target.id === "taskOverlay") closeTaskModal(); });
  $("#confirmRegBtn").addEventListener("click", confirmRegistration);
  $("#stageActionBtn").addEventListener("click", handleStageAction);
  $("#passM3Btn").addEventListener("click", handlePassM3);
  $("#failM3Btn").addEventListener("click", handleFailM3);
  $("#favBtn").addEventListener("click", () => {
    const t = getTask(activeTaskId);
    if (!t) return;
    t.favorite = !t.favorite;
    $("#favBtn").textContent = t.favorite ? "★" : "☆";
    $("#favBtn").classList.toggle("active", t.favorite);
  });

  $all('[data-add-file]').forEach(b => b.addEventListener("click", () => handleAddFile(b.dataset.addFile)));
  $("#hiddenFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !fileTargetCtx) return;
    const entry = { name: file.name, date: todayStr() };
    if (fileTargetCtx === "SG"){
      const st = sgGetTask(activeSgId);
      st.files.push(entry);
      toast(`파일 "${file.name}" 첨부 완료`, "green");
      $("#sgFiles").innerHTML = fileRowsHtml(st.files);
      return;
    }
    const t = getTask(activeTaskId);
    if (fileTargetCtx === "P") t.filesP.push(entry); else t.filesDCA.push(entry);
    toast(`파일 "${file.name}" 첨부 완료`, "green");
    renderStageBlocks(t);
  });

  $("#fResult").addEventListener("input", () => {
    $("#fResult").classList.remove("invalid");
    $("#resultHint").textContent = "숫자 형식만 허용됩니다 (정규식 검증)";
    $("#resultHint").classList.remove("error");
  });

  bindTabs();
  bindMainToolbar();
  bindListScreen();
  bindDashScreen();
  bindRegenTrendScreen();
  bindAdmin();
  bindTypeSelect();
  bindSgListScreen();
  bindSgMainToolbar();
  bindSgEvalHistoryScreen();
  bindHdPopup();
  bindSgModal();
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderMainScreen();
  renderKpiStrip();
});
