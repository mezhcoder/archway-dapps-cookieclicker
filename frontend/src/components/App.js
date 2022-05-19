import React, { Component } from 'react';
import logo from '../logo.svg';
import '../App.css';

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { calculateFee, GasPrice } from "@cosmjs/stargate";
import { ConstantineInfo } from '../chain.info.torii';
import Emoji from "./Emoji";
import {getBalance} from "../utils/getBalance";
import 'dotenv/config'

const RPC = ConstantineInfo.rpc;
const ContractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const ColorSym = ({ sym, color }) => (
    <span style={{ color: `${color}` }}>{sym}</span>
);

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contract: ContractAddress,
      counter: null,
      cwClient: null,
      offlineSigner: null,
      chainMeta: ConstantineInfo,
      gasPrice: null,
      queryHandler: null,
      loadingStatus: false,
      loadingMsg: "",
      logs: [],
      rpc: RPC,
      accounts: null,
      userAddress: null,
      balance: null,
    };
  };

   connectWallet = async () => {
    console.log('Connecting wallet...');
      try {
        if (window) {
          if (window['keplr']) {
            if (window.keplr['experimentalSuggestChain']) {
              await window.keplr.experimentalSuggestChain(this.state.chainMeta)
              await window.keplr.enable(this.state.chainMeta.chainId);

              const offlineSigner = await window.getOfflineSigner(this.state.chainMeta.chainId);
              const cwClient = await SigningCosmWasmClient.connectWithSigner(this.state.rpc, offlineSigner);
              const accounts = await offlineSigner.getAccounts();
              const queryHandler = cwClient.queryClient.wasm.queryContractSmart;
              const gasPrice = GasPrice.fromString('0.002uconst');
              const userAddress = accounts[0].address;
              const balance = await getBalance(userAddress);

              this.setState({
                accounts: accounts,
                userAddress: userAddress,
                cwClient: cwClient,
                queryHandler: queryHandler,
                gasPrice: gasPrice,
                offlineSigner: offlineSigner,
                balance: `${balance.amount} ${balance.denom}`
              });
              // Debug
              console.log('dApp Connected', {
                accounts: this.state.accounts,
                userAddress: this.state.userAddress,
                client: this.state.cwClient,
                queryHandler: this.state.queryHandler,
                gasPrice: this.state.gasPrice,
                offlineSigner: this.state.offlineSigner
              });

              // Get count
              let counter = await this.getCount();
              try {
                if (!isNaN(counter.count)) {
                  this.setState({ counter: counter.count });
                } else {
                  console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
                }
              } catch (e) {
                console.warn('Error: failed getting counter value', e);
              }
            } else {
              console.warn('Error access experimental features, please update Keplr');
            }
          } else {
            console.warn('Error accessing Keplr');
          }
        } else {
          console.warn('Error parsing window object');
        }
      } catch (e) {
        console.error('Error connecting to wallet', e);
      }
  }

  getCount = async () => {
    // SigningCosmWasmClient.query: async (address, query)
    let loading;
    loading = {
      status: true,
      msg: "Refreshing counter..."
    };
    this.setState({
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
    let entrypoint = {
      get_count: {}
    };
    let query = await this.state.queryHandler(this.state.contract, entrypoint);
    loading = {
      status: false,
      msg: ""
    };
    this.setState({
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
    console.log('Counter Queried', query);
    return query;
  }

  incrementCounter = async () => {
    // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
    if (!this.state.accounts) {
      console.warn('Error getting accounts', this.state.accounts);
      return;
    } else if (!this.state.userAddress) {
      console.warn('Error getting user address', this.state.userAddress);
      return;
    }
    let loading;
    loading = {
      status: true,
      msg: "Incrementing counter..."
    };
    this.setState({ 
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
    // Prepare Tx
    let entrypoint = {
      increment: {}
    };
    let txFee = calculateFee(300000, this.state.gasPrice); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
    console.log('Tx args', {
      senderAddress: this.state.userAddress, 
      contractAddress: this.state.contract, 
      msg: entrypoint, 
      fee: txFee
    });
    // Send Tx
    try {
      let tx = await this.state.cwClient.execute(this.state.userAddress, this.state.contract, entrypoint, txFee);
      console.log('Increment Tx', tx);
      // Update Logs
      if (tx.logs) {
        if (tx.logs.length) {
          tx.logs[0].type = 'increment';
          tx.logs[0].timestamp = new Date().getTime();
          this.setState({
            logs: [JSON.stringify(tx.logs, null, 2), ...this.state.logs]
          });
        }
      }
      // Refresh counter
      let counter = await this.getCount();
      let count;
      if (!isNaN(counter.count)) {
        count = counter.count;
      } else {
        count = this.state.counter;
        console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
      }
      // Render updates
      loading = {
        status: false,
        msg: ""
      };
      this.setState({
        counter: count,
        loadingStatus: loading.status,
        loadingMsg: loading.msg
      });
    } catch (e) {
      console.warn('Error exceuting Increment', e);
      loading = {
        status: false,
        msg: ""
      };
      this.setState({
        loadingStatus: loading.status,
        loadingMsg: loading.msg
      });
    }
  }
  resetCounter = async () => {
    if (!this.state.accounts) {
      console.warn('Error getting user account', this.state.accounts);
      return;
    } else if (!this.state.userAddress) {
      console.warn('Error getting user address', this.state.userAddress);
      return;
    }
    let loading;
    loading = {
      status: true,
      msg: "Resetting counter..."
    };
    this.setState({
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
    // Prepare Tx
    let entrypoint = {
      reset: {
        count: 0
      }
    };
    let txFee = calculateFee(300000, this.state.gasPrice); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
    // Send Tx
    try {
      let tx = await this.state.cwClient.execute(this.state.userAddress, this.state.contract, entrypoint, txFee);
      console.log('Reset Tx', tx);
      // Update Logs
      if (tx.logs) {
        if (tx.logs.length) {
          tx.logs[0].type = 'reset';
          tx.logs[0].timestamp = new Date().getTime();
          this.setState({
            logs: [JSON.stringify(tx.logs, null, 2), ...this.state.logs]
          });
        }
      }

      let counter = await this.getCount();
      let count;
      if (!isNaN(counter.count)) {
        count = counter.count;
      } else {
        count = this.state.counter;
        console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
      }
      // Render updates
      loading = {
        status: false,
        msg: ""
      };
      this.setState({
        counter: count,
        loadingStatus: loading.status,
        loadingMsg: loading.msg
      });
    } catch (e) {
      console.warn('Error executing Reset', e);
      loading = {
        status: false,
        msg: ""
      };
      this.setState({
        loadingStatus: loading.status,
        loadingMsg: loading.msg
      });
    }
  }

  render() {
    const counter = this.state.counter;
    const loadingMsg = this.state.loadingMsg;
    const userAddress = this.state.userAddress;
    const balance = this.state.balance;

    let logMeta = [];
    for (let i = 0; i < this.state.logs.length; i++) {
      let logItem = JSON.parse(this.state.logs[i]);
      let meta = {
        type: logItem[0].type,
        timestamp: logItem[0].timestamp
      };
      logMeta.push(meta);
    }
    const logItems = (this.state.logs.length) ? this.state.logs.map((log,i) =>
      <div key={logMeta[i].timestamp}>
        <p className="label">
          <strong><span>Counter {(logMeta[i].type === 'increment') ? 'Incremented' : 'Reset' }&nbsp;</span>({logMeta[i].timestamp}):</strong>
        </p>
        <pre className="log-entry" key={i}>{log}</pre>
      </div>
    ) : null;

    if (!userAddress) {
      return (
        <div className="content">
          <img src={logo} alt="logo" />
          <div className="button-controls">

            <button className="btn connectButton" onClick={this.connectWallet}>
              <span>Connect Wallet </span>
              <Emoji symbol="🟢️" label="Connect Wallet" />{" "}
            </button>
          </div>
          <div className="footer">
              <span>Developer <a href="https://github.com/mezhcoder" rel="noreferrer" target="_blank">mezhcoder/icodragon#4560</a></span>
          </div>
        </div>
      );
    }

    return (
      <div className="content">
        <img src={logo} alt="logo" />
        <h1 className="title">
          <ColorSym color="#97C774" sym="C"/>
          <ColorSym color="#B63E98" sym="o"/>
          <ColorSym color="#B63E98" sym="o"/>
          <ColorSym color="#1BABA5" sym="k"/>
          <ColorSym color="#DB3E41" sym="i"/>
          <ColorSym color="#1BABA5" sym="e"/>
          <ColorSym color="#fff" sym="Clicker"/>
        </h1>

        <div>Your address: {userAddress} </div>
        <div>Balance: {balance} </div>

        <div className="status-display">
          <ul className="status">
            <li className="counter"><strong>Counter (cookie):</strong>&nbsp;{counter}</li>
          </ul>
        </div>

        <button className="btn" onClick={this.incrementCounter}>
          <span>Increment </span>
          <Emoji symbol="🍪" label="Increment" />{" "}
        </button>

        <button className="btn" onClick={this.resetCounter}>
          <span>Reset </span>
          <Emoji symbol="♻️" label="Reset Counter" />{" "}
        </button>

        {Loading(loadingMsg)}

        <div className="logs">
          <div>{logItems}</div>
        </div>
        <div className="footer">
            <span>Developer <a href="https://github.com/mezhcoder">mezhcoder/icodragon#4560</a></span>
        </div>
      </div>
    );
  };

}

function Loading(msg) {
  if (!msg) {
    return;
  }
  return (
    <div className="loading">
      <p>{msg}</p>
    </div>
  );
}