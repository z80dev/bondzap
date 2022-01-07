// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { IERC20 } from "../typechain/IERC20";

const TOKEN_ADDRS = {
  DAI: "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E",
  MIM: "0x82f0B8B456c1A451378467398982d4834b6829c1",
  FHM: "0xfa1FBb8Ef55A4855E5688C0eE13aC3f202486286",
  sFHM: "0x5E983ff70DE345de15DbDCf0529640F14446cDfa",
  wFTM: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83"
};

const DEPOSITOR_ADDRS = {
  DAI: "0x462eEC9f8A067f13B5F8F7356D807FF7f0e28c68",
  MIM: "0x3C1a9b5Ff3196C43BcB05Bf1B7467fbA8e07EE61",
};

const ROUTER_ADDRS = {
  spooky: "0xF491e7B69E4244ad4002BC14e878a34207E38c29"
};

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [signer] = await ethers.getSigners();
  console.log(signer.address);
  const BondZap = await ethers.getContractFactory("BondZap");
  // const zap = await BondZap.deploy();
  const zap = await BondZap.attach("0x795aecE027465a3922ee899b7ddE51223C5172dB")

  await zap.deployed();

  const dai: IERC20 = await ethers.getContractAt('IERC20', TOKEN_ADDRS.DAI, signer);
  const mim: IERC20 = await ethers.getContractAt('IERC20', TOKEN_ADDRS.MIM, signer);
  const wFTM: IERC20 = await ethers.getContractAt("IERC20", TOKEN_ADDRS.wFTM, signer);

  const daiDepositor = await ethers.getContractAt("IBondDepository", DEPOSITOR_ADDRS.DAI);
  const mimDepositor = await ethers.getContractAt("IBondDepository", DEPOSITOR_ADDRS.MIM);

  const spookyRouter = await ethers.getContractAt("IUniswapRouterETH", ROUTER_ADDRS.spooky);

  const _route = [wFTM.address, mim.address];

  const _amount = ethers.utils.parseEther("2.0");
  const _minOut = (await spookyRouter.getAmountsOut(ethers.utils.parseEther("1"), _route)).at(-1);
  const _maxPrice = await mimDepositor.bondPrice();
  // failure cases to test slippage protection
  // const _minOut = (await spookyRouter.getAmountsOut(ethers.utils.parseEther("1"), _route)).pop().add(ethers.utils.parseEther("100"));
  // const _maxPrice = (await mimDepositor.bondPrice()).sub(BigNumber.from(825)); // for when you want to fail
  const _bondDepository = mimDepositor.address;
  const _router = spookyRouter.address;
  const _recipient = signer.address;

  const args = { _amount, _minOut, _maxPrice, _route, _bondDepository, _router, _recipient }
  console.log(args)

  // const approval = await wFTM.approve(zap.address, ethers.utils.parseEther("1000000"))
  console.log('APPROVED: ', (await wFTM.allowance(signer.address, zap.address)))
  // console.log(approval)
  const zapTx = await zap.zapInToken(_amount, _minOut!, _maxPrice, _route, _bondDepository, _router, _recipient)
  console.log(zapTx)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
