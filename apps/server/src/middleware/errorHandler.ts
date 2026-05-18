import type { NextFunction, Request, Response } from 'express'

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction): void {
  void next
  if (error instanceof Error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(500).json({ error: 'Internal server error' })
}
