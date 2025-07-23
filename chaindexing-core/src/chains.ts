export enum Chain {
  Mainnet = 1,
  Goerli = 5,
  Kovan = 42,
  Sepolia = 11155111,
}

export type JsonRpcUrl = string;
export type Chains = Map<Chain, JsonRpcUrl>;
