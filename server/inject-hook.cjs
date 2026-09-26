const fs = require('fs');
let c = fs.readFileSync('src/lib/hooks.ts', 'utf8');
const marker = "export function useAdminApplication(id?: string) {";
const idx = c.indexOf(marker);
if (idx === -1) {
  console.error('Start marker not found');
  process.exit(1);
}
const next = c.indexOf('export type', idx);
const old = c.substring(idx, next);
const newFn = old + `
export function useAdminUsers(params?: {
  role?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['admin', 'users', params ?? {}],
    queryFn: () => apiRoutes.adminUsers(params),
  })
}
`;
const replaced = c.replace(old, newFn);
fs.writeFileSync('src/lib/hooks.ts', replaced, 'utf8');
console.log('Inserted useAdminUsers hook');
