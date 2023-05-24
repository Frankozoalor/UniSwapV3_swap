const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { parseEther } = require("ethers/lib/utils");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const DAI_WHALE = "0x16B34Ce9A6a6F7FC2DD25Ba59bf7308E7B38E186";
const USDC_WHALE = "0x8894E0a0c962CB723c1976a4421c95949bE2D4E3";
const NFT = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

describe("Test uniswap swap", function () {
  let DEXContract;
  let WETHCONTRACT;
  let DAIContract;
  let USDCContract;
  let NFTCONTRACT;
  let accounts;
  let impersonateSigner;

  before(async () => {
    const dex = await ethers.getContractFactory("SimpleSwap");
    DEXContract = await dex.deploy(
      "0xe592427a0aece92de3edee1f18e0157c05861564",
      "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );
    await DEXContract.deployed();

    accounts = await hre.ethers.getSigners();

    DAIContract = await ethers.getContractAt("IERC20", DAI);
    USDCContract = await ethers.getContractAt("IERC20", USDC);
    WETHCONTRACT = await ethers.getContractAt("IERC20", WETH);
    NFTCONTRACT = await ethers.getContractAt("IERC721", NFT);
  });

  beforeEach(async () => {
    await helpers.impersonateAccount(DAI_WHALE);
    await helpers.impersonateAccount(USDC_WHALE);
    impersonateSigner = await ethers.getSigner(DAI_WHALE);
  });

  it("should confirm the intial balance of whale ", async () => {
    const WhaleBalance = await DAIContract.balanceOf(impersonateSigner.address);
    console.log(
      "WHALE INITIAL BALANCE ",
      ethers.utils.formatEther(WhaleBalance)
    );
  });

  it("should swap DAI for WETH", async () => {
    await DAIContract.connect(impersonateSigner).approve(
      DEXContract.address,
      parseEther("2000")
    );
    const tx = await DEXContract.connect(impersonateSigner).swapDAIForWETH(
      parseEther("2000")
    );

    const balanceOfWETHforDAIWhale = await WETHCONTRACT.balanceOf(
      impersonateSigner.address
    );
    console.log(
      "DAIWHALE_WETH_BALANCE ",
      ethers.utils.formatEther(balanceOfWETHforDAIWhale)
    );
  });

  it("should confirm the right amount of WETH to recieve back", async () => {
    await DAIContract.connect(impersonateSigner).approve(
      DEXContract.address,
      parseEther("4000")
    );
    const tx = await DEXContract.connect(
      impersonateSigner
    ).swapExactOutputSingle(parseEther("1"), parseEther("4000"));
  });

  it("should confirm the transaction for Multi-hop swap", async () => {
    await DAIContract.connect(impersonateSigner).approve(
      DEXContract.address,
      parseEther("3000")
    );

    const tx = await DEXContract.connect(
      impersonateSigner
    ).swapExactInputMultihop(parseEther("2000"));
    const WHALEBalance = await WETHCONTRACT.balanceOf(
      impersonateSigner.address
    );
    console.log("WETH whale balance", ethers.utils.formatEther(WHALEBalance));
  });

  it("should transfer dai to usdc whale and add liquidity", async () => {
    const impersonateSignerUSDC = await ethers.getSigner(USDC_WHALE);
    const daiamount = 100n * 10n ** 18n;
    const usdcamount = 100n * 10n ** 6n;
    const daiamount1 = 200n * 10n ** 18n;
    const usdcamount2 = 200n * 10n ** 6n;

    const USDCIntialBalance = await USDCContract.balanceOf(accounts[1].address);
    const DAIinitialBalance = await DAIContract.balanceOf(accounts[1].address);

    console.log(
      "DAI initialBalance",
      ethers.utils.formatEther(DAIinitialBalance)
    );
    console.log("Initial Usdc Balance", parseInt(USDCIntialBalance) / 10 ** 6);

    //Transfering some DAI and USDC to account[0]
    await DAIContract.connect(impersonateSigner).transfer(
      accounts[1].address,
      daiamount1
    );
    await USDCContract.connect(impersonateSignerUSDC).transfer(
      accounts[1].address,
      usdcamount2
    );

    // //Adding Liquidity
    await DAIContract.connect(accounts[1]).transfer(
      DEXContract.address,
      daiamount
    );
    await USDCContract.connect(accounts[1]).transfer(
      DEXContract.address,
      usdcamount
    );

    expect(await DAIContract.balanceOf(DEXContract.address)).to.eq(daiamount);
    expect(await USDCContract.balanceOf(DEXContract.address)).to.eq(usdcamount);

    const tx = await DEXContract.connect(accounts[1]).mintNewPosition();

    const balanceOfDAIAfter = await DAIContract.balanceOf(accounts[1].address);
    const balanceOfUSDCAfter = await USDCContract.balanceOf(
      accounts[1].address
    );
    console.log(
      "dai balance after liquidity",
      ethers.utils.formatEther(balanceOfDAIAfter)
    );
    console.log(
      "usdc balance after liquidity",
      parseInt(balanceOfUSDCAfter) / 10 ** 6
    );
  });

  it.skip("should collect fees", async () => {
    const mintEDToken = await DEXContract.mintEDTokenId();
    console.log("mintEdToken", mintEDToken);
    await DEXContract.connect(accounts[1]).retrieveNFT(mintEDToken);
    await NFTCONTRACT.connect(accounts[1]).approve(
      DEXContract.address,
      mintEDToken
    );

    await DEXContract.connect(accounts[1]).collectAllFees(mintEDToken);
  });

  it("should increase liquidity", async () => {
    const daiamount = 50n * 10n ** 18n;
    const usdcamount = 50n * 10n ** 6n;
    const mintEDToken = await DEXContract.mintEDTokenId();
    await DAIContract.connect(accounts[1]).approve(
      DEXContract.address,
      daiamount
    );
    await USDCContract.connect(accounts[1]).approve(
      DEXContract.address,
      usdcamount
    );
    await DEXContract.connect(accounts[1]).increaseLiquidityCurrentRange(
      mintEDToken,
      daiamount,
      usdcamount
    );
  });
  it("should decrease liquidity", async () => {
    const daiamount = 50n * 10n ** 18n;
    const usdcamount = 50n * 10n ** 6n;
    const mintEDToken = await DEXContract.mintEDTokenId();
    await DAIContract.connect(accounts[1]).approve(
      DEXContract.address,
      daiamount
    );
    await USDCContract.connect(accounts[1]).approve(
      DEXContract.address,
      usdcamount
    );
    await DEXContract.connect(accounts[1]).decreaseLiquidityInHalf(mintEDToken);
  });
});
