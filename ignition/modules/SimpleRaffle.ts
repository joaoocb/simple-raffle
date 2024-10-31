import {buildModule} from "@nomicfoundation/hardhat-ignition/modules";

const SimpleRaffleModule = buildModule("SimpleRaffleModule", (m) => {
  const simpleRaffle = m.contract("SimpleRaffle", []);

  return {simpleRaffle};
});

export default SimpleRaffleModule;
