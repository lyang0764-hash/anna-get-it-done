"use client";
/* eslint-disable react-hooks/purity, react-hooks/refs */

import { ChangeEvent, CSSProperties, FormEvent, ReactNode, RefObject, useEffect, useRef, useState } from "react";

type Attachment = { name: string; type: string; data: string; size: number };
type SourceRef = { id: string; publisher: string; title: string; url: string; publishedAt: string; claim: string };
type Fact = { fact: string; sourceIds: string[] };
type DataPoint = { label: string; value: number };
type Chart = { kind: "line" | "bar" | "donut"; title: string; subtitle: string; unit: string; insight: string; sourceIds: string[]; data: DataPoint[] };
type Opportunity = { rank: number; segment: string; targetCustomer: string; demandSignal: string; productDirection: string; priceAndMargin: string; growthDriver: string; defensibility: string; channelFit: string; score: number; sourceIds: string[] };
type Innovation = { title: string; targetUser: string; productConcept: string; coreInnovation: string; whyNow: string; validation: string; moat: string; sourceIds: string[] };
type Expert = { name: string; lens: string; specificFinding: string; dataBasis: string; decisionImpact: string; action: string; sourceIds: string[] };
type ChannelPlay = { channel: string; targetBuyer: string; platformSignal: string; offer: string; contentAngle: string; conversionPath: string; first30Days: string; kpi: string; sourceIds: string[] };
type Risk = { level: "高" | "中" | "低"; item: string; trigger: string; response: string };
type NextAction = { period: string; action: string; output: string; metric: string };
type VisualReference = { type: "image" | "video" | "product"; title: string; reason: string; sourceId: string; thumbnailUrl?: string };
type ChatHistoryItem = { id: string; title: string; prompt: string; status: string; updatedAt: string };
type LibraryItem = { id: string; title: string; category: string; createdAt: string };
type CurrentUser = { displayName: string; username: string; role: "admin" | "member" };
type ManagedUser = { id: string; username: string; displayName: string; role: string; active: boolean; createdAt: string };
type Report = {
  needsClarification: boolean;
  question: string;
  category: "market" | "customer" | "product" | "sales" | "content" | "business";
  deliverableType: string;
  title: string;
  executiveSummary: string;
  decision: { verdict: string; phase: "上升期" | "结构性增长" | "成熟期" | "下行期" | "证据不足"; confidence: "高" | "中" | "低"; coreThesis: string; notToDo: string };
  objective: string;
  researchScope: { market: string; category: string; customer: string; timeHorizon: string; decisionQuestion: string };
  knownFacts: Fact[];
  assumptions: string[];
  unknowns: string[];
  charts: Chart[];
  opportunities: Opportunity[];
  recommendedFocus: { segment: string; whyThisOne: string; productWedge: string; customer: string; pricePosition: string; goToMarket: string; killCriteria: string };
  innovationDirections: Innovation[];
  expertPanel: Expert[];
  channelPlays: ChannelPlay[];
  risks: Risk[];
  nextActions: NextAction[];
  visualReferences: VisualReference[];
  reusablePrompt: string;
  evidenceSources: SourceRef[];
  evidenceNote: string;
};

