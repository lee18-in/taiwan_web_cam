<!-- Playbook-Version: 15 -->
<!-- Playbook-Variant: online -->
# AGENTS.md — AI agent 最高指令

> - **Language and Encoding Standards**: All system files, code annotations, memory files (`LLM_MEMORY.md`), and handover logs for this project are uniformly encoded in **UTF-8** and **Traditional Chinese** by default.

## 0. 強制第一步

動作前先讀**本檔 dir** `LLM_MEMORY.md`、`COMPONENT_MAP.md`（認 file 位置不認 CWD，禁寫 `./` 防指錯上層）。**純唯讀問答不改 file，讀畢三檔即答，免自檢/覆蓋基準/寫 log**；改 file、§2.1 review 或開工走序：**讀三檔 → 環境自檢 → 髒樹先保存(§2) → 有待審先審閱(§2.1) → 覆蓋 `交接基準 commit`(§2) → 開工**，完工更新同 `LLM_MEMORY.md`〈交接日誌〉、〈目前狀態〉。
- **環境自檢**：接手跑 `git config --get core.hooksPath`：空且 repo 根有 `scripts/hooks/`（含 `pre-commit`/`commit-msg`）則設 `git config core.hooksPath scripts/hooks` 並 `chmod +x scripts/hooks/*`，記〈地雷警告〉；**缺 dir/script 留空勿強設**，〈地雷警告〉註未裝 hook（獨立新條目須先走〈待審下壓保護〉）。已有他值（如 `agent-hooks`）勿覆寫；`chmod` 失敗不中斷，免每輪問 user。

### 三檔分工

- `AGENTS.md`（本檔）：不變憲法，各 repo 一致，不記專案差異。
- `LLM_MEMORY.md`（會衰減）：狀態、下一步、交接 log；隨時間封存，禁放長期技術實況。
- `COMPONENT_MAP.md`（不衰減）：開頭須有〈六十秒進入狀況〉（缺則補；無檔則本 dir 建空殼再讀），存結構/跨模組契約、build/test 指令與 code 慣例（隨實況更新）、決策/否決理由、環境條件、驗證台帳；**僅存已驗證事實與已定案決策，禁寫猜想與未定案討論**。
- **精省原則**：三檔與 log 採電報體省 context/token——去贅字、助詞、空泛動詞(進行/執行)與純語法量詞，專有/常見詞(單 token 原詞如 code/test/config/script/path/data/file/dir/log/review/user)直寫原文免強翻繁中；**禁省**物理單位、否定強制字、量化門檻與契約錨點。

### 防膨脹維護

- **〈交接日誌〉> 10 KB**(計 bytes)：先確認不衰減知識已入 `COMPONENT_MAP.md`（漏補萃取，禁丟棄），壓最舊條目入〈已封存結論〉至門檻下；〈已封存結論〉過長整段搬同 dir `ARCHIVE.md`（非必讀，按需查）。
- **`LLM_MEMORY.md` 整檔 > 16 KB**：清 A 區已解除舊紀錄、外移/封存過期 B 區至同 dir `ARCHIVE.md` 或按需子檔，去重與 `COMPONENT_MAP.md` 重疊項（禁刪未結待審與進行中紅線）。
- **`COMPONENT_MAP.md` > 16 KB**：分流至門檻下（核心紅線/契約不為湊字硬刪）：
  * **失效/被取代歷史**（舊架構、過期台帳）→ 同 dir `ARCHIVE.md`。
  * **有效冗長明細**（長表、大 spec、長驗證紀錄）→ 同 dir 按需子檔（如 `docs/`），**禁混 `ARCHIVE.md`**。
  * **主檔必留**：〈六十秒進入狀況〉、核心契約與紅線、外移子檔指路(path＋範圍)；禁刪模糊或拆碎。
- **不綁階段**：任一階段超標皆須順手處理。

### 交接日誌書寫規範

