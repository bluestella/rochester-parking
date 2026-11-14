import { AuditLog } from '@/models';
import { ok, pageParams, paginated, route } from '@/lib/api';

// GET /api/admin/logs — who did what, newest first
export const GET = route({ roles: ['admin'] }, async ({ request }) => {
  const { page, limit, skip } = pageParams(request, 30);
  const resource = request.nextUrl.searchParams.get('resource');
  const query = resource ? { resource } : {};
  const [logs, total, resources] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).populate('userId', 'name role').lean(),
    AuditLog.countDocuments(query),
    AuditLog.distinct('resource'),
  ]);
  return ok({ logs, resources: resources.sort(), pagination: paginated(page, limit, total) });
});
