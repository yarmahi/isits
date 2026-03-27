/** Thrown inside import transactions so the batch rolls back; caught and shown to the user. */
export class ImportRowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportRowError";
  }
}
