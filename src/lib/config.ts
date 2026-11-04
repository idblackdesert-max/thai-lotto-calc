import { z } from 'zod'
import astrologyJson from '../../config/astrology.json' with { type: 'json' }
import defaultsJson from '../../config/defaults.json' with { type: 'json' }
import drawExceptionsJson from '../../config/draw-exceptions.json' with { type: 'json' }

const dayList = z.array(z.number().int().min(1).max(31)).min(1)
const digit = z.number().int().min(1).max(9)

export const drawExceptionsSchema = z.object({
  defaultDays: dayList,
  monthRules: z.record(z.string().regex(/^(1[0-2]|[1-9])$/), dayList),
  yearMonthOverrides: z.record(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), dayList),
})

export const astrologySchema = z.object({
  days: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        name: z.string(),
        number: digit,
        color: z.string(),
        colorName: z.string(),
      }),
    )
    .length(7),
  wednesdayNightNumber: digit,
  planetNames: z.record(z.string(), z.string()),
  thaksaOrder: z.array(digit).length(8),
  thaksaRoles: z.array(z.string()).length(8),
  zodiac: z.object({
    names: z.array(z.string()).length(12),
    ratYear: z.number().int(),
    yearStart: z.enum(['jan1', 'songkran']),
  }),
  strengths: z.object({ primary: z.number().positive(), secondary: z.number().positive() }),
})

export const signalKeys = ['statistics', 'dayPlanet', 'numerology', 'lunar', 'zodiac', 'personal'] as const
export type SignalKey = (typeof signalKeys)[number]
export type Weights = Record<SignalKey, number>

export const defaultsSchema = z.object({
  weights: z.object({
    statistics: z.number().min(0),
    dayPlanet: z.number().min(0),
    numerology: z.number().min(0),
    lunar: z.number().min(0),
    zodiac: z.number().min(0),
    personal: z.number().min(0),
  }),
  decay: z.number().gt(0).max(1),
  kalakiniPenalty: z.number().min(0).max(1),
  drawsUsed: z.number().int().positive(),
  drawsStored: z.number().int().positive(),
  cutoffHour: z.number().int().min(0).max(23),
  staleDays: z.number().int().positive(),
})

export type DrawExceptions = z.infer<typeof drawExceptionsSchema>
export type Astrology = z.infer<typeof astrologySchema>
export type Defaults = z.infer<typeof defaultsSchema>

export const drawExceptions: DrawExceptions = drawExceptionsSchema.parse(drawExceptionsJson)
export const astrology: Astrology = astrologySchema.parse(astrologyJson)
export const defaults: Defaults = defaultsSchema.parse(defaultsJson)
