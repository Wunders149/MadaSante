const fs = require('fs');
let content = fs.readFileSync('server/src/routes/admin.ts', 'utf8');

// Replace the minimal /users route with the full implementation
const newRoute = [
  "adminRouter.get('/users', async (req: Request, res: Response) => {",
  "  const role = typeof req.query.role === 'string' ? req.query.role : undefined;",
  "  const page = Math.max(1, Number(req.query.page ?? 1));",
  "  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));",
  "  const offset = (page - 1) * limit;",
  "  const where: string[] = [];",
  "  const params: unknown[] = [];",
  "  if (role && role !== 'all') {",
  "    where.push('role = ?');",
  "    params.push(role);",
  "  }",
  "  if (role === 'patient') {",
  "    where.push('provider_id IS NULL');",
  "  }",
  "  params.push(offset, limit);",
  "  const rows = (",
  "    await db.query(",
  "      `SELECT id, first_name, last_name, phone, email, photo, role, location, provider_id,",
  "        (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = users.id) AS appointment_count,",
  "        (SELECT COUNT(*) FROM payments p WHERE p.patient_id = users.id) AS payment_count,",
  "        (SELECT COUNT(*) FROM delivery_orders d WHERE d.patient_id = users.id) AS delivery_count",
  "       FROM users",
  "       " + (where.length ? "'WHERE ' + where.join(' AND ') : '')",
  "       ORDER BY created_at DESC`",
  "      params,",
  "    )",
  "  ).rows as unknown as Array<any>;",
  "  const totalRows = (",
  "    await db.query(",
  "      `SELECT COUNT(*) AS total FROM users " + (where.length ? "'WHERE ' + where.join(' AND ') : '')" + "`",
  "      params.slice(0, -2),",
  "    )",
  "  ).rows[0] as { total: string };",
  "  res.json({",
  "    users: rows.map((r) => ({",
  "      id: r.id,",
  "      firstName: r.first_name,",
  "      lastName: r.last_name,",
  "      phone: r.phone,",
  "      email: r.email,",
  "      photo: r.photo ?? undefined,",
  "      role: r.role,",
  "      location: r.location ?? undefined,",
  "      providerId: r.provider_id ?? null,",
  "      appointmentCount: Number(r.appointment_count ?? 0),",
  "      paymentCount: Number(r.payment_count ?? 0),",
  "      deliveryCount: Number(r.delivery_count ?? 0),",
  "    })),",
  "    page,",
  "    limit,",
  "    total: Number(totalRows.total),",
  "    totalPages: Math.ceil(Number(totalRows.total) / limit),",
  "  })",
  "})",
].join('\n');

const start = content.indexOf("adminRouter.get('/users'");
if (start === -1) {
  console.error('Start marker not found');
  process.exit(1);
}
// Find the end of the route: the '})\n' after the route's closing '})'
const marker = 'totalPages: Math.ceil(Number(totalRows.total) / limit),';
const end = content.indexOf(marker, start);
if (end === -1) {
  console.error('Marker not found');
  process.exit(1);
}
const endOfRoute = content.indexOf('\n})', end);
if (endOfRoute === -1) {
  console.error('End not found');
  process.exit(1);
}
content = content.substring(0, start) + newRoute + content.substring(endOfRoute + 3);
fs.writeFileSync('server/src/routes/admin.ts', content, 'utf8');
console.log('Fixed. New length:', content.length);
