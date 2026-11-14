export class ApiError extends Error {
  step?:string
  constructor(message: string, step?:string) {
    super(message)
    this.step = step
  }
}