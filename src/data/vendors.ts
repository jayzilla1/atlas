import type { Severity, Vendor } from './types'
import { offsetFromToday } from '@/utils/dates'

/**
 * 31 fictional vendors (companies Harborlight pays and shares data with).
 * `nextReview` is expressed as days-from-today so the story never goes stale:
 *   - exactly 7 vendors have a review due in the next 30 days
 *   - Meridian Payroll’s review is already overdue because its SOC 2 report expired
 */
type V = {
  id: string; name: string; category: string; description: string; owner: string
  data: Vendor['dataAccess']; risk: Severity; nextIn: number; lastAgo: number
  contract: Vendor['contract']['status']; contractEndIn: number; value: number
  doc: [string, Vendor['securityDoc']['status'], number?]; dpa?: boolean; appId?: string
}

const rows: V[] = [
  { id: 'meridian-payroll', name: 'Meridian Payroll', category: 'Payroll', description: 'Runs payroll, tax filings and direct deposits for all employees.', owner: 'elena-vasquez', data: 'Employee data', risk: 'high', nextIn: -6, lastAgo: 371, contract: 'active', contractEndIn: 214, value: 96000, doc: ['SOC 2 Type II', 'expired', -23], dpa: true, appId: 'meridian-payroll' },
  { id: 'northstar-hr', name: 'Northstar HR', category: 'HR platform', description: 'Employee records, onboarding and benefits enrolment.', owner: 'aisha-rahman', data: 'Employee data', risk: 'high', nextIn: 4, lastAgo: 361, contract: 'active', contractEndIn: 58, value: 84000, doc: ['ISO 27001', 'valid', 410], dpa: false, appId: 'northstar-hr' },
  { id: 'acme-analytics', name: 'Acme Analytics', category: 'Analytics', description: 'Product usage analytics and dashboards.', owner: 'sofia-lindqvist', data: 'Customer data', risk: 'medium', nextIn: 9, lastAgo: 356, contract: 'active', contractEndIn: 141, value: 42000, doc: ['SOC 2 Type II', 'valid', 96], dpa: true, appId: 'acme-analytics' },
  { id: 'cloudline-hosting', name: 'Cloudline Hosting', category: 'Cloud infrastructure', description: 'Hosts the staging and backup environments.', owner: 'david-kim', data: 'Customer data', risk: 'medium', nextIn: 12, lastAgo: 353, contract: 'active', contractEndIn: 302, value: 188000, doc: ['SOC 2 Type II', 'expiring', 12], dpa: true },
  { id: 'brightdesk', name: 'BrightDesk', category: 'IT help desk', description: 'Internal IT requests and equipment tickets.', owner: 'priya-raman', data: 'Company data', risk: 'low', nextIn: 17, lastAgo: 348, contract: 'active', contractEndIn: 90, value: 14400, doc: ['SOC 2 Type II', 'valid', 140], dpa: true, appId: 'brightdesk' },
  { id: 'orbit-payments', name: 'Orbit Payments', category: 'Payments', description: 'Processes customer card payments and invoices.', owner: 'elena-vasquez', data: 'Customer data', risk: 'high', nextIn: 21, lastAgo: 344, contract: 'active', contractEndIn: 260, value: 132000, doc: ['PCI attestation', 'valid', 188], dpa: true },
  { id: 'quanta-backup', name: 'Quanta Backup', category: 'Backup & recovery', description: 'Encrypted nightly backups of the production database.', owner: 'marcus-lee', data: 'Customer data', risk: 'medium', nextIn: 26, lastAgo: 339, contract: 'active', contractEndIn: 190, value: 51000, doc: ['SOC 2 Type II', 'valid', 205], dpa: true },
  { id: 'lumen-learning', name: 'Lumen Learning', category: 'Training platform', description: 'Delivers the yearly security awareness course.', owner: 'aisha-rahman', data: 'Employee data', risk: 'low', nextIn: 29, lastAgo: 336, contract: 'expiring', contractEndIn: 33, value: 11800, doc: ['SOC 2 Type I', 'valid', 244], dpa: true },
  { id: 'fieldstone-legal', name: 'Fieldstone Legal', category: 'Outside counsel', description: 'Contract review and employment law advice.', owner: 'nina-petrov', data: 'Company data', risk: 'low', nextIn: 38, lastAgo: 327, contract: 'active', contractEndIn: 400, value: 60000, doc: ['None required', 'valid'], dpa: true },
  { id: 'pinewood-recruiting', name: 'Pinewood Recruiting', category: 'Recruiting agency', description: 'Sources engineering and sales candidates.', owner: 'aisha-rahman', data: 'Employee data', risk: 'low', nextIn: 44, lastAgo: 321, contract: 'active', contractEndIn: 120, value: 72000, doc: ['Security questionnaire', 'valid', 160], dpa: true },
  { id: 'signalpath-email', name: 'Signalpath Email', category: 'Email delivery', description: 'Sends product notification emails to customers.', owner: 'marcus-lee', data: 'Customer data', risk: 'medium', nextIn: 51, lastAgo: 314, contract: 'active', contractEndIn: 215, value: 28000, doc: ['SOC 2 Type II', 'valid', 130], dpa: true },
  { id: 'tidewater-travel', name: 'Tidewater Travel', category: 'Travel booking', description: 'Employee travel and expenses.', owner: 'maya-okafor', data: 'Employee data', risk: 'low', nextIn: 62, lastAgo: 303, contract: 'active', contractEndIn: 170, value: 9600, doc: ['ISO 27001', 'valid', 301], dpa: true },
  { id: 'ironbridge-security', name: 'Ironbridge Security', category: 'Security consulting', description: 'Yearly penetration test of the product.', owner: 'priya-raman', data: 'Company data', risk: 'low', nextIn: 70, lastAgo: 295, contract: 'active', contractEndIn: 240, value: 48000, doc: ['Pen test summary', 'valid', 200], dpa: true },
  { id: 'copperleaf-insurance', name: 'Copperleaf Insurance', category: 'Insurance broker', description: 'Cyber and liability insurance.', owner: 'elena-vasquez', data: 'Company data', risk: 'low', nextIn: 80, lastAgo: 285, contract: 'active', contractEndIn: 300, value: 38000, doc: ['None required', 'valid'], dpa: false },
  { id: 'vantage-print', name: 'Vantage Print', category: 'Print & mail', description: 'Prints and mails customer contracts.', owner: 'maya-okafor', data: 'Customer data', risk: 'medium', nextIn: 88, lastAgo: 277, contract: 'active', contractEndIn: 130, value: 7200, doc: ['Security questionnaire', 'expiring', 41], dpa: true },
  { id: 'cascade-surveys', name: 'Cascade Surveys', category: 'Research', description: 'Customer satisfaction surveys.', owner: 'camila-reyes', data: 'Customer data', risk: 'low', nextIn: 96, lastAgo: 269, contract: 'active', contractEndIn: 222, value: 15000, doc: ['SOC 2 Type II', 'valid', 330], dpa: true },
  { id: 'sparrow-translation', name: 'Sparrow Translation', category: 'Translation', description: 'Translates help-centre articles.', owner: 'owen-brooks', data: 'Company data', risk: 'low', nextIn: 104, lastAgo: 261, contract: 'active', contractEndIn: 180, value: 13200, doc: ['Security questionnaire', 'valid', 220], dpa: true },
  { id: 'kestrel-devices', name: 'Kestrel Devices', category: 'Laptop leasing', description: 'Leases and ships employee laptops.', owner: 'priya-raman', data: 'Company data', risk: 'medium', nextIn: 112, lastAgo: 253, contract: 'active', contractEndIn: 450, value: 210000, doc: ['ISO 27001', 'valid', 520], dpa: false },
  { id: 'willowbrook-facilities', name: 'Willowbrook Facilities', category: 'Office services', description: 'Cleaning and building access.', owner: 'maya-okafor', data: 'None', risk: 'low', nextIn: 120, lastAgo: 245, contract: 'active', contractEndIn: 140, value: 54000, doc: ['None required', 'valid'], dpa: false },
  { id: 'beacon-marketing', name: 'Beacon Marketing', category: 'Agency', description: 'Campaign design and paid media.', owner: 'ben-whitaker', data: 'Company data', risk: 'low', nextIn: 133, lastAgo: 232, contract: 'in_negotiation', contractEndIn: 20, value: 120000, doc: ['Security questionnaire', 'valid', 90], dpa: true },
  { id: 'granite-accounting', name: 'Granite Accounting', category: 'Accounting firm', description: 'Year-end audit and tax filings.', owner: 'elena-vasquez', data: 'Company data', risk: 'medium', nextIn: 146, lastAgo: 219, contract: 'active', contractEndIn: 210, value: 78000, doc: ['SOC 2 Type II', 'valid', 255], dpa: true },
  { id: 'harbor-benefits', name: 'Harbor Benefits Group', category: 'Benefits provider', description: 'Health and retirement benefits administration.', owner: 'aisha-rahman', data: 'Employee data', risk: 'medium', nextIn: 158, lastAgo: 207, contract: 'active', contractEndIn: 330, value: 22000, doc: ['SOC 2 Type II', 'valid', 275], dpa: true },
  { id: 'nimbus-sms', name: 'Nimbus SMS', category: 'Messaging', description: 'Sends one-time login codes by text message.', owner: 'marcus-lee', data: 'Customer data', risk: 'medium', nextIn: 171, lastAgo: 194, contract: 'active', contractEndIn: 200, value: 18000, doc: ['ISO 27001', 'valid', 380], dpa: true },
  { id: 'pixelforge-stock', name: 'Pixelforge Stock', category: 'Creative assets', description: 'Stock photos and video.', owner: 'hannah-muller', data: 'None', risk: 'low', nextIn: 185, lastAgo: 180, contract: 'active', contractEndIn: 120, value: 4800, doc: ['None required', 'valid'], dpa: false },
  { id: 'redwood-cowork', name: 'Redwood Coworking', category: 'Office space', description: 'Satellite office in Denver.', owner: 'maya-okafor', data: 'None', risk: 'low', nextIn: 199, lastAgo: 166, contract: 'active', contractEndIn: 380, value: 66000, doc: ['None required', 'valid'], dpa: false },
  { id: 'summit-legal-research', name: 'Summit Legal Research', category: 'Research', description: 'Regulatory research subscriptions.', owner: 'nina-petrov', data: 'None', risk: 'low', nextIn: 214, lastAgo: 151, contract: 'active', contractEndIn: 270, value: 9800, doc: ['None required', 'valid'], dpa: false },
  { id: 'evergreen-eap', name: 'Evergreen EAP', category: 'Wellbeing', description: 'Confidential employee assistance programme.', owner: 'aisha-rahman', data: 'Employee data', risk: 'medium', nextIn: 230, lastAgo: 135, contract: 'active', contractEndIn: 365, value: 16000, doc: ['ISO 27001', 'valid', 600], dpa: true },
  { id: 'atlas-ridge-courier', name: 'Ridgeway Courier', category: 'Courier', description: 'Same-day courier for signed paperwork.', owner: 'maya-okafor', data: 'None', risk: 'low', nextIn: 260, lastAgo: 105, contract: 'active', contractEndIn: 160, value: 3600, doc: ['None required', 'valid'], dpa: false },
  { id: 'lighthouse-docs', name: 'Lighthouse Docs', category: 'Document storage', description: 'Offsite archive for physical records.', owner: 'nina-petrov', data: 'Company data', risk: 'low', nextIn: 300, lastAgo: 65, contract: 'active', contractEndIn: 520, value: 8400, doc: ['ISO 27001', 'valid', 700], dpa: false },
  { id: 'crestview-compliance', name: 'Crestview Compliance', category: 'Audit preparation', description: 'Helps prepare evidence for the yearly SOC 2 audit.', owner: 'maya-okafor', data: 'Company data', risk: 'low', nextIn: 320, lastAgo: 45, contract: 'active', contractEndIn: 280, value: 36000, doc: ['Security questionnaire', 'valid', 250], dpa: true },
  { id: 'maple-catering', name: 'Maple & Co. Catering', category: 'Office services', description: 'Team lunches and event catering.', owner: 'maya-okafor', data: 'None', risk: 'low', nextIn: 340, lastAgo: 25, contract: 'active', contractEndIn: 100, value: 21000, doc: ['None required', 'valid'], dpa: false },
]

const reviewStatus = (n: number): Vendor['reviewStatus'] => (n < 0 ? 'overdue' : n <= 30 ? 'due_soon' : 'current')

export const vendors: Vendor[] = rows.map((r) => ({
  id: r.id, name: r.name, category: r.category, description: r.description, ownerId: r.owner,
  dataAccess: r.data, baselineRisk: r.risk,
  reviewStatus: reviewStatus(r.nextIn),
  lastReview: offsetFromToday(-r.lastAgo), nextReview: offsetFromToday(r.nextIn),
  contract: { status: r.contract, start: offsetFromToday(r.contractEndIn - 365), end: offsetFromToday(r.contractEndIn), annualValue: r.value },
  securityDoc: { type: r.doc[0], status: r.doc[1], expiresOn: r.doc[2] !== undefined ? offsetFromToday(r.doc[2]) : undefined },
  dpa: r.dpa ?? false, appId: r.appId,
}))
export const vendorsById = new Map(vendors.map((v) => [v.id, v]))
export const getVendor = (id?: string) => (id ? vendorsById.get(id) : undefined)
