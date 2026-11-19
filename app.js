const SAMPLE_LEADS = [
  {
    name: "David Chen, VP of Engineering",
    size: "enterprise",
    message: "We have approved budget for Q4 and need to migrate 400 seats off our legacy vendor next month. Can we schedule an enterprise security review and pricing call this week?"
  },
  {
    name: "Amara Okafor, Head of Product",
    size: "midmarket",
    message: "Evaluating three automation tools for our workflow team. Looking for API documentation, webhook support, and a 14-day trial."
  },
  {
    name: "Lucas Meyer, Student Researcher",
    size: "startup",
    message: "Just browsing your platform for a university research paper on workflow automation. Do you offer a free tier?"
  }
];

let sampleCursor = 0;
let leads = [];

const SIZE_WEIGHTS = {
  enterprise: { points: 30, dealValue: 48000, label: "Enterprise (500+)" },
  midmarket: { points: 22, dealValue: 18000, label: "Mid-Market (50–499)" },
  smb: { points: 12, dealValue: 6000, label: "SMB (10–49)" },
  startup: { points: 5, dealValue: 1500, label: "Startup (1–9)" }
};

const BUYING_SIGNALS = [
  { keyword: "budget", points: 18, label: "Approved Budget" },
  { keyword: "migrate", points: 15, label: "Active Migration" },
  { keyword: "pricing", points: 14, label: "Pricing Inquiry" },
  { keyword: "this week", points: 15, label: "Immediate Timeline" },
  { keyword: "next month", points: 12, label: "Near-Term Rollout" },
  { keyword: "security", points: 10, label: "Compliance/Security Review" },
  { keyword: "api", points: 8, label: "Technical Integration" },
  { keyword: "trial", points: 8, label: "Trial Request" },
  { keyword: "vp", points: 12, label: "Executive Decision Maker" },
  { keyword: "head of", points: 10, label: "Department Leader" },
  { keyword: "director", points: 10, label: "Department Leader" }
];

const NEGATIVE_SIGNALS = [
  { keyword: "student", points: -25, label: "Academic / Non-Commercial" },
  { keyword: "free tier", points: -15, label: "Free-Tier Only" },
  { keyword: "just browsing", points: -12, label: "Low Buying Intent" }
];

function scoreLead(name, size, message) {
  const combined = `${name} ${message}`.toLowerCase();
  const sizeData = SIZE_WEIGHTS[size] || SIZE_WEIGHTS.midmarket;

  let score = 20 + sizeData.points;
  const detectedSignals = [sizeData.label];

  BUYING_SIGNALS.forEach(sig => {
    if (combined.includes(sig.keyword)) {
      score += sig.points;
      if (!detectedSignals.includes(sig.label)) detectedSignals.push(sig.label);
    }
  });

  NEGATIVE_SIGNALS.forEach(sig => {
    if (combined.includes(sig.keyword)) {
      score += sig.points;
      detectedSignals.push(sig.label);
    }
  });

  score = Math.max(5, Math.min(99, score));

  let tier = "Cold";
  let action = "Enroll in automated educational email nurture sequence.";
  if (score >= 70) {
    tier = "Hot";
    action = "Route immediately to Senior Account Executive (SLA: < 15 mins).";
  } else if (score >= 45) {
    tier = "Warm";
    action = "Assign to SDR for discovery call & send tailored case study.";
  }

  return {
    id: Date.now() + Math.random(),
    name,
    sizeLabel: sizeData.label,
    dealValue: tier === "Cold" ? 0 : sizeData.dealValue,
    message,
    score,
    tier,
    signals: detectedSignals,
    action
  };
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function renderDashboard() {
  // Sort highest score first
  leads.sort((a, b) => b.score - a.score);

  const total = leads.length;
  const hotCount = leads.filter(l => l.tier === "Hot").length;
  const avgScore = total ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / total) : 0;
  const pipeline = leads.reduce((sum, l) => sum + l.dealValue, 0);

  document.getElementById("kpiTotal").textContent = total;
  document.getElementById("kpiHot").textContent = hotCount;
  document.getElementById("kpiAvg").textContent = `${avgScore}/100`;
  document.getElementById("kpiPipeline").textContent = `$${pipeline.toLocaleString()}`;

  const queue = document.getElementById("leadQueue");
  queue.innerHTML = "";

  leads.forEach(lead => {
    const card = document.createElement("div");
    card.className = "lead-card";
    card.innerHTML = `
      <div class="lead-top">
        <div class="lead-meta">
          <h3>${escapeHTML(lead.name)}</h3>
          <span>${lead.sizeLabel} • Est. ACV: $${lead.dealValue.toLocaleString()}</span>
        </div>
        <span class="score-pill tier-${lead.tier}">${lead.tier} • ${lead.score}/100</span>
      </div>
      <p class="lead-notes">"${escapeHTML(lead.message)}"</p>
      <div class="signals">
        ${lead.signals.map(s => `<span class="signal-tag">${s}</span>`).join("")}
      </div>
      <div class="routing-box">
        <strong>Recommended Routing:</strong> ${lead.action}
      </div>
    `;
    queue.appendChild(card);
  });
}

document.getElementById("leadForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("leadName").value.trim();
  const size = document.getElementById("companySize").value;
  const message = document.getElementById("leadMessage").value.trim();

  if (!name || !message) return;

  leads.push(scoreLead(name, size, message));
  renderDashboard();
  e.target.reset();
});

document.getElementById("sampleBtn").addEventListener("click", () => {
  const sample = SAMPLE_LEADS[sampleCursor % SAMPLE_LEADS.length];
  sampleCursor++;
  document.getElementById("leadName").value = sample.name;
  document.getElementById("companySize").value = sample.size;
  document.getElementById("leadMessage").value = sample.message;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("leadForm").reset();
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const headers = ["Name", "Segment", "Score", "Tier", "Est_ACV", "Signals", "Routing"];
  const rows = leads.map(l => [
    `"${l.name.replace(/"/g, '""')}"`,
    `"${l.sizeLabel}"`,
    l.score,
    l.tier,
    l.dealValue,
    `"${l.signals.join("; ")}"`,
    `"${l.action}"`
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "qualified-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
});

// Seed initial leads
SAMPLE_LEADS.forEach(s => leads.push(scoreLead(s.name, s.size, s.message)));
renderDashboard();
