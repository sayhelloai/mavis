import { PrismaClient, Plan, UserRole, SignalSource, SignalStage, ProspectStatus, SequenceStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create test tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'acme.com' },
    update: {},
    create: {
      name: 'Acme Corp',
      domain: 'acme.com',
      plan: Plan.GROWTH,
      prospectBudget: 500,
      prospectUsed: 120,
      isTrial: false,
    }
  })

  // Create admin user
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@acme.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@acme.com',
      name: 'Admin User',
      role: UserRole.COMPANY_ADMIN,
    }
  })

  // Create 3 ICPs
  const icp1 = await prisma.iCP.upsert({
    where: { id: 'seed-icp-1' },
    update: {},
    create: {
      id: 'seed-icp-1',
      tenantId: tenant.id,
      name: 'Mid-Market SaaS CISO',
      industries: ['Software', 'SaaS', 'Technology'],
      revenueMin: 10,
      revenueMax: 500,
      geographies: ['US', 'CA', 'UK'],
      personaTitles: ['CISO', 'Chief Information Security Officer', 'VP Security'],
      keywords: ['security posture', 'compliance', 'SOC 2', 'zero trust', 'endpoint protection', 'SIEM', 'threat detection'],
      scoreThreshold: 65,
      qualityScore: 85,
      isActive: true,
    }
  })

  const icp2 = await prisma.iCP.upsert({
    where: { id: 'seed-icp-2' },
    update: {},
    create: {
      id: 'seed-icp-2',
      tenantId: tenant.id,
      name: 'Enterprise CFO Automation',
      industries: ['Financial Services', 'Insurance', 'Banking'],
      revenueMin: 100,
      revenueMax: 5000,
      geographies: ['US', 'UK', 'EU'],
      personaTitles: ['CFO', 'Chief Financial Officer', 'VP Finance', 'Head of Finance'],
      keywords: ['financial automation', 'AP automation', 'close process', 'ERP integration', 'spend management'],
      scoreThreshold: 70,
      qualityScore: 90,
      isActive: true,
    }
  })

  const icp3 = await prisma.iCP.upsert({
    where: { id: 'seed-icp-3' },
    update: {},
    create: {
      id: 'seed-icp-3',
      tenantId: tenant.id,
      name: 'SMB HR Tech Buyers',
      industries: ['Any'],
      revenueMin: 1,
      revenueMax: 50,
      geographies: ['US'],
      personaTitles: ['HR Director', 'Head of People', 'CHRO'],
      keywords: ['hr software', 'people ops'],
      scoreThreshold: 60,
      qualityScore: 42,
      isActive: false, // below quality threshold
    }
  })

  // Create 10 signals
  const signalData = [
    { source: SignalSource.REDDIT, stage: SignalStage.QUALIFIED, companyName: 'TechFlow Inc', companyDomain: 'techflow.io', icpId: icp1.id, icpScore: 78, content: 'Just had a major breach at our company. We need to overhaul our entire security stack ASAP.' },
    { source: SignalSource.LINKEDIN, stage: SignalStage.ENRICHED, companyName: 'FinCore Systems', companyDomain: 'fincore.com', icpId: icp2.id, icpScore: 82, content: 'Excited to announce we are expanding our finance team and modernizing our ERP systems.' },
    { source: SignalSource.NEWS, stage: SignalStage.SEQUENCED, companyName: 'DataVault Corp', companyDomain: 'datavault.com', icpId: icp1.id, icpScore: 91, content: 'DataVault Corp receives $50M Series B to accelerate enterprise security compliance platform.' },
    { source: SignalSource.JOB_POSTING, stage: SignalStage.RAW, companyName: 'CloudBase Ltd', companyDomain: 'cloudbase.io', icpId: null, icpScore: null, content: 'Hiring: VP of Information Security - CISSP required, experience with zero trust architecture.' },
    { source: SignalSource.G2, stage: SignalStage.SCORED, companyName: 'Meridian Financial', companyDomain: 'meridianfin.com', icpId: icp2.id, icpScore: 55, content: 'Looking for AP automation alternatives. Current solution is too manual.' },
    { source: SignalSource.SEC_EDGAR, stage: SignalStage.QUALIFIED, companyName: 'Atlas Insurance', companyDomain: 'atlasins.com', icpId: icp2.id, icpScore: 88, content: '10-K filing: Company intends to modernize financial reporting infrastructure in FY2025.' },
    { source: SignalSource.GITHUB, stage: SignalStage.FAILED, companyName: 'DevOps Startup', companyDomain: 'devopsco.io', icpId: icp1.id, icpScore: 72, content: 'Opened issue: Looking for SIEM integrations for our security monitoring pipeline.' },
    { source: SignalSource.TWITTER_X, stage: SignalStage.RAW, companyName: 'RetailMax', companyDomain: 'retailmax.com', icpId: null, icpScore: null, content: 'Our compliance audit just flagged 47 issues. This is going to be a long quarter.' },
    { source: SignalSource.REDDIT, stage: SignalStage.QUALIFIED, companyName: 'PharmaNet', companyDomain: 'pharmanet.com', icpId: icp1.id, icpScore: 76, content: 'r/netsec: Anyone using modern SOAR platforms? We are evaluating options for threat response automation.' },
    { source: SignalSource.LINKEDIN, stage: SignalStage.SCORED, companyName: 'BuildCo Industries', companyDomain: 'buildco.com', icpId: icp2.id, icpScore: 61, content: 'Just promoted to CFO. First priority is getting a handle on our outdated financial processes.' },
  ]

  const signals = []
  for (let i = 0; i < signalData.length; i++) {
    const s = signalData[i]
    const signal = await prisma.signal.upsert({
      where: { id: `seed-signal-${i + 1}` },
      update: {},
      create: {
        id: `seed-signal-${i + 1}`,
        tenantId: tenant.id,
        icpId: s.icpId,
        source: s.source,
        content: s.content,
        companyName: s.companyName,
        companyDomain: s.companyDomain,
        icpScore: s.icpScore,
        stage: s.stage,
      }
    })
    signals.push(signal)
  }

  // Create 5 prospects in various states
  const prospectData = [
    { signalIdx: 1, firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@fincore.com', title: 'CFO', companyName: 'FinCore Systems', companyDomain: 'fincore.com', status: ProspectStatus.ACTIVE, icpId: icp2.id },
    { signalIdx: 2, firstName: 'Marcus', lastName: 'Webb', email: 'mwebb@datavault.com', title: 'CISO', companyName: 'DataVault Corp', companyDomain: 'datavault.com', status: ProspectStatus.LEAD, icpId: icp1.id },
    { signalIdx: 5, firstName: 'Jennifer', lastName: 'Park', email: null, title: 'CFO', companyName: 'Atlas Insurance', companyDomain: 'atlasins.com', status: ProspectStatus.QUEUED, icpId: icp2.id },
    { signalIdx: 8, firstName: 'David', lastName: 'Torres', email: 'david.torres@pharmanet.com', title: 'Head of Security', companyName: 'PharmaNet', companyDomain: 'pharmanet.com', status: ProspectStatus.DORMANT, icpId: icp1.id },
    { signalIdx: 9, firstName: 'Lisa', lastName: 'Morrison', email: 'l.morrison@buildco.com', title: 'CFO', companyName: 'BuildCo Industries', companyDomain: 'buildco.com', status: ProspectStatus.NO_RESPONSE, icpId: icp2.id },
  ]

  for (let i = 0; i < prospectData.length; i++) {
    const p = prospectData[i]
    const prospect = await prisma.prospect.upsert({
      where: { id: `seed-prospect-${i + 1}` },
      update: {},
      create: {
        id: `seed-prospect-${i + 1}`,
        tenantId: tenant.id,
        signalId: signals[p.signalIdx].id,
        icpId: p.icpId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        emailVerified: p.email !== null,
        title: p.title,
        companyName: p.companyName,
        companyDomain: p.companyDomain,
        companyIndustry: p.icpId === icp1.id ? 'Technology' : 'Financial Services',
        status: p.status,
        dormantReason: p.status === ProspectStatus.DORMANT ? 'Mentioned Q1 2026 would be better timing' : null,
        reactivateAt: p.status === ProspectStatus.DORMANT ? new Date('2026-04-01') : null,
      }
    })

    // Create sequences for active/lead prospects
    if (p.status === ProspectStatus.ACTIVE || p.status === ProspectStatus.LEAD) {
      await prisma.emailSequence.upsert({
        where: { id: `seed-seq-${i + 1}` },
        update: {},
        create: {
          id: `seed-seq-${i + 1}`,
          tenantId: tenant.id,
          prospectId: prospect.id,
          status: p.status === ProspectStatus.ACTIVE ? SequenceStatus.PENDING_REVIEW : SequenceStatus.ACTIVE,
          currentTouch: p.status === ProspectStatus.LEAD ? 2 : 0,
          touches: {
            create: [
              {
                touchNumber: 1,
                subject: `Quick question about your ${p.icpId === icp1.id ? 'security' : 'finance'} roadmap`,
                body: `Hi ${p.firstName},\n\nI noticed ${p.companyName} ${p.icpId === icp1.id ? 'recently flagged some compliance concerns' : 'is modernizing your financial infrastructure'}. We work with similar companies to [specific outcome].\n\nWould a 15-minute call make sense this week?\n\nBest,\n{rep_name}`,
                variant: 'A',
              },
              {
                touchNumber: 2,
                subject: `Following up — ${p.companyName}`,
                body: `Hi ${p.firstName},\n\nJust wanted to surface my last note. [Different angle on value prop].\n\nHappy to send over a quick case study if helpful.\n\n{rep_name}`,
                variant: 'A',
              },
              {
                touchNumber: 3,
                subject: `Is the timing off?`,
                body: `Hi ${p.firstName},\n\nI don't want to keep reaching out if the timing isn't right. If you'd prefer I check back in a few months, just say the word.\n\nOtherwise, here's my calendar: [link]\n\n{rep_name}`,
                variant: 'A',
              },
            ]
          }
        }
      })
    }
  }

  console.log('Seed complete!')
  console.log(`Tenant: ${tenant.name} (${tenant.id})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
