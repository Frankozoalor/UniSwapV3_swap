import { expect } from "chai";
import { ethers } from "hardhat";
import { zeroAddress } from "ethereumjs-util";

import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type {
  MockLiquidityPool,
  SimpleSwapFactory,
  SimpleSwapFactory__factory,
  SimpleSwap__factory,
  MockLiquidityPool__factory,
} from "../typechain-types";

import { getRoleIdentifier } from "./utils/contractActions";

describe("Factory Test", () => {
  let approver: SignerWithAddress;
  let owner: SignerWithAddress;
  let factory: SimpleSwapFactory;
  let investors: SignerWithAddress[];
  let SS__factory: SimpleSwapFactory__factory;
  let deployedLiquidity: MockLiquidityPool;
  let MockLiquidityPool: MockLiquidityPool;

  const APPROVER_ROLE = getRoleIdentifier("APPROVER");
  const OWNER_ROLE = getRoleIdentifier("OWNER");

  before(async () => {
    //accounts
    [owner, approver, ...investors] = await ethers.getSigners();

    SS__factory = await ethers.getContractFactory("SimpleSwapFactory");

    const _simpleSwap: SimpleSwap__factory = await ethers.getContractFactory(
      "SimpleSwap"
    );

    const _MockLiquidityPool: MockLiquidityPool__factory =
      await ethers.getContractFactory("MockLiquidityPool");

    MockLiquidityPool = await _MockLiquidityPool.deploy();
  });

  beforeEach(async () => {
    factory = await SS__factory.connect(owner).deploy(approver.address);
  });

  describe("Constructor", () => {
    it("should properly assign Approver role", async () => {
      expect(await factory.getRole(APPROVER_ROLE)).to.deep.equals(
        approver.address
      );
    });
    it("Should revert if approver is 0x0", async () => {
      await expect(
        SS__factory.connect(owner).deploy(zeroAddress())
      ).to.be.rejectedWith("F: Invalid approver");
    });
  });

  describe("Deploy Vesting", () => {
    it("should deploy vesting", async () => {
      const transaction = await factory
        .connect(investors[0])
        .deploySimpleSwap();
      const receipt = await transaction.wait(1);
      const LiquidityDeployedEvt = receipt.events!.filter(
        (evt) => evt.event == "SimpleSwapDeployed"
      )[0];
      const newInstance = LiquidityDeployedEvt.args!.deployedAt;
      const deployerAddress = LiquidityDeployedEvt.args!.owner;
      const version = LiquidityDeployedEvt.args!.version;

      deployedLiquidity = await ethers.getContractAt(
        "MockLiquidityPool",
        newInstance
      );

      console.log("New instance", newInstance);
      console.log("DEPLOYER ADDRESS", deployerAddress);
      console.log("version", version);

      expect(await deployedLiquidity.VERSION()).to.deep.eq(version);
      expect(deployerAddress).to.deep.equal(investors[0].address);
    });
  });
});
