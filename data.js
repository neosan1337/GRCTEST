// Sample GRC data. Replace with your organisation's records or load from an API.
// Dates are ISO strings (YYYY-MM-DD).
window.GRC_SEED = {
  asOf: "2026-10-01",

  frameworks: [
    { id: "iso27001", name: "ISO/IEC 27001:2022" },
    { id: "soc2", name: "SOC 2 Type II" },
    { id: "nistcsf", name: "NIST CSF 2.0" },
    { id: "gdpr", name: "GDPR" },
  ],

  // status: implemented | partial | missing
  controls: [
    { id: "A.5.1", framework: "iso27001", name: "Policies for information security", owner: "CISO", status: "implemented", lastTested: "2026-07-14" },
    { id: "A.5.15", framework: "iso27001", name: "Access control", owner: "IT Ops", status: "implemented", lastTested: "2026-08-02" },
    { id: "A.5.23", framework: "iso27001", name: "Cloud services security", owner: "Platform", status: "partial", lastTested: "2026-05-20" },
    { id: "A.5.30", framework: "iso27001", name: "ICT readiness for business continuity", owner: "IT Ops", status: "partial", lastTested: "2026-03-11" },
    { id: "A.8.8", framework: "iso27001", name: "Management of technical vulnerabilities", owner: "Security Eng", status: "implemented", lastTested: "2026-09-01" },
    { id: "A.8.13", framework: "iso27001", name: "Information backup", owner: "IT Ops", status: "implemented", lastTested: "2026-06-30" },
    { id: "A.8.16", framework: "iso27001", name: "Monitoring activities", owner: "SOC", status: "partial", lastTested: "2026-04-18" },
    { id: "A.8.28", framework: "iso27001", name: "Secure coding", owner: "Engineering", status: "missing", lastTested: null },

    { id: "CC1.1", framework: "soc2", name: "Integrity and ethical values", owner: "HR", status: "implemented", lastTested: "2026-06-12" },
    { id: "CC6.1", framework: "soc2", name: "Logical access security", owner: "IT Ops", status: "implemented", lastTested: "2026-08-02" },
    { id: "CC6.6", framework: "soc2", name: "Boundary protection", owner: "Platform", status: "implemented", lastTested: "2026-07-21" },
    { id: "CC7.2", framework: "soc2", name: "System monitoring", owner: "SOC", status: "partial", lastTested: "2026-04-18" },
    { id: "CC7.4", framework: "soc2", name: "Incident response", owner: "Security Eng", status: "implemented", lastTested: "2026-05-05" },
    { id: "CC8.1", framework: "soc2", name: "Change management", owner: "Engineering", status: "partial", lastTested: "2026-02-27" },
    { id: "CC9.2", framework: "soc2", name: "Vendor risk management", owner: "Procurement", status: "missing", lastTested: null },

    { id: "GV.OC", framework: "nistcsf", name: "Organizational context", owner: "CISO", status: "implemented", lastTested: "2026-01-15" },
    { id: "GV.SC", framework: "nistcsf", name: "Supply chain risk management", owner: "Procurement", status: "missing", lastTested: null },
    { id: "ID.AM", framework: "nistcsf", name: "Asset management", owner: "IT Ops", status: "partial", lastTested: "2026-03-29" },
    { id: "PR.AA", framework: "nistcsf", name: "Identity & access control", owner: "IT Ops", status: "implemented", lastTested: "2026-08-02" },
    { id: "PR.DS", framework: "nistcsf", name: "Data security", owner: "Security Eng", status: "partial", lastTested: "2026-06-01" },
    { id: "DE.CM", framework: "nistcsf", name: "Continuous monitoring", owner: "SOC", status: "partial", lastTested: "2026-04-18" },
    { id: "RS.MA", framework: "nistcsf", name: "Incident management", owner: "Security Eng", status: "implemented", lastTested: "2026-05-05" },
    { id: "RC.RP", framework: "nistcsf", name: "Recovery plan execution", owner: "IT Ops", status: "missing", lastTested: null },

    { id: "Art.5", framework: "gdpr", name: "Principles of processing", owner: "DPO", status: "implemented", lastTested: "2026-02-10" },
    { id: "Art.17", framework: "gdpr", name: "Right to erasure", owner: "DPO", status: "partial", lastTested: "2026-05-14" },
    { id: "Art.30", framework: "gdpr", name: "Records of processing", owner: "DPO", status: "implemented", lastTested: "2026-07-08" },
    { id: "Art.32", framework: "gdpr", name: "Security of processing", owner: "CISO", status: "implemented", lastTested: "2026-08-19" },
    { id: "Art.33", framework: "gdpr", name: "Breach notification", owner: "Legal", status: "implemented", lastTested: "2026-05-05" },
    { id: "Art.35", framework: "gdpr", name: "Data protection impact assessment", owner: "DPO", status: "partial", lastTested: "2026-03-02" },
  ],

  // likelihood and impact are 1..5. status: open | mitigating | accepted | closed
  risks: [
    { id: "R-001", title: "Ransomware encrypts production file servers", category: "Cyber", owner: "CISO", likelihood: 3, impact: 5, status: "mitigating", due: "2026-11-30" },
    { id: "R-002", title: "Critical SaaS vendor lacks SOC 2 report", category: "Third party", owner: "Procurement", likelihood: 4, impact: 3, status: "open", due: "2026-10-15" },
    { id: "R-003", title: "Privileged accounts without MFA", category: "Cyber", owner: "IT Ops", likelihood: 2, impact: 5, status: "mitigating", due: "2026-10-20" },
    { id: "R-004", title: "DSAR backlog breaches 30-day deadline", category: "Privacy", owner: "DPO", likelihood: 3, impact: 3, status: "open", due: "2026-09-15" },
    { id: "R-005", title: "Single region hosting for customer API", category: "Operational", owner: "Platform", likelihood: 2, impact: 4, status: "accepted", due: "2027-03-31" },
    { id: "R-006", title: "Unpatched internet-facing VPN appliance", category: "Cyber", owner: "Security Eng", likelihood: 4, impact: 5, status: "open", due: "2026-10-05" },
    { id: "R-007", title: "Key-person dependency in payroll", category: "Operational", owner: "HR", likelihood: 3, impact: 2, status: "open", due: "2026-12-31" },
    { id: "R-008", title: "Secrets committed to source control", category: "Cyber", owner: "Engineering", likelihood: 3, impact: 4, status: "mitigating", due: "2026-10-31" },
    { id: "R-009", title: "New AI regulation changes model disclosure duties", category: "Compliance", owner: "Legal", likelihood: 4, impact: 2, status: "open", due: "2027-01-31" },
    { id: "R-010", title: "Backups not restore-tested in 12 months", category: "Operational", owner: "IT Ops", likelihood: 2, impact: 4, status: "mitigating", due: "2026-09-25" },
    { id: "R-011", title: "Phishing leads to finance payment fraud", category: "Fraud", owner: "Finance", likelihood: 3, impact: 4, status: "open", due: "2026-11-15" },
    { id: "R-012", title: "Laptop loss exposes unencrypted data", category: "Cyber", owner: "IT Ops", likelihood: 1, impact: 3, status: "closed", due: "2026-06-30" },
    { id: "R-013", title: "Cross-border transfers lack SCCs", category: "Privacy", owner: "DPO", likelihood: 2, impact: 3, status: "open", due: "2026-12-15" },
    { id: "R-014", title: "Shadow IT tools processing customer data", category: "Compliance", owner: "CISO", likelihood: 4, impact: 3, status: "open", due: "2026-11-01" },
    { id: "R-015", title: "Office access badges not revoked on exit", category: "Physical", owner: "Facilities", likelihood: 2, impact: 2, status: "closed", due: "2026-05-31" },
  ],

  // severity: low | medium | high | critical. closed is null while open.
  findings: [
    { id: "F-101", title: "Quarterly access review not evidenced", source: "Internal audit", severity: "medium", opened: "2025-11-04", due: "2026-01-31", closed: "2026-01-20" },
    { id: "F-102", title: "Firewall rule base contains any/any rules", source: "Pen test", severity: "high", opened: "2025-11-18", due: "2026-01-15", closed: "2026-02-10" },
    { id: "F-103", title: "Vendor contracts missing DPA clause", source: "GDPR review", severity: "medium", opened: "2025-12-02", due: "2026-03-31", closed: "2026-04-22" },
    { id: "F-104", title: "SIEM log retention below 12 months", source: "SOC 2 audit", severity: "medium", opened: "2026-01-12", due: "2026-04-30", closed: null },
    { id: "F-105", title: "Change tickets lack approver evidence", source: "SOC 2 audit", severity: "high", opened: "2026-01-12", due: "2026-03-31", closed: "2026-05-02" },
    { id: "F-106", title: "SQL injection in legacy reporting app", source: "Pen test", severity: "critical", opened: "2026-02-20", due: "2026-03-06", closed: "2026-03-04" },
    { id: "F-107", title: "BCP not exercised this year", source: "ISO surveillance", severity: "medium", opened: "2026-03-09", due: "2026-09-30", closed: null },
    { id: "F-108", title: "Joiner/mover/leaver SLA missed", source: "Internal audit", severity: "low", opened: "2026-04-01", due: "2026-06-30", closed: "2026-06-12" },
    { id: "F-109", title: "No SAST in CI pipeline", source: "ISO surveillance", severity: "high", opened: "2026-05-15", due: "2026-08-31", closed: null },
    { id: "F-110", title: "Retention schedule not applied to CRM", source: "GDPR review", severity: "medium", opened: "2026-06-03", due: "2026-10-31", closed: null },
    { id: "F-111", title: "Stale admin accounts in cloud console", source: "Pen test", severity: "high", opened: "2026-07-10", due: "2026-08-10", closed: "2026-08-05" },
    { id: "F-112", title: "Asset inventory incomplete for OT network", source: "Internal audit", severity: "medium", opened: "2026-08-04", due: "2026-11-30", closed: null },
    { id: "F-113", title: "TLS 1.0 enabled on mail relay", source: "Pen test", severity: "high", opened: "2026-09-08", due: "2026-10-08", closed: null },
    { id: "F-114", title: "Security awareness completion at 81%", source: "Internal audit", severity: "low", opened: "2026-09-15", due: "2026-12-15", closed: null },
  ],

  policies: [
    { id: "POL-01", name: "Information Security Policy", owner: "CISO", version: "4.2", lastReviewed: "2026-02-01", reviewCycleMonths: 12, attestation: 0.97 },
    { id: "POL-02", name: "Acceptable Use Policy", owner: "HR", version: "3.0", lastReviewed: "2025-09-10", reviewCycleMonths: 12, attestation: 0.93 },
    { id: "POL-03", name: "Access Control Policy", owner: "IT Ops", version: "2.4", lastReviewed: "2026-05-22", reviewCycleMonths: 12, attestation: 0.88 },
    { id: "POL-04", name: "Data Protection & Privacy Policy", owner: "DPO", version: "5.1", lastReviewed: "2025-06-14", reviewCycleMonths: 12, attestation: 0.95 },
    { id: "POL-05", name: "Incident Response Plan", owner: "Security Eng", version: "2.0", lastReviewed: "2026-04-03", reviewCycleMonths: 6, attestation: 0.79 },
    { id: "POL-06", name: "Business Continuity Policy", owner: "IT Ops", version: "1.7", lastReviewed: "2025-11-20", reviewCycleMonths: 12, attestation: 0.84 },
    { id: "POL-07", name: "Third-Party Risk Policy", owner: "Procurement", version: "1.2", lastReviewed: "2026-08-30", reviewCycleMonths: 12, attestation: 0.71 },
    { id: "POL-08", name: "Secure Development Policy", owner: "Engineering", version: "1.0", lastReviewed: "2026-01-12", reviewCycleMonths: 12, attestation: 0.66 },
  ],
};
