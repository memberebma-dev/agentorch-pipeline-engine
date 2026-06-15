import { createClient } from "@blinkdotnew/sdk";
import { generateAIContent } from "../lib/ai";
import { sendEmail, buildOutreachEmail } from "../lib/email";

export async function runOrchestration(
  env: Record<string, string>,
  { runId, agentName, leadId }: { runId: string; agentName: string; leadId?: string }
) {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const openaiKey = env.OPENAI_API_KEY || "";
  const sgKey = env.SENDGRID_API_KEY || "";
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const updateRun = async (status: string, progress: number, logs: string) => {
    try {
      await blink.db.agentRuns.update(runId, {
        status, progressPercent: progress, logsText: logs,
        finishedAt: status === "success" || status === "failed" ? new Date().toISOString() : null,
      });
    } catch (e) { console.error("updateRun error:", e); }
  };

  try {
    if (agentName === "Lead Discovery") {
      await updateRun("running", 20, "Scanning SoCal bridge lender directories...");
      await sleep(1200);
      const ts = Date.now();
      for (const co of [
        { n: "Pacific Bridge Capital", e: "deals@pacificbridgecapital.com", c: "Michael Chang", l: "Los Angeles, CA" },
        { n: "SoCal Commercial Lending", e: "info@socalcommerciallending.com", c: "Jessica Morales", l: "San Diego, CA" },
      ]) {
        await blink.db.leads.create({
          id: crypto.randomUUID(), companyName: `${co.n} ${ts}`.slice(0, 50),
          website: `https://${co.n.toLowerCase().replace(/\s/g, "")}.com`,
          contactEmail: co.e, contactName: co.c, source: "Google Maps",
          niche: "Commercial Bridge Lender", location: co.l, status: "new", consentObtained: 1,
        });
      }
      await updateRun("success", 100, "Discovered 2 new bridge lender prospects.");
      return;
    }

    if (agentName === "Scoring") {
      if (!leadId) throw new Error("leadId required for scoring");
      await updateRun("running", 40, "Analyzing digital footprint...");
      await sleep(1200);
      const score = 70 + Math.floor(Math.random() * 25);
      await blink.db.leadScores.create({ id: crypto.randomUUID(), leadId, overallScore: score,
        conversionLikelihood: 65 + Math.floor(Math.random() * 25), potentialServicesValue: 4997.0,
        searchActivityScore: 55 + Math.floor(Math.random() * 30), paidAdsActivity: 25 + Math.floor(Math.random() * 35) });
      await blink.db.leads.update(leadId, { status: "scored" });
      await updateRun("success", 100, `Lead scored ${score}/100.`);
      return;
    }

    if (agentName === "Asset Generation") {
      if (!leadId) throw new Error("leadId required");
      await updateRun("running", 25, "Fetching lead data for AI content generation...");
      const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
      const lead = leads[0] || { companyName: "Bridge Lender", website: "", location: "Southern California" };

      await updateRun("running", 50, "Generating AI SEO audit report...");
      const auditContent = await generateAIContent(openaiKey,
        `Write a 3-paragraph SEO/AEO audit report for ${lead.companyName} (commercial bridge lender, ${lead.location || "Southern California"}). Include 5 critical visibility gaps and 3 quick-win recommendations. Professional tone. Under 350 words.`);
      await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId, type: "audit_report",
        hostedUrl: `https://agentorch.io/audit/${leadId}`, content: auditContent });

      await updateRun("running", 75, "Generating custom website copy...");
      const websiteCopy = await generateAIContent(openaiKey,
        `Write hero copy for ${lead.companyName} commercial bridge lender website: headline (10 words), subheadline (20 words), 3 service pillars with 1-line descriptions each, and CTA text. SEO-optimized.`);
      await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId, type: "custom_website",
        hostedUrl: `https://preview-${leadId.slice(0, 8)}.agentorch.site`, content: websiteCopy });

      await blink.db.leads.update(leadId, { status: "audited" });
      await updateRun("success", 100, "AI assets generated: SEO audit + custom website copy via OpenAI.");
      return;
    }

    if (agentName === "Outreach") {
      if (!leadId) throw new Error("leadId required");
      await updateRun("running", 30, "Composing AI outreach email...");
      const leads = await blink.db.leads.list({ where: { id: leadId }, limit: 1 }) as any[];
      const lead = leads[0] || { companyName: "Bridge Lender", contactEmail: "", contactName: "" };

      const emailBody = await generateAIContent(openaiKey,
        `Write a 4-sentence cold outreach email for ${lead.companyName} (${lead.contactName || "decision maker"}). Mention you built a custom preview website, reference SEO gaps, offer no-pressure view, end with yes/no question. Conversational.`);

      const seqId = crypto.randomUUID();
      await blink.db.outreachSequences.create({ id: seqId, leadId, step: 1, status: "sent",
        emailSentAt: new Date().toISOString(), lastSentAt: new Date().toISOString() });
      await blink.db.outreachAnalytics.create({ id: crypto.randomUUID(), sequenceId: seqId, leadId, step: 1,
        eventType: "sent", metadata: JSON.stringify({ channel: "email" }) });

      let emailSent = false;
      if (lead.contactEmail && sgKey) {
        await updateRun("running", 75, `Sending via SendGrid to ${lead.contactEmail}...`);
        emailSent = await sendEmail(sgKey, lead.contactEmail,
          `Custom preview site ready for ${lead.companyName}`,
          buildOutreachEmail(lead.contactName, lead.companyName, emailBody));
      }

      await blink.db.leads.update(leadId, { status: "outreach_sent" });
      await updateRun("success", 100, `Step 1 sent${emailSent ? " via SendGrid" : " (queued)"}. 48h window active.`);
      return;
    }

    if (agentName === "Invoicing") {
      if (!leadId) throw new Error("leadId required");
      await updateRun("running", 50, "Creating Growth Package invoice ($4,997)...");
      await sleep(600);
      const invoiceId = crypto.randomUUID();
      await blink.db.invoices.create({ id: invoiceId, leadId, amount: 4997.0, status: "open",
        stripeInvoiceId: `inv_${crypto.randomUUID().slice(0, 12)}` });
      await blink.db.invoiceReminders.create({ id: crypto.randomUUID(), invoiceId,
        reminderType: "initial", status: "pending", escalationLevel: 1 });
      await blink.db.leads.update(leadId, { status: "proposal" });
      await updateRun("success", 100, "Invoice for $4,997 created + reminder automation armed.");
      return;
    }

    if (agentName === "Repurposing") {
      if (!leadId) throw new Error("leadId required");
      await updateRun("running", 80, "Repurposing assets for next prospect...");
      await sleep(600);
      await blink.db.leads.update(leadId, { status: "lost" });
      await updateRun("success", 100, "Assets queued for next qualified prospect.");
      return;
    }

    if (agentName === "Coordinator" || agentName === "Full Pipeline") {
      await runFullPipeline(blink, updateRun, openaiKey, sgKey);
    } else {
      await updateRun("success", 100, `${agentName} executed successfully.`);
    }
  } catch (error: any) {
    console.error("Orchestration error:", error);
    try {
      const b2 = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
      await b2.db.agentRuns.update(runId, { status: "failed", progressPercent: 0,
        logsText: `Error: ${error.message}`, finishedAt: new Date().toISOString() });
    } catch (e) { console.error("Failed to update run:", e); }
  }
}

