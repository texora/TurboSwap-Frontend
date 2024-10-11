
export interface TokenPrice {
  price: number
}
export interface TokenInfo {
  [key: string]: TokenPrice
}

export const tokensPrices: TokenInfo = {
  USDC: { price: 1 },
  BTC: { price: 64572.0 },
  ETH: { price: 3430.21 },
  MOON: { price: 0.00000005735 },
  S22: { price: 0.01 }
}