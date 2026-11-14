import { Announcement } from '@/models';
import { HttpError, audit, ok, parse, route } from '@/lib/api';
import { announcementSchema } from '@/lib/validations';

// PUT /api/announcements/[id]
export const PUT = route({ roles: ['admin'] }, async (ctx) => {
  const data = parse(announcementSchema, await ctx.request.json());
  const announcement = await Announcement.findByIdAndUpdate(
    ctx.params.id,
    {
      ...data,
      buildingName: data.buildingName || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
    { returnDocument: 'after' }
  );
  if (!announcement) throw new HttpError('Announcement not found', 404);
  await audit(ctx, 'update', 'announcement', announcement._id, { title: announcement.title });
  return ok(announcement);
});

// DELETE /api/announcements/[id]
export const DELETE = route({ roles: ['admin'] }, async (ctx) => {
  const announcement = await Announcement.findByIdAndDelete(ctx.params.id);
  if (!announcement) throw new HttpError('Announcement not found', 404);
  await audit(ctx, 'delete', 'announcement', announcement._id, { title: announcement.title });
  return ok({ removed: true });
});
