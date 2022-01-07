import { expect } from "chai";
import { ethers } from "hardhat";
import { IERC20 } from "../typechain";

describe("BondZap", function () {
  it("Should set allowance", async function () {
    const greeter = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