- **寫入分流（最優先）**：log 僅記事件（完成了什麼/驗證方式/下一步/地雷警告）；不衰減知識（決策理由/失敗方案/驗證方法/環境條件/跨次踩坑）**當場入 `COMPONENT_MAP.md`**，log「為何改」限 1 行指路。
- **必填 `驗證方式:`**：未驗證明寫「未驗證」；宣告機制或 `.gitignore` 生效須附實測輸出（如 `git check-ignore -v`）。
- **單筆上限約 1200 bytes**；標題 `### YYYY-MM-DD HH:MM [階段] <工具>`。
- **待審下壓保護**：追加前（含環境自檢或保存現場〈地雷警告〉獨立新條目），原首筆含未結「需要審閱」須先抄入 A 區〈阻塞點〉（含基準 commit 範圍）。
- **時序與防併發**：時間戳取本輪系統 metadata（須含本機時分，否則用指令；禁推算），晚於首筆並維持全份遞減；多 agent 併發、拉遠端或 `edit` 匹配失敗先重讀 `LLM_MEMORY.md`。
- 同 session 連續小改更新首筆；換手、換階段(§1)或重大進度/阻塞才新增。
- 「下一個 agent 該做什麼」須具體可執行，禁套話；無則寫「無」。

## 1. 階段分工（依 `LLM_MEMORY.md`〈目前狀態〉，不越權）

權限跟階段走，無關工具/模型；僅 user 可切換，agent 禁自切。

- **規劃 [plan]**：僅產出/修訂純文字架構與計畫進 `LLM_MEMORY.md`；未標〈已定案〉禁改 code。
- **建置 [build]**：依〈已定案〉計畫小步實作（有 build/test 指令每步改完即驗，禁堆大段未驗變更）；禁重寫計畫，有問題留言並停該項。
- **維運 [maintain]**：debug、小修、看門狗與監控優化；禁動架構，需動則 log 提案待 user 決定是否退 `[plan]`。

## 2. 交接協定（硬規則）

- **覆蓋 `交接基準 commit`(先審後覆蓋)**：無待審或完成 §2.1 review，將 `git log -1 --format='%h %s'` 覆寫〈目前狀態〉「交接基準 commit」；工作期**不再動**（HEAD 領先正常），**禁改填本次或 `--amend` 後 hash**。
- 基準 hash 失效(`rebase`/`amend`)勿猜還原，改用 `git log --oneline -10` 判範圍記〈地雷警告〉。
- 換 agent 前須 commit（允許 WIP，§3）；接手僅依基準 commit＋`LLM_MEMORY.md` 起手，禁推測未記意圖。
- 接手 working tree 不乾淨：**僅就本 dir 未提交變更**先以 `[takeover] WIP: 接手時發現未提交變更` commit 保存記〈地雷警告〉再開工；跨 dir 髒檔/untracked file 禁越界納入(§4)，記〈地雷警告〉逐檔 `git add`。
- **同步衝突**：無歧義小衝突自動語意合併；**禁對含雙方異動 file 用 `--ours`/`--theirs` 機械覆蓋**（`> 3` file 或單 file `> 3` conflict hunk/語意交錯，先讀雙方 context 再語意合併並記方式與驗證）：
  * **對照/暫存**：優先讀 Git index（`git show :1:/:2:/:3:<path>`），另存限系統 temp dir（`/tmp/`、`$TEMP`）合完即刪，**禁留 working tree**。
  * **記憶檔**：`LLM_MEMORY.md` 留雙方 log 降序重排（未結待審下壓〈阻塞點〉）、〈目前階段〉衝突問 user、〈交接基準 commit〉留接手原值；`COMPONENT_MAP.md` 留雙方有效條目去重。
  * **方式/紅線**：優先 `merge`（受 `pre-commit`/`commit-msg` 白名單與 §3 約束），`rebase` 致基準失效走前退路；涉**業務二選一**或 **`AGENTS.md` 衝突**停手列差異問 user，未指示禁 `push`。
- 未經 user 明示：禁 `push`、`force-push`、改遠端 branch。

### 2.1 Review Loop

