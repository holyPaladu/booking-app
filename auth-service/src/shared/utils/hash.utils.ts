export const createHash = (memoryCost: number, timeCost: number) => {
  return {
    hash: (password: string) => {
      return Bun.password.hash(password,
        { algorithm: "argon2id", memoryCost, timeCost }
      )
    },
    verify: (password: string, hash: string) => {
      return Bun.password.verify(password, hash)
    }
  }
}