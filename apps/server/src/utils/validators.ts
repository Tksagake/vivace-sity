import { z } from 'zod'

const youtubeHostRegex = /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i

export const infoRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .refine((value) => {
      const host = new URL(value).hostname
      return youtubeHostRegex.test(host)
    }, 'Only YouTube URLs are supported'),
})

export const downloadRequestSchema = infoRequestSchema.extend({
  format: z.enum(['mp4', 'mp3']).default('mp4'),
  resolution: z.enum(['best', '2160', '1440', '1080', '720', '480', '360']).default('best'),
  subtitles: z.boolean().default(false),
  subtitleLanguage: z
    .string()
    .trim()
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/)
    .default('en'),
  playlist: z.boolean().default(false),
  audioQuality: z.enum(['0', '2', '5', '9']).default('2'),
})

export const idParamSchema = z.object({
  id: z.string().uuid(),
})
