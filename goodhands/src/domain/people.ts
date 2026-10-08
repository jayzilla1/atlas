import type { AppData, Child, Employee, Guardian } from '@/types'

export const childName = (c: Pick<Child, 'firstName' | 'lastName'>) => `${c.firstName} ${c.lastName}`
export const employeeName = (e: Pick<Employee, 'firstName' | 'lastName'>) => `${e.firstName} ${e.lastName}`
export const primaryGuardian = (c: Child): Guardian => c.guardians.find((g) => g.primary) ?? c.guardians[0]
export const getChild = (d: AppData, id: string) => d.children.find((c) => c.id === id)
export const getEmployee = (d: AppData, id: string) => d.employees.find((e) => e.id === id)
