import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { SimpleSwapFactory, SimpleSwap } from "../../typechain-types";
import { utils } from "../../typechain-types/contracts";

export const getRoleIdentifier = (role: String): string => {
  return ethers.utils.solidityKeccak256(
    ["bytes"],
    [ethers.utils.solidityPack(["string"], [role])]
  );
};
