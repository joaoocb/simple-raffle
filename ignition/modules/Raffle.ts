import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";

const RaffleModule = buildModule("RaffleModule", (m) => {
  const raffle = m.contract("Raffle", [], {});

  return {raffle};
});

export default RaffleModule;