- commit 異動 `LLM_MEMORY.md`/`README.md`/`ARCHIVE.md` 外 file（含 code/config/`AGENTS.md`/`COMPONENT_MAP.md`/外移子檔/計畫/提案；純更新此 3 檔免審），不加標籤或獨立欄，log「完成了什麼」寫改什麼與為何改(1 行)，「下一個 agent 該做什麼」開頭寫「本次改動需要審閱：<檢查點/風險>」。
- **待審堆積提醒**：接手未結「需要審閱」（含〈阻塞點〉）`>= 2` 筆，開頭列出問 user 當場簽結或開 new session（含 `/clear` 清空 context）review，**不硬擋本次 commit**；提醒不免除 review，「不硬擋」僅指 commit，禁跳過 review 開工。
- 首筆 log 或〈阻塞點〉含未結「需要審閱」，接手先 review：`git diff <交接基準 commit>..HEAD -- <本 dir>`（repo 根可省 path）檢視前手異動（單 new session 可批次 review 多筆），必於覆蓋基準前執行(§0/§2)，核對：
  1. 符合架構與規則、未破既有邏輯。
  2. log 留有所稱 test/驗證紀錄。
  - 通過：新條目記結論移出〈阻塞點〉，始得續做原工作。
  - 不通過：禁自改前手內容，僅記問題停手待裁（需人類決議依 §5）。
- **禁左手審右手**：寫「需要審閱」agent 嚴禁於**未清空同 context** 自審剛交異動（亦禁派 subagent 代審）；commit 後**停手**，寫「等待 new session（或 `/clear` 清空 context，建議換模型）審閱」——經 `/clear` 完全清空 context（非 `/compact`）重讀三檔獨立起手視同 new session。
- **雙軌結案**：
  * **user 簽結(事後)**：明示「我看過，結案」（或同義語），記時間與「使用者已審閱結案」移出〈阻塞點〉，效力同 new session 通過。
  * **user 豁免(事前)**：明示「本次不需審閱」，記「使用者於 `<時間>` 明示豁免本次審閱」即續做；agent 禁自豁免。

## 3. Commit 格式

`[階段] 動作簡述` 例：`[build] WIP: ADC 濾波參數化，尚缺單元測試`
階段標籤：`[plan]` `[build]` `[maintain]`，交接特例 `[takeover]`(§2)。

## 4. 邊界

- **作用限本檔 dir 及子 dir**（巢狀以本 dir 為準）：
  * 規則衝突從本檔，不依上層改做法。
  * **禁改上層 `AGENTS.md`/`LLM_MEMORY.md`/`COMPONENT_MAP.md`**，禁將本 dir log 寫入上層，各自獨立交接。
  * 上層可讀（理解 context）；動本 dir 外 file 須先報請 user 同意。
- `README.md` 為人類向文件，禁寫規劃、狀態、待辦。
- 未經 user 明示禁改本檔(`AGENTS.md`)。
- 工具入口轉接頭（`CLAUDE.md`/`GEMINI.md` 等）僅引用(`@./AGENTS.md`)或外掛工具限定 config，禁覆寫/放寬本檔規則（衝突從本檔）。
- commit 受 `scripts/hooks/` 硬擋檢查，禁 `--no-verify` 略過（未裝 hook 見 §0）；僅排程/CI Bot 純更新專案已宣告產出 data file（如 `public/health.json`）免改 `LLM_MEMORY.md`（禁混改 code/config，agent 禁自豁免）。

## 5. 對人決議與訂正

- **需人類決議（全域）**：待決項須**逐條編號(`1.` `2.`…)且選項編號(`1A` `1B`…)**，僅簡述待決點、建議與極簡優缺點；待拍板或點名編號再展開細節（log 守 1200 bytes 僅記摘要）。
- **對人訂正（限本 turn 剛答）**：user 指證有誤且無異議，簡短承認直修繼續，禁耗 token 解釋；已交接 commit、已定案計畫仍走 §1/§2.1。