const demoReport: Report = {
  needsClarification: false,
  question: "",
  category: "market",
  deliverableType: "深度赛道决策报告",
  title: "美国宠物健康管理：从大市场里选出可验证的高价值细分",
  executiveSummary: "宠物行业仍在增长，但机会已经从泛用品转向高信任、高复购和可持续服务。第一优先不是再做一个普通喂食器，而是面向多宠与慢病家庭的“可量化饮食管理”产品组合，以设备为入口、耗材与服务形成复购。",
  decision: {
    verdict: "可以进入，但只能聚焦高价值细分后小规模验证",
    phase: "结构性增长",
    confidence: "中",
    coreThesis: "总市场增长不等于所有产品增长。利润更可能来自宠物健康、精准喂养与持续服务，而不是低价通用用品。",
    notToDo: "不做无数据差异的普通食盆、同质化玩具和只靠平台流量的白牌铺货。",
  },
  objective: "在90天内验证一个具有合理毛利、可复购、适合内容获客且不依赖线下拜访的宠物细分机会。",
  researchScope: { market: "美国为主，参考欧洲与中国", category: "宠物健康管理与智能用品", customer: "多宠家庭、超重/慢病宠物家庭", timeHorizon: "未来3—5年", decisionQuestion: "哪个细分既有增长，又能形成利润、复购与长期壁垒？" },
  knownFacts: [
    { fact: "美国宠物消费总量仍在增长，但食品、医疗和服务吸收了更高比例的持续支出。", sourceIds: ["S1"] },
    { fact: "智能用品规模小于食品，但增长更快，适合作为数据入口而非单次硬件生意。", sourceIds: ["S2"] },
    { fact: "宠物肥胖与慢病管理让精准喂养从便利功能变成健康管理需求。", sourceIds: ["S3"] },
  ],
  assumptions: ["团队具备硬件供应链与小批量打样能力", "首阶段目标是跨境线上销售而非重资产线下渠道"],
  unknowns: ["目标零售价下的真实退货率", "传感器稳定性与宠物误触场景", "用户是否愿意持续记录健康数据"],
  charts: [
    { kind: "line", title: "美国宠物行业支出趋势", subtitle: "同一统计口径下的年度总支出", unit: "十亿美元", insight: "总盘子仍向上，但增量正在转向健康、食品与服务等高频支出。", sourceIds: ["S1"], data: [{ label: "2022", value: 136.8 }, { label: "2023", value: 147 }, { label: "2024", value: 152 }, { label: "2025", value: 158 }, { label: "2026E", value: 165 }] },
    { kind: "bar", title: "候选细分机会评分", subtitle: "综合增长、利润、复购、渠道与壁垒，满分100", unit: "分", insight: "精准喂养与慢病管理并非最大类目，但更符合“利润+复购+内容获客”的进入条件。", sourceIds: ["S2", "S3"], data: [{ label: "精准喂养", value: 88 }, { label: "口腔护理", value: 81 }, { label: "出行安全", value: 72 }, { label: "普通用品", value: 45 }] },
    { kind: "donut", title: "中国宠物行业消费结构参考", subtitle: "用结构判断哪些需求具备高频与高信任属性", unit: "%", insight: "食品与医疗占比高，说明健康相关需求更容易形成持续支出；用品需与健康结果绑定。", sourceIds: ["S2"], data: [{ label: "食品", value: 52.2 }, { label: "医疗", value: 28.5 }, { label: "用品", value: 12.5 }, { label: "服务", value: 6.8 }] },
  ],
  opportunities: [
    { rank: 1, segment: "多宠家庭精准喂养", targetCustomer: "2只以上宠物、存在抢食或体重差异的城市家庭", demandSignal: "用户不是缺喂食器，而是无法确认每只宠物吃了多少、是否抢食、体重为何失控。", productDirection: "身份识别食盆+分宠进食记录+异常提醒，先解决记录准确性，再扩展健康建议。", priceAndMargin: "中高价设备作入口；滤芯、清洁件、订阅报告形成复购。硬件毛利不能单独承担获客成本。", growthDriver: "宠物拟人化、多宠家庭增加、肥胖与慢病管理需求上升。", defensibility: "真实进食数据、兽医建议规则、长期用户记录和多宠识别准确率。", channelFit: "TikTok/YouTube用真实多宠冲突场景获客，Amazon承接成交，独立站承接数据服务。", score: 88, sourceIds: ["S1", "S3"] },
    { rank: 2, segment: "家庭宠物口腔护理", targetCustomer: "不愿频繁麻醉洁牙、但已出现口臭和牙垢的犬猫家庭", demandSignal: "痛点高频且容易被视频展示，但用户对安全性与实际效果非常敏感。", productDirection: "可视化口腔检查+分阶段护理组合，不只卖单一清洁产品。", priceAndMargin: "耗材复购优于单次工具；需用检测与前后对比建立信任。", growthDriver: "宠物寿命延长、预防医疗意识提升、家庭护理替代部分低效操作。", defensibility: "成分证据、使用依从性、效果记录和专业背书。", channelFit: "短视频前后对比教育，DTC订阅补充包，诊所/美容店作为信任节点。", score: 81, sourceIds: ["S3"] },
  ],
  recommendedFocus: { segment: "多宠家庭精准喂养", whyThisOne: "它同时满足强痛点、可视频化展示、设备+耗材复购和数据壁垒四个条件；比普通智能用品更容易证明结果。", productWedge: "先做能准确区分每只宠物进食量的身份识别食盆，不急于加入摄像头、语音和复杂App。", customer: "美国城市多宠家庭，优先猫家庭与体重管理家庭", pricePosition: "避开低价喂食器，进入可解释健康价值的中高价格带", goToMarket: "用真实多宠抢食实验制作内容，在TikTok/YouTube验证点击与预约，再以Amazon或独立站小批量预售验证付款。", killCriteria: "30天内没有100个有效候补、样机识别准确率低于95%、或目标售价下毛利无法覆盖退货与获客成本，则停止放大。" },
  innovationDirections: [
    { title: "分宠精准进食系统", targetUser: "多宠、抢食与体重差异家庭", productConcept: "每只宠物独立识别、记录进食量与时段，异常时提醒。", coreInnovation: "把“自动出粮”升级为“每只宠物吃了什么、吃了多少”的可验证结果。", whyNow: "传感器成本下降，用户已习惯通过App管理宠物健康。", validation: "用20个多宠家庭测试识别准确率、清洁难度和7天留存。", moat: "身份识别精度、长期数据与健康建议规则。", sourceIds: ["S3", "S4"] },
    { title: "慢病宠物饮食协同包", targetUser: "需要控重、控糖或肾脏管理的宠物家庭", productConcept: "设备记录+定量餐包/耗材+可分享给兽医的周报。", coreInnovation: "把一次硬件购买变成可协同的持续管理服务。", whyNow: "宠物寿命延长，家庭越来越愿意为预防和慢病管理付费。", validation: "与3位兽医共创周报字段，招募10个家庭完成4周测试。", moat: "专业协作网络、长期结果数据与复购方案。", sourceIds: ["S3"] },
  ],
  expertPanel: [
    { name: "市场战略顾问", lens: "行业阶段与进入位置", specificFinding: "宠物行业是结构性增长，不是所有用品普涨；健康与高频服务优于普通用品。", dataBasis: "总支出趋势、消费结构与细分增长对比。", decisionImpact: "从“做宠物用品”收窄为“做健康结果可验证的用品”。", action: "只保留能同时满足高痛点、复购和线上内容展示的细分。", sourceIds: ["S1", "S2"] },
    { name: "平台运营负责人", lens: "线上需求与转化", specificFinding: "多宠抢食、体重变化、每日进食量都是可被短视频直接演示的强场景。", dataBasis: "平台内容形态、购买路径与用户问题类型。", decisionImpact: "产品必须在15秒内演示问题与结果，不能依赖销售人员长时间解释。", action: "先做10条场景视频和两个落地页，用候补名单验证需求。", sourceIds: ["S4"] },
    { name: "产品研发负责人", lens: "最小可用产品", specificFinding: "用户的第一价值是分宠识别准确，不是功能数量。", dataBasis: "多宠家庭核心任务、清洁与误触场景。", decisionImpact: "MVP砍掉摄像头和复杂社交功能，集中攻克识别和称重。", action: "先定义95%识别准确率、清洗时间和误差阈值。", sourceIds: ["S3"] },
    { name: "供应链与利润顾问", lens: "单位经济", specificFinding: "如果只有硬件一次毛利，退货、售后和获客会迅速吃掉利润。", dataBasis: "智能硬件售后结构与耗材复购逻辑。", decisionImpact: "从单品改为设备+清洁件+报告服务组合。", action: "在打样前完成售价、平台费、退货率和获客成本敏感性测算。", sourceIds: ["S2"] },
  ],
  channelPlays: [
    { channel: "TikTok / YouTube Shorts", targetBuyer: "正在处理抢食、肥胖或进食异常的多宠家庭", platformSignal: "评论中出现“怎么知道是哪只吃的”“一只总抢另一只”的真实问题。", offer: "免费领取《7天多宠进食观察表》并加入样机候补。", contentAngle: "同一家庭三只猫的抢食实验、7天记录前后变化、错误功能对比。", conversionPath: "短视频→问题自测→候补名单→样机测试→首批预售。", first30Days: "发布10条场景视频，测试3个痛点开头和2个产品价值表达。", kpi: "有效候补≥100；落地页转化≥8%；样机申请≥20", sourceIds: ["S4"] },
    { channel: "Amazon", targetBuyer: "已经搜索智能喂食器、宠物称重或多宠喂养方案的高意图用户", platformSignal: "重点观察高销量产品差评中的识别失败、卡粮、清洁和App问题。", offer: "以“分宠记录准确”作为核心卖点，不与低价定时喂食器正面比价。", contentAngle: "对比表、真实识别视频、清洁步骤和一周数据报告。", conversionPath: "站内搜索→详情页证据→购买→App/独立站激活→耗材复购。", first30Days: "拆解前20个竞品的差评主题、价格带、图片顺序和QA问题。", kpi: "找到3个重复高频缺口；首批评价明确提及识别准确", sourceIds: ["S4"] },
  ],
  risks: [
    { level: "高", item: "识别准确率不足", trigger: "多宠交叉靠近或同时进食时错误归属", response: "先在真实多宠环境设95%准确率门槛，达不到不进入量产。" },
    { level: "高", item: "售后吞噬毛利", trigger: "连接、卡粮、清洁或App问题导致高退货", response: "把安装与清洗纳入产品设计，按8%—15%退货情景测算单位经济。" },
    { level: "中", item: "健康建议越界", trigger: "用户把数据提示当作诊断结论", response: "只展示记录与异常趋势，诊断建议必须交给持证兽医。" },
  ],
  nextActions: [
    { period: "今天", action: "锁定多宠精准喂养，写清唯一核心问题、目标家庭与停止条件。", output: "《细分机会决策卡》", metric: "只保留1个MVP方向" },
    { period: "7天", action: "完成20个多宠家庭访谈、20款竞品差评拆解和10条短视频脚本。", output: "《需求证据包》", metric: "出现3个重复痛点并获得100个候补" },
    { period: "30天", action: "完成可运行样机与20个家庭测试，验证识别、清洗、留存和价格接受度。", output: "《样机验证报告》", metric: "识别≥95%；7天留存≥60%" },
    { period: "90天", action: "完成小批量预售和单位经济复盘，决定量产、改版或停止。", output: "《首批进入决策》", metric: "真实付款、退货和毛利达到预设门槛" },
  ],
  visualReferences: [
    { type: "product", title: "多宠身份识别喂食产品参考", reason: "用于观察现有产品如何解决分宠进食，以及用户仍抱怨哪些问题。", sourceId: "S4", thumbnailUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=80" },
  ],
  reusablePrompt: "请以投资人、市场策略顾问、目标用户研究员、产品经理、供应链利润顾问和平台运营负责人的联合视角，对我提供的行业与产品做深度进入判断。先判断行业阶段，再用同口径数据制作趋势、地区比较和品类结构；随后横向比较3—5个细分机会，只选一个最优先方向，给出具体用户、产品楔子、价格与利润逻辑、渠道打法、创新方案、验证指标和停止条件。所有事实必须有来源编号，正文不得出现原始网址；没有可靠数字时明确证据不足。",
  evidenceSources: [
    { id: "S1", publisher: "APPA", title: "U.S. pet industry spending and outlook", url: "https://americanpetproducts.org/industry-trends-and-stats", publishedAt: "2026", claim: "美国宠物行业年度支出及预测。" },
    { id: "S2", publisher: "KPMG", title: "China pet industry market report", url: "https://kpmg.com/cn/en/insights/2025/06/china-pet-industry-market-report.html", publishedAt: "2025", claim: "中国宠物行业结构、智能用品和消费渠道数据。" },
    { id: "S3", publisher: "AAHA", title: "Pet weight and preventive care guidance", url: "https://www.aaha.org/resources/pet-obesity/", publishedAt: "2025", claim: "宠物肥胖与持续健康管理需求。" },
    { id: "S4", publisher: "Sure Petcare", title: "Microchip pet feeder product reference", url: "https://www.surepetcare.com/en-us/pet-feeder/microchip-pet-feeder", publishedAt: "2026", claim: "身份识别喂食产品形态与使用场景参考。" },
  ],
  evidenceNote: "不同国家与不同研究机构的市场规模口径不能直接相加。图表只使用同一来源或明确可比的统计口径；评分属于进入决策模型，不代表公开市场份额。",
};

const chartColors = ["#95563f", "#c48a6a", "#d9ad78", "#7d6a5f", "#b9a08d", "#64483e"];

function chunk<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1, notation: Math.abs(value) >= 10000 ? "compact" : "standard" }).format(value);
}