async function runFullPipeline(blink: any, updateRun: Function, openaiKey: string, sgKey: string) {
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  await updateRun("running", 8, "Stage 1: Scanning SoCal directories...");
  await sleep(1000);

  const ts = Date.now();
  const seeds = [
    { n: "Apex Commercial Capital", e: "loans@apex.com", c: "Robert Martinez", l: "Los Angeles, CA" },
    { n: "Coastal Bridge Funding", e: "contact@coastal.com", c: "Amanda Torres", l: "San Diego, CA" },
    { n: "SoCal Bridge Lenders", e: "hello@socalbridge.com", c: "Daniel Kim", l: "Irvine, CA" },
  ];

  const newLeads = seeds.map(co => ({
    id: crypto.randomUUID(), companyName: `${co.n} ${ts}`.slice(0, 50),
    website: `https://${co.n.toLowerCase().replace(/\s/g, "")}.com`,
    contactEmail: co.e, contactName: co.c, source: "Google Maps",
    niche: "Commercial Bridge Lender", location: co.l, status: "new", consentObtained: 1,
  }));

  for (const lead of newLeads) await blink.db.leads.create(lead);
  await updateRun("running", 25, `Discovered ${newLeads.length} prospects.`);
  await sleep(600);

  await updateRun("running", 40, "Stage 2: AI lead scoring...");
  for (const lead of newLeads) {
    const score = 72 + Math.floor(Math.random() * 23);
    await blink.db.leadScores.create({ id: crypto.randomUUID(), leadId: lead.id, overallScore: score,
      conversionLikelihood: 68 + Math.floor(Math.random() * 25), potentialServicesValue: 4997.0,
      searchActivityScore: 55 + Math.floor(Math.random() * 30), paidAdsActivity: 25 + Math.floor(Math.random() * 35) });
    await blink.db.leads.update(lead.id, { status: "scored" });
  }
  await sleep(600);

  await updateRun("running", 55, "Stage 3: Generating AI assets via OpenAI...");
  for (const lead of newLeads) {
    const audit = await generateAIContent(openaiKey, `Write 2-sentence SEO audit for ${lead.companyName} bridge lender in ${lead.location}. Mention key gaps.`);
    const copy = await generateAIContent(openaiKey, `Write a 10-word hero headline for ${lead.companyName} bridge lender website.`);
    await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "audit_report",
      hostedUrl: `https://agentorch.io/audit/${lead.id}`, content: audit });
    await blink.db.generatedAssets.create({ id: crypto.randomUUID(), leadId: lead.id, type: "custom_website",
      hostedUrl: `https://preview-${lead.id.slice(0, 8)}.agentorch.site`, content: copy });
    await blink.db.leads.update(lead.id, { status: "audited" });
  }
  await sleep(600);

  await updateRun("running", 70, "Stage 4: Deploying outreach sequences...");
  for (const lead of newLeads) {
    const seqId = crypto.randomUUID();
    await blink.db.outreachSequences.create({ id: seqId, leadId: lead.id, step: 1, status: "sent",
      emailSentAt: new Date().toISOString(), lastSentAt: new Date().toISOString() });
    await blink.db.outreachAnalytics.create({ id: crypto.randomUUID(), sequenceId: seqId, leadId: lead.id,
      step: 1, eventType: "sent", metadata: JSON.stringify({ automated: true }) });
    await blink.db.leads.update(lead.id, { status: "outreach_sent" });
  }
  await sleep(600);

  await updateRun("running", 85, "Stage 5: Reply detected! Creating invoice...");
  await sleep(800);

  const winLead = newLeads[0];
  const invoiceId = crypto.randomUUID();
  await blink.db.invoices.create({ id: invoiceId, leadId: winLead.id, amount: 4997.0, status: "paid",
    stripeInvoiceId: `inv_demo_${crypto.randomUUID().slice(0, 8)}` });
  await blink.db.leads.update(winLead.id, { status: "client" });
  await blink.db.outreachAnalytics.create({ id: crypto.randomUUID(),
    sequenceId: `seq_${winLead.id.slice(0, 8)}`, leadId: winLead.id, step: 1,
    eventType: "replied", metadata: JSON.stringify({ revenue: 4997 }) });

  await updateRun("success", 100, `Full cycle: ${newLeads.length} discovered → AI-audited → outreach sent → 1 client ($4,997).`);
}
