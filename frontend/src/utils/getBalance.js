import {ConstantineInfo} from '../chain.info.torii';
import {CosmWasmClient} from "@cosmjs/cosmwasm-stargate"

const RPC = ConstantineInfo.rpc;
const coin = "utorii"

export async function getBalance(address) {
    const cosm_wasm_client = await CosmWasmClient.connect(RPC);
    return await cosm_wasm_client.getBalance(address, coin);
}