function buildReportIdentity(report: Report) {
  const normalizedTitle = report.title.replace(/\s+/g, " ").trim();
  const footerSlogan = "Anna姐 · 把事干成";
  const date = new Date();
  const dateStamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const safePart = (value: string) => value.replace(/[\\/:*?"<>|]/g, "-").replace(/-+/g, "-").replace(/^[.\s-]+|[.\s-]+$/g, "");
  const fileName = `${safePart(normalizedTitle)}-${safePart(report.deliverableType)}-${dateStamp}.pdf`;
  const reportKey = `${safePart(normalizedTitle)}::${safePart(report.deliverableType)}::${report.executiveSummary.slice(0, 80)}`;
  return { footerSlogan, fileName, reportKey };
}

function Icon({ name, size = 20 }: { name: "settings" | "plus" | "mic" | "send" | "file" | "close" | "chat" | "library" | "menu" | "chevron" | "search" | "grid" | "list"; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "settings") return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "mic") return <svg {...common}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
  if (name === "send") return <svg {...common}><path d="m5 12 14-8-5 16-3-6-6-2Z"/><path d="m11 14 8-10"/></svg>;
  if (name === "file") return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>;
  if (name === "chat") return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>;
  if (name === "library") return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if (name === "grid") return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (name === "list") return <svg {...common}><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>;
  if (name === "chevron") return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
  return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
}

function Portrait() {
  return <div className="portrait-crop" aria-label="Anna姐形象照"><img src="/assets/video-channel.jpg" alt="Anna姐" /></div>;
}

function BrandLogo({ placement = "sidebar" }: { placement?: "sidebar" | "mobile" | "report" | "closing" }) {
  return <img className={`anna-brand-logo anna-brand-logo-${placement}`} src="/assets/anna-brand-logo.png" alt="Anna姐思享汇｜聚思 · 享见 · 汇资源" />;
}

function QRCard({ type, title, note, src }: { type: "video" | "wecom" | "full"; title: string; note: string; src?: string }) {
  if (!src && type === "full") return null;
  return <div className="qr-card"><div className={`qr-crop qr-${type}`}><img src={src || (type === "video" ? "/assets/video-channel.jpg" : "/assets/wecom.jpg")} alt={`${title}二维码`} /></div><strong>{title}</strong><span>{note}</span></div>;
}

function SourceBadges({ ids, sourceMap }: { ids: string[]; sourceMap: Map<string, SourceRef> }) {
  const sources = ids.map((id) => sourceMap.get(id)).filter(Boolean) as SourceRef[];
  if (!sources.length) return null;
  return <div className="source-badges">{sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" title={source.title}>{source.id} · {source.publisher}</a>)}</div>;
}

function ReportPage({ kicker, title, children, className = "" }: { kicker: string; title: string; children: ReactNode; className?: string }) {
  return <section className={`report-page ${className}`}><div className="report-kicker">{kicker}</div><h2 className="report-heading">{title}</h2>{children}</section>;
}

function Detail({ label, children, emphasis = false }: { label: string; children: ReactNode; emphasis?: boolean }) {
  return <div className={`detail-row ${emphasis ? "emphasis" : ""}`}><span>{label}</span><p>{children}</p></div>;
}

function LineChart({ chart }: { chart: Chart }) {
  const width = 720, height = 280, left = 62, right = 24, top = 24, bottom = 52;
  const values = chart.data.map((point) => point.value);
  const minValue = Math.min(...values), maxValue = Math.max(...values), range = maxValue - minValue || 1;
  const x = (index: number) => left + index * ((width - left - right) / Math.max(1, chart.data.length - 1));
  const y = (value: number) => top + (maxValue - value) * ((height - top - bottom) / range);
  const path = chart.data.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.value)}`).join(" ");
  return <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chart.title}>
    {[0, .25, .5, .75, 1].map((ratio) => { const lineY = top + ratio * (height - top - bottom); const value = maxValue - ratio * range; return <g key={ratio}><line x1={left} x2={width - right} y1={lineY} y2={lineY} className="chart-grid-line"/><text x={left - 10} y={lineY + 5} textAnchor="end" className="chart-axis-label">{formatNumber(value)}</text></g>; })}
    <path d={path} className="chart-line"/>
    {chart.data.map((point, index) => <g key={point.label}><circle cx={x(index)} cy={y(point.value)} r="5" className="chart-dot"/><text x={x(index)} y={height - 18} textAnchor="middle" className="chart-axis-label">{point.label}</text><text x={x(index)} y={y(point.value) - 13} textAnchor="middle" className="chart-value-label">{formatNumber(point.value)}</text></g>)}
  </svg>;
}

function BarChart({ chart }: { chart: Chart }) {
  const max = Math.max(...chart.data.map((point) => point.value), 1);
  return <div className="bar-chart">{chart.data.map((point) => <div className="bar-row" key={point.label}><div className="bar-label">{point.label}</div><div className="bar-track"><span style={{ width: `${Math.max(3, point.value / max * 100)}%` }}/></div><strong>{formatNumber(point.value)}{chart.unit === "%" ? "%" : ""}</strong></div>)}</div>;
}

function DonutChart({ chart }: { chart: Chart }) {
  const total = chart.data.reduce((sum, point) => sum + point.value, 0) || 1;
  const proportions = chart.data.map((point) => point.value / total * 100);
  const stops = chart.data.map((point, index) => {
    const start = proportions.slice(0, index).reduce((sum, value) => sum + value, 0);
    const end = start + proportions[index];
    return `${chartColors[index % chartColors.length]} ${start}% ${end}%`;
  }).join(", ");
  return <div className="donut-wrap"><div className="donut" style={{ background: `conic-gradient(${stops})` } as CSSProperties}><div><strong>{formatNumber(total)}</strong><span>{chart.unit}</span></div></div><div className="donut-legend">{chart.data.map((point, index) => <div key={point.label}><i style={{ background: chartColors[index % chartColors.length] }}/><span>{point.label}</span><strong>{formatNumber(point.value)}{chart.unit === "%" ? "%" : ""}</strong></div>)}</div></div>;
}

function ChartView({ chart, sourceMap }: { chart: Chart; sourceMap: Map<string, SourceRef> }) {
  return <div className="chart-card"><div className="chart-meta"><p>{chart.subtitle}</p><span>单位：{chart.unit}</span></div>{chart.kind === "line" ? <LineChart chart={chart}/> : chart.kind === "bar" ? <BarChart chart={chart}/> : <DonutChart chart={chart}/>}<div className="chart-insight"><strong>从图里看见什么</strong><p>{chart.insight}</p></div><SourceBadges ids={chart.sourceIds} sourceMap={sourceMap}/></div>;
}

function OpportunityCard({ opportunity, sourceMap }: { opportunity: Opportunity; sourceMap: Map<string, SourceRef> }) {
  return <article className="opportunity-card"><div className="opportunity-head"><div><span>优先级 {opportunity.rank}</span><h3>{opportunity.segment}</h3></div><div className="score"><strong>{Math.round(opportunity.score)}</strong><span>/100</span></div></div><Detail label="具体客户">{opportunity.targetCustomer}</Detail><Detail label="真实需求信号" emphasis>{opportunity.demandSignal}</Detail><Detail label="做什么产品">{opportunity.productDirection}</Detail><div className="detail-grid"><Detail label="价格与利润逻辑">{opportunity.priceAndMargin}</Detail><Detail label="增长来自哪里">{opportunity.growthDriver}</Detail><Detail label="长期壁垒">{opportunity.defensibility}</Detail><Detail label="适合的渠道">{opportunity.channelFit}</Detail></div><SourceBadges ids={opportunity.sourceIds} sourceMap={sourceMap}/></article>;
}

function ReportView({ report, officialQr }: { report: Report; officialQr: string }) {
  const sourceMap = new Map(report.evidenceSources.map((source) => [source.id, source]));
  const identity = buildReportIdentity(report);
  return <div id="report-document" className="report-document" style={{ "--report-slogan": JSON.stringify(identity.footerSlogan) } as CSSProperties}>
    <section className="report-page report-cover"><div className="cover-top"><BrandLogo placement="report"/><Portrait /></div><div className="cover-rule"/><div className="report-type">{report.deliverableType}</div><h2>{report.title}</h2><p className="cover-summary">{report.executiveSummary}</p><div className="cover-outcome">{report.decision.verdict}</div><div className="cover-brief"><div><span>判断依据</span><p>{report.decision.coreThesis}</p></div><div><span>明确不做</span><p>{report.decision.notToDo}</p></div></div><div className="cover-footer"><span>{identity.footerSlogan}</span><span>{new Date().toLocaleDateString("zh-CN")}</span></div></section>

    <ReportPage kicker="01 · 决策先行" title="先说结论：该不该进，进哪里"><div className="decision-banner"><span className={`phase phase-${report.decision.phase}`}>{report.decision.phase}</span><strong>{report.decision.verdict}</strong><p>{report.decision.coreThesis}</p></div><div className="decision-grid"><Detail label="最终目标">{report.objective}</Detail><Detail label="判断信心">{report.decision.confidence}</Detail><Detail label="明确不做">{report.decision.notToDo}</Detail></div></ReportPage>

    <ReportPage kicker="02 · 研究边界" title="这份判断到底研究了什么"><div className="scope-grid"><Detail label="目标市场">{report.researchScope.market}</Detail><Detail label="研究品类">{report.researchScope.category}</Detail><Detail label="目标客户">{report.researchScope.customer}</Detail><Detail label="时间范围">{report.researchScope.timeHorizon}</Detail></div><Detail label="要回答的决策问题" emphasis>{report.researchScope.decisionQuestion}</Detail><div className="facts-list"><h3>已经确认的事实</h3>{report.knownFacts.map((fact, index) => <div className="fact-row" key={index}><span>{String(index + 1).padStart(2, "0")}</span><div><p>{fact.fact}</p><SourceBadges ids={fact.sourceIds} sourceMap={sourceMap}/></div></div>)}</div></ReportPage>

    <ReportPage kicker="03 · 假设与缺口" title="哪些是事实，哪些仍然需要验证"><div className="readable-columns"><div className="list-panel"><h3>当前假设</h3><ul>{report.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul></div><div className="list-panel"><h3>关键未知</h3><ul>{report.unknowns.map((item, index) => <li key={index}>{item}</li>)}</ul></div></div><p className="evidence-note">{report.evidenceNote}</p></ReportPage>

    {report.charts.map((chart, index) => <ReportPage key={`${chart.title}-${index}`} kicker={`04 · 数据图表 ${index + 1}/${report.charts.length}`} title={chart.title}><ChartView chart={chart} sourceMap={sourceMap}/></ReportPage>)}

    {report.opportunities.map((opportunity, index) => <ReportPage key={`${opportunity.segment}-${index}`} kicker={`05 · 细分机会 ${index + 1}/${report.opportunities.length}`} title="从大市场往下钻到具体产品"><OpportunityCard opportunity={opportunity} sourceMap={sourceMap}/></ReportPage>)}

    <ReportPage kicker="06 · 唯一焦点" title={`第一优先：${report.recommendedFocus.segment}`}><div className="focus-statement">{report.recommendedFocus.whyThisOne}</div><Detail label="产品楔子" emphasis>{report.recommendedFocus.productWedge}</Detail><div className="detail-grid"><Detail label="第一批客户">{report.recommendedFocus.customer}</Detail><Detail label="价格位置">{report.recommendedFocus.pricePosition}</Detail></div><Detail label="怎么进入市场">{report.recommendedFocus.goToMarket}</Detail><Detail label="什么时候停止" emphasis>{report.recommendedFocus.killCriteria}</Detail></ReportPage>

    {chunk(report.innovationDirections, 2).map((items, pageIndex) => <ReportPage key={`innovation-${pageIndex}`} kicker={`07 · 产品创新 ${pageIndex + 1}/${Math.ceil(report.innovationDirections.length / 2)}`} title="把机会变成可以验证的产品"><div className="stacked-cards">{items.map((item) => <article className="innovation-card" key={item.title}><h3>{item.title}</h3><Detail label="为谁做">{item.targetUser}</Detail><Detail label="产品是什么" emphasis>{item.productConcept}</Detail><Detail label="核心创新">{item.coreInnovation}</Detail><div className="detail-grid"><Detail label="为什么是现在">{item.whyNow}</Detail><Detail label="如何验证">{item.validation}</Detail></div><Detail label="未来壁垒">{item.moat}</Detail><SourceBadges ids={item.sourceIds} sourceMap={sourceMap}/></article>)}</div></ReportPage>)}

    {chunk(report.expertPanel, 2).map((experts, pageIndex) => <ReportPage key={`experts-${pageIndex}`} kicker={`08 · 专家会诊 ${pageIndex + 1}/${Math.ceil(report.expertPanel.length / 2)}`} title="每位专家都必须改变一个决策"><div className="stacked-cards">{experts.map((expert) => <article className="expert-card" key={`${expert.name}-${expert.lens}`}><div className="expert-head"><div><h3>{expert.name}</h3><span>{expert.lens}</span></div></div><Detail label="具体发现" emphasis>{expert.specificFinding}</Detail><Detail label="数据依据">{expert.dataBasis}</Detail><Detail label="如何改变决策">{expert.decisionImpact}</Detail><Detail label="立即动作">{expert.action}</Detail><SourceBadges ids={expert.sourceIds} sourceMap={sourceMap}/></article>)}</div></ReportPage>)}

    {report.channelPlays.map((play, index) => <ReportPage key={`${play.channel}-${index}`} kicker={`09 · 渠道打法 ${index + 1}/${report.channelPlays.length}`} title={`${play.channel}：具体怎么打`}><div className="channel-card"><Detail label="目标买家">{play.targetBuyer}</Detail><Detail label="平台真实信号" emphasis>{play.platformSignal}</Detail><Detail label="卖什么结果">{play.offer}</Detail><Detail label="内容怎么讲">{play.contentAngle}</Detail><Detail label="转化路径">{play.conversionPath}</Detail><Detail label="前30天动作">{play.first30Days}</Detail><Detail label="验收指标" emphasis>{play.kpi}</Detail><SourceBadges ids={play.sourceIds} sourceMap={sourceMap}/></div></ReportPage>)}

    <ReportPage kicker="10 · 行动与验收" title="不再停在“知道了”"><div className="timeline">{report.nextActions.map((item, index) => <div className="timeline-item" key={index}><strong>{item.period}</strong><div><p>{item.action}</p><span>交付物：{item.output}</span><span>验收：{item.metric}</span></div></div>)}</div></ReportPage>

    {chunk(report.risks, 2).map((risks, pageIndex) => <ReportPage key={`risks-${pageIndex}`} kicker={`11 · 风险与停止条件 ${pageIndex + 1}/${Math.ceil(report.risks.length / 2)}`} title="在花大钱之前，先防住这些风险"><div className="risk-list">{risks.map((risk, index) => <article key={`${pageIndex}-${index}`}><span className={`risk-level risk-${risk.level}`}>{risk.level}风险</span><h3>{risk.item}</h3><Detail label="何时触发">{risk.trigger}</Detail><Detail label="怎么处理">{risk.response}</Detail></article>)}</div></ReportPage>)}

    {report.visualReferences.length > 0 && <ReportPage kicker="12 · 视觉与案例参考" title="值得进一步研究的产品与视频"><div className="visual-grid">{report.visualReferences.map((item, index) => { const source = sourceMap.get(item.sourceId); return <a className="visual-card" href={source?.url || "#"} target="_blank" rel="noreferrer" key={`${item.title}-${index}`}>{item.thumbnailUrl ? <img src={item.thumbnailUrl} crossOrigin="anonymous" alt={item.title}/> : <div className="visual-placeholder"><span>{item.type === "video" ? "视频" : item.type === "product" ? "产品" : "图片"}参考</span></div>}<div><span>{item.type === "video" ? "视频案例" : item.type === "product" ? "产品案例" : "图片参考"}</span><h3>{item.title}</h3><p>{item.reason}</p><small>{source ? `${source.id} · ${source.publisher}` : "查看来源"}</small></div></a>; })}</div></ReportPage>}

    {chunk(report.evidenceSources, 5).map((sources, pageIndex) => <ReportPage key={`sources-${pageIndex}`} kicker={`13 · 证据来源 ${pageIndex + 1}/${Math.ceil(report.evidenceSources.length / 5)}`} title="所有数据都可以回到原始来源"><div className="source-list">{sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id}><span>{source.id}</span><div><strong>{source.publisher} · {source.title}</strong><p>{source.claim}</p><small>{source.publishedAt || "发布日期未标注"} · 打开原始来源</small></div></a>)}</div></ReportPage>)}

    <ReportPage kicker="14 · 可复用方法" title="下次遇到相似问题，可以继续这样研究"><div className="prompt-box">{report.reusablePrompt}</div></ReportPage>

    <section className="report-page report-end"><div className="end-mark">继续把下一件事做成</div><h3>结果到这里，行动从这里开始</h3><p>关注真实案例，领取行业版方法，或继续完成你的下一步。</p><div className="qr-row"><QRCard type="video" title="视频号" note="看真实案例与实战分享"/><QRCard type="full" title="公众号" note="沉淀方法与深度文章" src={officialQr}/><QRCard type="wecom" title="企业微信" note="申请企业问题诊断"/></div><div className="end-portrait"><Portrait /></div><BrandLogo placement="closing"/></section>
  </div>;
}

async function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
}

const ACTIVE_JOB_STORAGE = "anna-active-generation-v1";
const DRAFT_STORAGE = "anna-input-draft-v1";
type ReturnStage = "idle" | "clarify" | "result";
type StoredGeneration = { jobId: string; startedAt: number; previousStage: ReturnStage; basePrompt: string; context: string[] };
const JOB_TIMEOUT_MS = 10 * 60 * 1000;
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function clonePdfBlocks(element: HTMLElement): HTMLElement[] {
  const splitContainers = ".stacked-cards,.risk-list,.source-list,.timeline,.visual-grid,.facts-list";
  const splitCards = ".opportunity-card,.innovation-card,.expert-card,.channel-card";
  if (element.matches(splitCards) && element.children.length > 2) {
    const children = Array.from(element.children) as HTMLElement[];
    const parts: HTMLElement[] = [];
    for (let index = 0; index < children.length; index += 2) {
      const card = element.cloneNode(false) as HTMLElement;
      card.classList.add("pdf-card-part");
      if (index > 0) card.classList.add("pdf-card-continued");
      children.slice(index, index + 2).forEach((child) => card.appendChild(child.cloneNode(true)));
      parts.push(card);
    }
    return parts;
  }
  if (element.matches(splitContainers) && element.children.length > 1) {
    const children = Array.from(element.children) as HTMLElement[];
    const heading = element.matches(".facts-list") && children[0]?.tagName === "H3" ? children.shift() : undefined;
    const parts: HTMLElement[] = [];
    for (let index = 0; index < children.length; index++) {
      const childParts = clonePdfBlocks(children[index]);
      childParts.forEach((childPart, childIndex) => {
        const wrapper = element.cloneNode(false) as HTMLElement;
        wrapper.classList.add("pdf-split-wrapper");
        if (heading && index === 0 && childIndex === 0) wrapper.appendChild(heading.cloneNode(true));
        wrapper.appendChild(childPart);
        parts.push(wrapper);
      });
    }
    return parts;
  }
  return [element.cloneNode(true) as HTMLElement];
}

function createPdfSheets(source: HTMLElement, footerSlogan: string) {
  const exportRoot = document.createElement("div");
  exportRoot.className = "pdf-export-root";
  document.body.appendChild(exportRoot);
  let currentBody: HTMLElement | null = null;

  const newSheet = (variant = "") => {
    const sheet = document.createElement("section");
    sheet.className = `pdf-sheet ${variant}`.trim();
    const body = document.createElement("div");
    body.className = "pdf-sheet-body";
    const footer = document.createElement("footer");
    footer.className = "pdf-sheet-footer";
    const slogan = document.createElement("span");
    slogan.className = "pdf-footer-slogan";
    slogan.textContent = footerSlogan;
    const pageNumber = document.createElement("span");
    pageNumber.className = "pdf-page-number";
    footer.append(slogan, pageNumber);
    sheet.append(body, footer);
    exportRoot.appendChild(sheet);
    currentBody = body;
    return body;
  };

  const sourcePages = Array.from(source.querySelectorAll<HTMLElement>(".report-page"));
  sourcePages.forEach((page) => {
    const standalone = page.classList.contains("report-cover") || page.classList.contains("report-end");
    if (standalone) {
      const body = newSheet(page.classList.contains("report-cover") ? "pdf-cover-sheet" : "pdf-end-sheet");
      const clone = page.cloneNode(true) as HTMLElement;
      clone.querySelector(".cover-footer")?.remove();
      body.appendChild(clone);
      currentBody = null;
      return;
    }

    const kicker = page.querySelector<HTMLElement>(".report-kicker");
    const heading = page.querySelector<HTMLElement>(".report-heading");
    const directChildren = Array.from(page.children).filter((child) => child !== kicker && child !== heading) as HTMLElement[];
    const blocks = directChildren.flatMap((child) => clonePdfBlocks(child));
    let body = currentBody || newSheet();
    let section = document.createElement("section");
    section.className = "pdf-section";
    if (kicker) section.appendChild(kicker.cloneNode(true));
    if (heading) section.appendChild(heading.cloneNode(true));
    body.appendChild(section);
    let sectionBlockCount = 0;

    blocks.forEach((block) => {
      block.classList.add("pdf-content-block");
      section.appendChild(block);
      if (body.scrollHeight > body.clientHeight) {
        block.remove();
        if (sectionBlockCount === 0) {
          section.remove();
          body = newSheet();
          section = document.createElement("section");
          section.className = "pdf-section";
          if (kicker) section.appendChild(kicker.cloneNode(true));
          if (heading) section.appendChild(heading.cloneNode(true));
          body.appendChild(section);
        } else {
          body = newSheet();
          section = document.createElement("section");
          section.className = "pdf-section pdf-section-continued";
          const continuation = document.createElement("div");
          continuation.className = "pdf-continuation-label";
          continuation.textContent = `${heading?.textContent || "本节"} · 续`;
          section.appendChild(continuation);
          body.appendChild(section);
          sectionBlockCount = 0;
        }
        section.appendChild(block);
      }
      sectionBlockCount += 1;
      if (body.scrollHeight > body.clientHeight) section.classList.add("pdf-compact-section");
    });
    currentBody = body;
  });

  const sheets = Array.from(exportRoot.querySelectorAll<HTMLElement>(".pdf-sheet"));
  sheets.forEach((sheet, index) => {
    const number = sheet.querySelector<HTMLElement>(".pdf-page-number");
    if (number) number.textContent = String(index + 1).padStart(2, "0");
  });
  return { exportRoot, sheets };
}

export default function ResultStudio({ currentUser }: { currentUser: CurrentUser }) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [stage, setStage] = useState<"idle" | "loading" | "clarify" | "result">("idle");
  const [report, setReport] = useState<Report | null>(null);
  const [question, setQuestion] = useState("");
  const [rootPrompt, setRootPrompt] = useState("");
  const [context, setContext] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-5.6");
  const [officialQr, setOfficialQr] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [jobStartedAt, setJobStartedAt] = useState(0);
  const [jobStatus, setJobStatus] = useState<"queued" | "in_progress" | "continuing" | "reconnecting">("queued");
  const [connectionNote, setConnectionNote] = useState("");
  const [pdfDownload, setPdfDownload] = useState<{ url: string; name: string; reportKey: string } | null>(null);
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [activeView, setActiveView] = useState<"chat" | "library">("chat");
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "documents">("all");
  const [libraryLayout, setLibraryLayout] = useState<"list" | "grid">("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const manualCancelRef = useRef(false);
  const activeJobIdRef = useRef("");
  const pollingJobRef = useRef("");
  const returnStageRef = useRef<ReturnStage>("idle");

  async function refreshHistory() {
    try {
      const response = await fetch("/api/history", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { chats?: ChatHistoryItem[]; files?: LibraryItem[] };
      setChats(data.chats || []);
      setLibrary(data.files || []);
    } catch { /* History should never block the active task. */ }
  }

  async function openSavedResult(id: string, prompt = "") {
    if (!id.startsWith("resp_") || stage === "loading") return;
    if (pdfDownload?.url.startsWith("blob:")) URL.revokeObjectURL(pdfDownload.url);
    manualCancelRef.current = false;
    activeJobIdRef.current = id;
    returnStageRef.current = "idle";
    setPdfDownload(null);
    setActiveView("chat");
    setActiveHistoryId(id);
    setSidebarOpen(false);
    setError("");
    setRootPrompt(prompt);
    if (prompt) {
      setInput(prompt);
      try { localStorage.setItem(DRAFT_STORAGE, prompt); } catch { /* The visible field still retains the prompt. */ }
    }
    const startedAt = Date.now();
    setJobStartedAt(startedAt);
    setElapsedSeconds(0);
    setJobStatus("in_progress");
    setStage("loading");
    window.history.replaceState({}, "", `${window.location.pathname}?jobId=${encodeURIComponent(id)}`);
    await pollGeneration(id, "idle", [], startedAt);
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    const currentTotal = attachments.reduce((sum, item) => sum + item.size, 0);
    if (files.some((file) => file.size > 25 * 1024 * 1024) || currentTotal + files.reduce((sum, file) => sum + file.size, 0) > 60 * 1024 * 1024) { setError("单个文件不超过25MB，本次资料合计不超过60MB。"); return; }
    setError("");
    const next = await Promise.all(files.map(async (file) => ({ name: file.name, type: file.type || "application/octet-stream", data: await toDataUrl(file), size: file.size })));
    setAttachments((old) => [...old, ...next]); event.target.value = "";
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!input.trim() || stage === "loading") return;
    const answer = input.trim();
    const isFollowUp = stage === "result" && Boolean(report);
    const basePrompt = isFollowUp ? answer : (rootPrompt || answer);
    const priorReportContext = isFollowUp && report ? [
      `上一轮原始任务：${rootPrompt || report.title}`,
      `上一份报告标题：${report.title}`,
      `上一轮结论：${report.decision.verdict}。${report.decision.coreThesis}`,
      `上一轮推荐焦点：${report.recommendedFocus.segment}。${report.recommendedFocus.productWedge}`,
      `用户本次继续追问：${answer}`,
    ] : [];
    const nextContext = stage === "clarify" ? [...context, `系统追问：${question}\n用户回答：${answer}`] : isFollowUp ? priorReportContext : context;
    if (!rootPrompt || isFollowUp) {
      setRootPrompt(answer);
      try { localStorage.setItem(DRAFT_STORAGE, answer); } catch { /* The visible field still retains the prompt. */ }
    }
    const previousStage: ReturnStage = stage === "clarify" ? "clarify" : isFollowUp ? "result" : "idle";
    const controller = new AbortController();
    requestControllerRef.current = controller; manualCancelRef.current = false; returnStageRef.current = previousStage;
    const startedAt = Date.now();
    setPdfDownload((current) => {
      if (current?.url.startsWith("blob:")) URL.revokeObjectURL(current.url);
      return null;
    });
    setError(""); setConnectionNote(""); setJobStatus("queued"); setJobStartedAt(startedAt); setElapsedSeconds(0); setStage("loading");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: basePrompt, attachments, context: nextContext }), signal: controller.signal });
      const data = await response.json();
      if (response.status === 428 || data.requiresKey) { setShowSettings(true); setStage(previousStage); return; }
      if (!response.ok) throw new Error(data.error || "暂时无法生成，请重试");
      const jobId = String(data.jobId || "");
      if (!jobId.startsWith("resp_")) throw new Error("后台任务没有成功建立，请重试");
      activeJobIdRef.current = jobId; pollingJobRef.current = jobId; setJobStatus(data.status === "in_progress" ? "in_progress" : "queued");
      setActiveHistoryId(jobId);
      window.history.replaceState({}, "", `${window.location.pathname}?jobId=${encodeURIComponent(jobId)}`);
      try { localStorage.setItem(ACTIVE_JOB_STORAGE, JSON.stringify({ jobId, startedAt, previousStage, basePrompt, context: nextContext } satisfies StoredGeneration)); } catch { /* Polling still continues in this tab. */ }
      void refreshHistory();
      void pollGeneration(jobId, previousStage, nextContext, startedAt);
    } catch (caught) {
      const wasAborted = caught instanceof DOMException && caught.name === "AbortError";
      setError(wasAborted ? "后台任务启动被中断，请直接重试。" : (caught instanceof Error ? caught.message : "暂时无法生成，请重试"));
      setStage(previousStage);
    } finally { if (requestControllerRef.current === controller) requestControllerRef.current = null; }
  }

  async function pollGeneration(jobId: string, previousStage: ReturnStage, nextContext: string[], startedAtOverride?: number) {
    pollingJobRef.current = jobId;
    const safetyStartedAt = startedAtOverride || Date.now();
    let transientFailures = 0;
    while (pollingJobRef.current === jobId && !manualCancelRef.current) {
      if (Date.now() - safetyStartedAt >= JOB_TIMEOUT_MS) {
        pollingJobRef.current = "";
        localStorage.removeItem(ACTIVE_JOB_STORAGE);
        try { await fetch(`/api/generate?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" }); } catch { /* Server also enforces the limit. */ }
        setError("任务已达到10分钟安全上限，系统已自动停止，避免继续产生费用。");
        setStage(previousStage);
        return;
      }
      const controller = new AbortController(); requestControllerRef.current = controller;
      try {
        const response = await fetch(`/api/generate?jobId=${encodeURIComponent(jobId)}`, { signal: controller.signal });
        const data = await response.json();
        if (pollingJobRef.current !== jobId || manualCancelRef.current) return;
        if (response.status === 202) {
          transientFailures = 0;
          setConnectionNote(data.note || "");
          setJobStatus(data.status === "queued" ? "queued" : data.status === "continuing" ? "continuing" : "in_progress");
          await wait(data.status === "queued" ? 5000 : 3500); continue;
        }
        if (response.status === 428 || data.requiresKey) {
          localStorage.removeItem(ACTIVE_JOB_STORAGE); pollingJobRef.current = ""; setShowSettings(true); setError("管理员设置发生变化，请确认管理员凭证后继续。"); setStage(previousStage); return;
        }
        if (!response.ok) {
          if (response.status === 429 || response.status >= 500) {
            transientFailures += 1;
            if (transientFailures > 3) {
              pollingJobRef.current = "";
              localStorage.removeItem(ACTIVE_JOB_STORAGE);
              try { await fetch(`/api/generate?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" }); } catch { /* Stop locally even if cancellation request fails. */ }
              setError("连续3次连接失败，系统已停止任务，避免继续产生费用。请稍后重试。");
              setStage(previousStage);
              return;
            }
            setJobStatus("reconnecting"); setConnectionNote(data.error || `网络暂时波动，正在第${transientFailures}次重连（最多3次）。`);
            await wait(Math.min(15_000, 3000 + transientFailures * 1500)); continue;
          }
          localStorage.removeItem(ACTIVE_JOB_STORAGE); pollingJobRef.current = ""; setError(data.error || "深度研究未完成，请重试"); setStage(previousStage); return;
        }
        const nextReport = data.report as Report | undefined;
        if (!nextReport) { transientFailures += 1; setJobStatus("reconnecting"); setConnectionNote("结果正在整理，系统会继续自动获取。"); await wait(5000); continue; }
        localStorage.removeItem(ACTIVE_JOB_STORAGE); pollingJobRef.current = ""; activeJobIdRef.current = ""; setConnectionNote(""); setElapsedSeconds(0);
        if (nextReport.needsClarification) { setQuestion(nextReport.question); setContext(nextContext); setStage("clarify"); }
        else { setReport(nextReport); setStage("result"); window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50); }
        setActiveHistoryId(jobId);
        void refreshHistory();
        return;
      } catch {
        if (pollingJobRef.current !== jobId || manualCancelRef.current) return;
        transientFailures += 1;
        if (transientFailures > 3) {
          pollingJobRef.current = "";
          localStorage.removeItem(ACTIVE_JOB_STORAGE);
          try { await fetch(`/api/generate?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" }); } catch { /* Stop locally even if cancellation request fails. */ }
          setError("连续3次连接失败，系统已停止任务，避免继续产生费用。请稍后重试。");
          setStage(previousStage);
          return;
        }
        setJobStatus("reconnecting"); setConnectionNote(`连接短暂中断，正在第${transientFailures}次重连（最多3次）。`);
        await wait(Math.min(15_000, 3000 + transientFailures * 1500));
      } finally { if (requestControllerRef.current === controller) requestControllerRef.current = null; }
    }
  }

  async function cancelGeneration() {
    const jobId = activeJobIdRef.current;
    manualCancelRef.current = true; pollingJobRef.current = ""; requestControllerRef.current?.abort(); localStorage.removeItem(ACTIVE_JOB_STORAGE);
    activeJobIdRef.current = ""; setConnectionNote(""); setStage(returnStageRef.current); setError("已停止本次生成。你的内容仍然保留，可以调整后重试。");
    if (jobId) { try { await fetch(`/api/generate?jobId=${encodeURIComponent(jobId)}`, { method: "DELETE" }); } catch { /* The UI is already safely stopped. */ } }
  }

  useEffect(() => {
    fetch("/api/settings").then(async (response) => response.ok ? response.json() : null).then((data) => { if (data) { setHasKey(data.hasKey); setModel(data.model); setOfficialQr(data.officialQrData || ""); } }).catch(() => undefined);
    queueMicrotask(() => { void refreshHistory(); });
    const search = new URLSearchParams(window.location.search);
    if (search.get("demo") === "1") { queueMicrotask(() => { setReport(demoReport); setRootPrompt("我想判断未来三到五年宠物行业哪个细分类目适合做美国市场？"); setInput("我想判断未来三到五年宠物行业哪个细分类目适合做美国市场？"); setStage("result"); }); return; }
    const sharedJobId = search.get("jobId") || "";
    try {
      const stored = JSON.parse(localStorage.getItem(ACTIVE_JOB_STORAGE) || "null") as StoredGeneration | null;
      if (stored?.jobId?.startsWith("resp_") && stored.startedAt) queueMicrotask(() => {
        manualCancelRef.current = false; activeJobIdRef.current = stored.jobId; returnStageRef.current = stored.previousStage;
        setRootPrompt(stored.basePrompt); setInput(stored.basePrompt); setContext(stored.context); setJobStartedAt(stored.startedAt);
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - stored.startedAt) / 1000))); setJobStatus("in_progress"); setStage("loading");
        if (Date.now() - stored.startedAt >= JOB_TIMEOUT_MS) {
          localStorage.removeItem(ACTIVE_JOB_STORAGE);
          window.history.replaceState({}, "", window.location.pathname);
          setError("上一轮任务已超过10分钟安全上限，系统已停止。请重新提交。");
          setStage("idle");
          return;
        }
        void pollGeneration(stored.jobId, stored.previousStage, stored.context, stored.startedAt);
      });
      else {
        if (/^resp_[A-Za-z0-9_-]{8,200}$/.test(sharedJobId)) {
          window.history.replaceState({}, "", window.location.pathname);
          setError("上一轮任务链接已清理。请直接重新提交当前任务。");
        }
        const draft = localStorage.getItem(DRAFT_STORAGE) || "";
        if (draft) queueMicrotask(() => setInput(draft));
      }
    } catch { localStorage.removeItem(ACTIVE_JOB_STORAGE); }
  }, []);

  useEffect(() => { if (stage !== "loading" || !jobStartedAt) return; const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - jobStartedAt) / 1000))); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, [stage, jobStartedAt]);
  useEffect(() => {
    const textarea = composerRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = Number.parseFloat(window.getComputedStyle(textarea).maxHeight) || 320;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input, stage]);
  useEffect(() => () => { pollingJobRef.current = ""; requestControllerRef.current?.abort(); }, []);

  function updateComposer(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setInput(value);
    try {
      if (value) localStorage.setItem(DRAFT_STORAGE, value);
      else localStorage.removeItem(DRAFT_STORAGE);
    } catch { /* The visible field remains authoritative when browser storage is unavailable. */ }
  }

  function startVoice() {
    type SpeechCtor = new () => { lang: string; interimResults: boolean; start: () => void; onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void; onerror: () => void };
    const ctor = (window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: SpeechCtor }).webkitSpeechRecognition;
    if (!ctor) { setError("当前浏览器不支持语音输入，可以直接输入或粘贴内容。"); return; }
    const recognition = new ctor(); recognition.lang = "zh-CN"; recognition.interimResults = false;
    recognition.onresult = (event) => setInput((value) => `${value}${value ? " " : ""}${event.results[0][0].transcript}`);
    recognition.onerror = () => setError("没有听清，请再试一次。"); recognition.start();
  }

  async function saveSettings() {
    setSavingSettings(true); setError("");
    try { const response = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, model, officialQrData: officialQr }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "保存失败"); setHasKey(data.hasKey); setApiKey(""); setShowSettings(false); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "保存失败"); }
    finally { setSavingSettings(false); }
  }

  async function uploadOfficialQr(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { setError("二维码图片请控制在5MB以内。"); return; } setOfficialQr(await toDataUrl(file)); }

  async function downloadPdf() {
    const element = document.getElementById("report-document"); if (!element || !report) return;
    const button = document.querySelector<HTMLButtonElement>(".download-button"); if (button) { button.disabled = true; button.textContent = "正在制作…"; }
    setError("");
    let exportRoot: HTMLElement | null = null;
    const keepPreview = new URLSearchParams(window.location.search).get("pdfPreview") === "1";
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      await document.fonts.ready;
      const identity = buildReportIdentity(report);
      const prepared = createPdfSheets(element, identity.footerSlogan);
      exportRoot = prepared.exportRoot;
      if (keepPreview) exportRoot.classList.add("pdf-preview-visible");
      await wait(120);
      if (keepPreview) {
        const previewPage = Number(new URLSearchParams(window.location.search).get("pdfPage") || 0);
        if (previewPage > 0) prepared.sheets.forEach((sheet, index) => { sheet.style.display = index === previewPage - 1 ? "block" : "none"; });
        return;
      }
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      for (let index = 0; index < prepared.sheets.length; index++) {
        const canvas = await html2canvas(prepared.sheets[index], { scale: 1.25, useCORS: true, backgroundColor: "#fffdfa", logging: false, imageTimeout: 7000 });
        const image = canvas.toDataURL("image/jpeg", .9);
        if (index > 0) pdf.addPage();
        pdf.addImage(image, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }
      const name = identity.fileName;
      const qaMode = new URLSearchParams(window.location.search).get("pdfQa") === "1";
      const url = qaMode ? pdf.output("datauristring") : URL.createObjectURL(pdf.output("blob"));
      setPdfDownload((current) => {
        if (current?.url.startsWith("blob:")) URL.revokeObjectURL(current.url);
        return { url, name, reportKey: identity.reportKey };
      });
      if (!qaMode) await pdf.save(name, { returnPromise: true });
    } catch (caught) { console.error("PDF export failed", caught); setError(`PDF制作没有完成：${caught instanceof Error ? caught.message : "请稍后再试"}`); }
    finally { if (!keepPreview) exportRoot?.remove(); if (button) { button.disabled = false; button.textContent = "下载正式PDF"; } }
  }

  function startNewChat() {
    if (pdfDownload?.url.startsWith("blob:")) URL.revokeObjectURL(pdfDownload.url);
    localStorage.removeItem(ACTIVE_JOB_STORAGE);
    localStorage.removeItem(DRAFT_STORAGE);
    window.history.replaceState({}, "", window.location.pathname);
    setPdfDownload(null);
    setReport(null);
    setStage("idle");
    setElapsedSeconds(0);
    setJobStartedAt(0);
    setRootPrompt("");
    setContext([]);
    setQuestion("");
    setAttachments([]);
    setInput("");
    setActiveHistoryId("");
    setActiveView("chat");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openLibrary() {
    setActiveView("library");
    setSidebarOpen(false);
    window.history.replaceState({}, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const normalizedLibrarySearch = librarySearch.trim().toLocaleLowerCase("zh-CN");
  const filteredLibrary = library.filter((item) => {
    if (libraryFilter === "documents" && !item.id.startsWith("resp_")) return false;
    return !normalizedLibrarySearch || `${item.title} ${item.category}`.toLocaleLowerCase("zh-CN").includes(normalizedLibrarySearch);
  });
  const categoryLabel = (category: string) => ({ market: "市场研究", customer: "客户洞察", product: "产品方案", sales: "销售策略", content: "内容策划", business: "经营决策" }[category] || "正式报告");
  const formatModified = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  };
  const userInitial = Array.from(currentUser.displayName.trim())[0]?.toLocaleUpperCase() || "用";
  const currentReportKey = report ? buildReportIdentity(report).reportKey : "";
  const readyPdfDownload = pdfDownload?.reportKey === currentReportKey ? pdfDownload : null;

  const settings = showSettings ? <SettingsModal {...{ currentUser, hasKey, apiKey, setApiKey, model, setModel, officialQr, setOfficialQr, qrRef, uploadOfficialQr, saveSettings, savingSettings, error }} onClose={() => setShowSettings(false)}/> : null;
  const workspace = (content: ReactNode) => <main className={`app-shell workspace-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
    <button className="sidebar-scrim" type="button" aria-label="关闭导航" onClick={() => setSidebarOpen(false)}/>
    <aside className="workspace-sidebar" aria-label="工作台导航">
      <div className="sidebar-brand"><BrandLogo /></div>
      <nav className="primary-nav">
        <button type="button" className="new-chat-button" onClick={startNewChat}><Icon name="plus" size={18}/><span>New chat</span></button>
        <button type="button" className={`library-button ${activeView === "library" ? "active" : ""}`} onClick={openLibrary}><Icon name="library" size={18}/><span>Library</span></button>
      </nav>
      <section className="sidebar-section chats-list" aria-label="历史对话">
        <div className="sidebar-label">Chats</div>
        {chats.length ? chats.map((item) => <button type="button" key={item.id} className={activeHistoryId === item.id ? "active" : ""} onClick={() => openSavedResult(item.id, item.prompt)}><Icon name="chat" size={15}/><span><strong>{item.title}</strong><small>{item.status === "completed" ? "可继续深入" : "研究进行中"}</small></span></button>) : <p className="empty-sidebar">还没有历史对话</p>}
      </section>
      <div className="sidebar-bottom"><div className="account-row"><span className="account-avatar" aria-hidden="true">{userInitial}</span><span className="account-copy"><strong>{currentUser.displayName}</strong><small>@{currentUser.username} · {currentUser.role === "admin" ? "管理员" : "成员"}</small></span></div><div className="service-state"><i/><span>深度研究服务正常</span></div><button type="button" onClick={() => setShowSettings(true)}><Icon name="settings" size={18}/><span>系统设置</span></button></div>
    </aside>
    <div className="workspace-main">
      <header className="mobile-topbar"><button type="button" onClick={() => setSidebarOpen(true)} aria-label="打开导航"><Icon name="menu"/></button><BrandLogo placement="mobile"/><button type="button" onClick={() => setShowSettings(true)} aria-label="管理员设置"><Icon name="settings"/></button></header>
      {content}
    </div>
    {settings}
  </main>;

  if (activeView === "library") return workspace(<section className="library-page">
    <div className="library-header"><div><p>OUTPUT LIBRARY</p><h1>Library</h1><span>所有完成的输出文件都保存在这里，可以随时打开、继续完善并下载正式 PDF。</span></div><button type="button" className="library-new" onClick={startNewChat}><Icon name="plus" size={18}/><span>新对话</span></button></div>
    <div className="library-controls"><label className="library-search"><Icon name="search" size={20}/><input value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="搜索输出文件" aria-label="搜索输出文件"/></label><div className="library-tabs" role="tablist" aria-label="文件类型"><button type="button" role="tab" aria-selected={libraryFilter === "all"} className={libraryFilter === "all" ? "active" : ""} onClick={() => setLibraryFilter("all")}>全部</button><button type="button" role="tab" aria-selected={libraryFilter === "documents"} className={libraryFilter === "documents" ? "active" : ""} onClick={() => setLibraryFilter("documents")}>文档</button></div><div className="library-layout" aria-label="显示方式"><button type="button" className={libraryLayout === "grid" ? "active" : ""} onClick={() => setLibraryLayout("grid")} aria-label="网格显示"><Icon name="grid" size={19}/></button><button type="button" className={libraryLayout === "list" ? "active" : ""} onClick={() => setLibraryLayout("list")} aria-label="列表显示"><Icon name="list" size={20}/></button></div></div>
    {filteredLibrary.length ? <div className={`library-results ${libraryLayout}`}><div className="library-columns" aria-hidden="true"><span>文件名</span><span>更新时间</span><span>类型</span></div>{filteredLibrary.map((item) => <button type="button" className="library-item" key={item.id} onClick={() => openSavedResult(item.id, chats.find((chat) => chat.id === item.id)?.prompt || item.title)}><span className="library-file-icon"><Icon name="file" size={21}/></span><span className="library-item-copy"><strong>{item.title}</strong><small>点击打开成果并下载正式 PDF</small></span><span className="library-date">{formatModified(item.createdAt)}</span><span className="library-type">{categoryLabel(item.category)}</span></button>)}</div> : <div className="library-empty"><span className="library-file-icon"><Icon name="library" size={24}/></span><h2>{librarySearch ? "没有找到匹配的文件" : "还没有输出文件"}</h2><p>{librarySearch ? "换一个关键词试试，文件不会被删除。" : "完成第一份成果后，它会自动保存在这里。"}</p><button type="button" className="secondary-button" onClick={librarySearch ? () => setLibrarySearch("") : startNewChat}>{librarySearch ? "清除搜索" : "开始新对话"}</button></div>}
  </section>);

  if (stage === "result" && report) return workspace(<div className="result-wrap">
    <div className="result-toolbar"><strong>你的深度成果已经完成</strong><div className="toolbar-actions"><button className="secondary-button" onClick={startNewChat}>新对话</button>{readyPdfDownload ? <a className="download-button ready" href={readyPdfDownload.url} download={readyPdfDownload.name}>再次下载当前PDF</a> : <button className="download-button" onClick={downloadPdf}>下载正式PDF</button>}</div></div>
    <ReportView report={report} officialQr={officialQr}/>
    <section className="continue-panel"><div><small>CONTINUE THIS CHAT</small><h2>在这份结果上继续深入</h2><p>原问题会一直保留。你可以补充资料、追问某个结论，或要求把其中一个方案继续做成。</p></div><form className="composer followup-composer" onSubmit={submit}><textarea ref={composerRef} value={input} onChange={updateComposer} aria-label="继续追问" placeholder="例如：把第一优先产品继续拆成90天上市计划…"/><div className="composer-actions"><div className="tool-actions"><button className="icon-action" type="button" onClick={() => fileRef.current?.click()} aria-label="添加图片或文件"><Icon name="plus"/></button><button className="icon-action" type="button" onClick={startVoice} aria-label="语音输入"><Icon name="mic"/></button></div><button className="submit-button" disabled={!input.trim()}><span>继续深入</span><Icon name="send" size={18}/></button></div><input ref={fileRef} type="file" multiple hidden onChange={addFiles} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.ppt,.pptx,.zip,.srt,.vtt"/></form></section>
    {error && <div className="error-box">{error}</div>}
  </div>);

  return workspace(<section className="hero"><div className="eyebrow">{currentUser.displayName} · 把事干成</div><h1>最想把 <em>什么事情做成？</em></h1><form className="composer" onSubmit={submit}><textarea ref={composerRef} value={input} onChange={updateComposer} placeholder={stage === "clarify" ? "在这里回答，系统会继续完成结果…" : "比如：我想判断未来3—5年宠物市场里，哪个细分最值得进入。也可以直接粘贴聊天记录、需求或资料…"} aria-label="告诉系统你想完成什么"/>{attachments.length > 0 && <div className="attachments">{attachments.map((file, index) => <div className="attachment" key={`${file.name}-${index}`}><Icon name="file" size={15}/><span>{file.name}</span><button type="button" onClick={() => setAttachments((old) => old.filter((_, i) => i !== index))} aria-label={`移除${file.name}`}><Icon name="close" size={14}/></button></div>)}</div>}<div className="composer-actions"><div className="tool-actions"><button className="icon-action" type="button" onClick={() => fileRef.current?.click()} aria-label="添加图片或文件"><Icon name="plus"/></button><button className="icon-action" type="button" onClick={startVoice} aria-label="语音输入"><Icon name="mic"/></button></div><button className="submit-button" disabled={!input.trim() || stage === "loading"}><span>{stage === "clarify" ? "继续完成" : "开始帮我完成"}</span><Icon name="send" size={18}/></button></div><input ref={fileRef} type="file" multiple hidden onChange={addFiles} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.ppt,.pptx,.zip,.srt,.vtt"/></form>{stage === "loading" && <div className="work-stage" aria-live="polite"><div className="thinking"><div className="thinking-head"><div className="thinking-title">{jobStatus === "queued" ? "深度研究任务已接收" : jobStatus === "reconnecting" ? "研究仍在后台继续" : jobStatus === "continuing" ? "正在自动整理完整报告" : "专家团队正在做深度研究"}</div><span className="elapsed-time">已运行 {elapsedSeconds < 60 ? `${elapsedSeconds}秒` : `${Math.floor(elapsedSeconds / 60)}分${elapsedSeconds % 60}秒`}</span></div><div className="generation-progress"><span style={{ width: `${jobStatus === "queued" ? 18 : jobStatus === "continuing" ? 94 : Math.min(92, 28 + elapsedSeconds * .12)}%` }}/></div><div className="thinking-steps"><div className={`thinking-step ${elapsedSeconds >= 35 ? "done" : "active"}`}><span className="pulse-dot"/>界定市场、国家、品类与最终决策</div><div className={`thinking-step ${elapsedSeconds >= 110 ? "done" : elapsedSeconds >= 35 ? "active" : ""}`}><span className="pulse-dot"/>核查数据并生成趋势与结构图</div><div className={`thinking-step ${elapsedSeconds >= 190 ? "done" : elapsedSeconds >= 110 ? "active" : ""}`}><span className="pulse-dot"/>下钻细分类目、利润与创新机会</div><div className={`thinking-step ${jobStatus === "continuing" || elapsedSeconds >= 190 ? "active" : ""}`}><span className="pulse-dot"/>完成专家判断、渠道打法与行动计划</div></div><div className={`job-health ${jobStatus === "reconnecting" ? "warning" : elapsedSeconds >= 900 ? "watch" : "normal"}`}><span/>{jobStatus === "reconnecting" ? "连接恢复中 · 后台任务没有中断" : elapsedSeconds >= 900 ? "长任务重点监测中 · 达到输出上限会自动续接" : "后台状态正常 · 任务已保存，可刷新恢复"}</div><p className={`thinking-note ${connectionNote ? "connection-note" : ""}`}>{connectionNote || (elapsedSeconds < 180 ? "任务会在后台持续运行；即使刷新页面，系统也会自动接回。" : "网页搜索与证据越多，研究时间越长；现在不会再因5分钟截止而中断。")}</p><button type="button" className="cancel-generation" onClick={cancelGeneration}>停止本次生成</button></div></div>}{stage === "clarify" && <div className="work-stage"><div className="clarify-card"><small>只差一个会改变结论的答案</small><p>{question}</p></div></div>}{error && <div className="error-box">{error}</div>}<div className="promise"><span>真实数据</span><i/><span>趋势图表</span><i/><span>细分机会</span><i/><span>专家会诊</span><i/><span>具体打法</span></div>{!hasKey && <div className="status-note">管理员完成设置后，即可正式生成成果。</div>}</section>);
}

type SettingsProps = { currentUser: CurrentUser; hasKey: boolean; apiKey: string; setApiKey: (value: string) => void; model: string; setModel: (value: string) => void; officialQr: string; setOfficialQr: (value: string) => void; qrRef: RefObject<HTMLInputElement | null>; uploadOfficialQr: (event: ChangeEvent<HTMLInputElement>) => void; saveSettings: () => void; savingSettings: boolean; error: string; onClose: () => void };
function SettingsModal({ currentUser, hasKey, apiKey, setApiKey, model, setModel, officialQr, setOfficialQr, qrRef, uploadOfficialQr, saveSettings, savingSettings, error, onClose }: SettingsProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [memberForm, setMemberForm] = useState({ username: "", displayName: "", password: "" });
  const [memberError, setMemberError] = useState("");
  const [memberBusy, setMemberBusy] = useState(false);

  async function loadUsers() {
    if (currentUser.role !== "admin") return;
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json() as { users?: ManagedUser[]; error?: string };
    if (!response.ok) throw new Error(data.error || "成员读取失败");
    setUsers(data.users || []);
  }

  useEffect(() => {
    if (currentUser.role !== "admin") return;
    queueMicrotask(async () => {
      try {
        const response = await fetch("/api/admin/users", { cache: "no-store" });
        const data = await response.json() as { users?: ManagedUser[]; error?: string };
        if (!response.ok) throw new Error(data.error || "成员读取失败");
        setUsers(data.users || []);
      } catch (caught) { setMemberError(caught instanceof Error ? caught.message : "成员读取失败"); }
    });
  }, [currentUser.role]);

  async function createMember(event: FormEvent) {
    event.preventDefault(); setMemberBusy(true); setMemberError("");
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(memberForm) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "账号创建失败");
      setMemberForm({ username: "", displayName: "", password: "" }); await loadUsers();
    } catch (caught) { setMemberError(caught instanceof Error ? caught.message : "账号创建失败"); }
    finally { setMemberBusy(false); }
  }

  async function toggleMember(user: ManagedUser) {
    setMemberBusy(true); setMemberError("");
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, active: !user.active }) });
      const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || "操作失败"); await loadUsers();
    } catch (caught) { setMemberError(caught instanceof Error ? caught.message : "操作失败"); }
    finally { setMemberBusy(false); }
  }

  async function deleteMember(user: ManagedUser) {
    if (!window.confirm(`确定删除子账号“${user.displayName}”吗？该账号将立即无法登录，历史成果保留。`)) return;
    setMemberBusy(true); setMemberError("");
    try {
      const response = await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id }) });
      const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || "删除失败"); await loadUsers();
    } catch (caught) { setMemberError(caught instanceof Error ? caught.message : "删除失败"); }
    finally { setMemberBusy(false); }
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.assign("/"); }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="settings-modal settings-wide"><div className="modal-head"><div><h2>{currentUser.role === "admin" ? "管理员设置" : "账号设置"}</h2><p>{currentUser.displayName} · @{currentUser.username}</p></div><button className="close-button" onClick={onClose} aria-label="关闭"><Icon name="close" size={18}/></button></div>
    <div className="account-setting-row"><div><strong>{currentUser.role === "admin" ? "管理员账号" : "成员账号"}</strong><span>当前登录：{currentUser.displayName}</span></div><button type="button" className="secondary-button" onClick={logout}>退出登录</button></div>
    {currentUser.role === "admin" && <>
      <section className="settings-section"><div className="settings-section-title"><div><small>MEMBERS & ACCESS</small><h3>成员与权限</h3></div><span>{users.filter((item) => item.role === "member").length} 个子账号</span></div>
        <form className="member-create" onSubmit={createMember}><label><span>显示名字</span><input value={memberForm.displayName} onChange={(event) => setMemberForm((old) => ({ ...old, displayName: event.target.value }))} placeholder="例如：苏苏"/></label><label><span>登录用户名</span><input value={memberForm.username} onChange={(event) => setMemberForm((old) => ({ ...old, username: event.target.value }))} placeholder="支持中文或英文"/></label><label><span>永久密码</span><input type="password" value={memberForm.password} onChange={(event) => setMemberForm((old) => ({ ...old, password: event.target.value }))} placeholder="至少8位"/></label><button type="submit" disabled={memberBusy || !memberForm.username || !memberForm.password}>新增子账号</button></form>
        {memberError && <div className="error-box">{memberError}</div>}
        <div className="member-list">{users.map((user) => <div className="member-row" key={user.id}><span className="member-avatar">{Array.from(user.displayName)[0] || "用"}</span><div><strong>{user.displayName}</strong><small>@{user.username} · {user.role === "admin" ? "管理员" : user.active ? "已启用" : "已停用"}</small></div>{user.role === "member" && <div className="member-actions"><button type="button" disabled={memberBusy} onClick={() => toggleMember(user)}>{user.active ? "停用" : "启用"}</button><button type="button" className="danger-text" disabled={memberBusy} onClick={() => deleteMember(user)}>删除</button></div>}</div>)}</div>
      </section>
      <section className="settings-section"><div className="settings-section-title"><div><small>SERVICES & KEY</small><h3>服务与 Key</h3></div><span>{hasKey ? "已配置" : "未配置"}</span></div>
        <div className="setting-group"><label>OpenAI API Key</label><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={hasKey ? "已配置（密钥已掩码），留空保持不变" : "粘贴你的API Key"}/><div className="setting-help">密钥只在服务器加密保存，普通成员无法查看。</div></div>
        <div className="setting-group"><label>使用模型</label><select value={model} onChange={(event) => setModel(event.target.value)}><option value="gpt-5.6">GPT-5.6 · 深度研究</option><option value="gpt-5.4">GPT-5.4 · 平衡</option></select></div>
        <div className="setting-group"><label>公众号二维码</label><div className="upload-tile" onClick={() => qrRef.current?.click()}>{officialQr ? <img src={officialQr} alt="公众号二维码"/> : <div className="upload-placeholder"><Icon name="plus"/></div>}<div><strong>{officialQr ? "已添加公众号二维码" : "点击添加公众号二维码"}</strong><div className="setting-help">会自动出现在每一份正式PDF的品牌收口页。</div></div></div><input ref={qrRef} type="file" accept="image/*" hidden onChange={uploadOfficialQr}/>{officialQr && <button type="button" className="secondary-button remove-qr" onClick={() => setOfficialQr("")}>移除</button>}</div>
        {error && <div className="error-box">{error}</div>}<button className="save-settings" onClick={saveSettings} disabled={savingSettings}>{savingSettings ? "正在保存…" : "保存服务设置"}</button>
      </section>
    </>}
  </section></div>;
}
