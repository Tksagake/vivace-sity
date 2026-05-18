import { z } from 'zod'

const allowedHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])

function isAllowedYouTubeHost(value: string): boolean {
  const hostname = new URL(value).hostname.toLowerCase().replace(/\.$/, '')
  return allowedHosts.has(hostname)
}

export const infoRequestSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .refine((value) => isAllowedYouTubeHost(value), 'Only YouTube URLs are supported'),
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
