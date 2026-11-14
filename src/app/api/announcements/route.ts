import { Announcement } from '@/models';
import { audit, ok, parse, route } from '@/lib/api';
import { announcementSchema } from '@/lib/validations';

// GET /api/announcements — current notices, pinned first. Admins can pass ?all=1 for expired ones too.
export const GET = route({}, async ({ request, role, session }) => {
  const all = role === 'admin' && request.nextUrl.searchParams.get('all') === '1';
  const now = new Date();
  const and: Record<string, unknown>[] = [];
  if (!all) and.push({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
  if (role === 'resident') {
    and.push({ $or: [{ buildingName: { $in: [null, ''] } }, { buildingName: session.user.buildingName }] });
  }
  const announcements = await Announcement.find(and.length ? { $and: and } : {})
    .sort({ pinned: -1, publishedAt: -1 })
    .limit(100)
    .populate('createdBy', 'name')
    .lean();
  return ok(announcements);
});

// POST /api/announcements
export const POST = route({ roles: ['admin'] }, async (ctx) => {
  const data = parse(announcementSchema, await ctx.request.json());
  const announcement = await Announcement.create({
    ...data,
    buildingName: data.buildingName || undefined,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    createdBy: ctx.userId,
  });
  await audit(ctx, 'create', 'announcement', announcement._id, { title: announcement.title });
  return ok(announcement, 201);
});
