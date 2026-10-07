import { companyFacts } from '../src/data/selectors'
import { risks } from '../src/data/risks'
import { initialTasks } from '../src/data/tasks'
import { people, currentPeople } from '../src/data/people'
import { applications, grantsForApp, grantsForPerson } from '../src/data/applications'
import { vendors } from '../src/data/vendors'
import { policies, policyAckStats } from '../src/data/policies'
console.log(companyFacts(risks, initialTasks))
console.log('people total', people.length, 'current', currentPeople.length)
console.log('jordan apps', grantsForPerson('jordan-williams').map((g) => g.appId + ':' + g.role))
console.log('devon apps', grantsForPerson('devon-park').map((g) => g.appId))
console.log('salesforce users', grantsForApp('salesforce').length, 'github', grantsForApp('github').length, 'gworkspace', grantsForApp('google-workspace').length)
console.log('apps', applications.length, 'vendors', vendors.length, 'policies', policies.length)
console.log('ack', policyAckStats('acceptable-use'))
const ids = new Set(people.map((p) => p.id)); console.log('dupe ids', people.length - ids.size)
const appIds = new Set(applications.map((a) => a.id)); const vIds = new Set(vendors.map((v) => v.id)); const polIds = new Set(policies.map((p) => p.id))
for (const r of risks) for (const rel of r.related) { const ok = rel.type === 'person' ? ids.has(rel.id) : rel.type === 'application' ? appIds.has(rel.id) : rel.type === 'vendor' ? vIds.has(rel.id) : polIds.has(rel.id); if (!ok) console.log('BROKEN', r.id, rel) }
for (const t of initialTasks) if (t.entity) { const rel = t.entity; const ok = rel.type === 'person' ? ids.has(rel.id) : rel.type === 'application' ? appIds.has(rel.id) : rel.type === 'vendor' ? vIds.has(rel.id) : polIds.has(rel.id); if (!ok) console.log('BROKEN task', t.id, rel) }
for (const p of people) if (p.managerId && !ids.has(p.managerId)) console.log('BAD MGR', p.id, p.managerId)
for (const a of applications) if (!ids.has(a.ownerId)) console.log('BAD OWNER', a.id)
for (const v of vendors) if (!ids.has(v.ownerId)) console.log('BAD V OWNER', v.id)
console.log('depts', Object.entries(currentPeople.reduce((m: any, p) => ((m[p.department] = (m[p.department] || 0) + 1), m), {})).join(' '))
