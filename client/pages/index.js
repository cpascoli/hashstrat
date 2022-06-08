
import React from 'react'
import { Alert } from 'react-bootstrap'
import { isSupportedNetwork, networkInfo } from '../web3/utils'
import { getBalance as getBalancePoolLP } from "../web3/pool_lp"
import { getBalance as getBalanceUSDC } from "../web3/usdc"
import { getPortfolioInfo, getPoolInfo } from "../web3/pool"

import Header from "../components/Header" 
import { Page, Center } from "../components/Layout"
import { AlertDismissible } from "../components/AlertDismissible"
import DepositWithdrawView from "../components/DepositWithdrawView"
import PoolInfoView from "../components/PoolInfoView"
import PortfolioInfoView from "../components/PortfolioInfoView"


// add bootstrap css 
import 'bootstrap/dist/css/bootstrap.css'


export default class IndexPage extends React.Component {

  constructor(props) {
      super(props)
      this.state = {

      }
      this.headerRef= React.createRef();

      this.handleSuccess = this.handleSuccess.bind(this)
      this.handleError = this.handleError.bind(this)
      this.handleAllowanceUpdated = this.handleAllowanceUpdated.bind(this)
  }

  componentDidMount() {
    this.reload()
  } 


  reload() {
    this.loadData()
  }


  stakeUpdated = async () => {
    await this.headerRef.current.reload()
    await this.reload()
  }

  setAccountConnected = (info) => {
    console.log(">>> info", info)
    this.setState({
      accountConnected: info.account !== undefined,
      networkId: info.networkId,
      networkName: info.networkName,
    })
  }
    

  async loadData() {

    networkInfo().then( info => {
      this.setState({
          networkId: info.networkId,
          networkName: info.networkName,
          blockNumber: info.blockNumber,
          blockTimestamp: info.blockTimestamp,
      })
      return getPoolInfo()
    }).then(data => {

      this.setState({
        deposits: data.deposits,
        withdrawals: data.withdrawals,
        depositTokenBalance: data.depositTokenBalance,
        investTokenBalance: data.investTokenBalance,
        totalPortfolioValue: data.totalPortfolioValue,
        investedTokenValue: data.investedTokenValue,
        investTokenSymbol: data.investTokenSymbol,
        depositTokenSymbol: data.depositTokenSymbol,
      })
      return getBalanceUSDC()
    }).then(data => {
      this.setState({
          balanceUSDC: data.units
      })
      return getBalancePoolLP()
    }).then(data => {
        this.setState({
            balancePoolLP: data.units
        })
        return getPortfolioInfo()
    }).then(data => {
        this.setState({
          deposited: data.deposited,
          withdrawn: data.withdrawn,
          portfolioValue: data.portfolioValue,
          depositTokenSymbol: data.depositTokenSymbol,
        })
    }).catch(error => {
        this.setState({ error: error.message })
    })

  }

  loadNetworkInfo = () => {

    networkInfo().then( info => {
        console.log("loadNetworkInfo", info)
        this.setState({
            networkId: info.networkId,
            networkName: info.networkName,
            blockNumber: info.blockNumber,
            blockTimestamp: info.blockTimestamp,
        })
    }).catch((error) => {
        this.setState({ error: error.message })
    })
  }


  handleAllowanceUpdated = () => {
      console.log(">>> handleAllowanceUpdated() -- TODO")
  }


  handleSuccess = (result) => {
      this.headerRef.current.reload()
      this.reload()
      this.setState({
          showInfo: true,
          info: { 
              title: "Success!", 
              detail: JSON.stringify(result, null, 2),
          }
      })
  }


  handleError = (error, message) => {
      console.log("handleError() - error:", error, "message:", message)

      if (message) {
          this.setState({error: message, showError: true})
      } else if (error && error.message) {
          this.setState({error: error.message, showError: true})
      } else {
          const msg = JSON.stringify(error, null, 2)
          this.setState({error: `An error occurred (${msg})`, showError: true})
      }
  }

  errorDismissed = () => {
    console.log("Error dismissed!")
    this.setState({showError: false})
  }

  infoDismissed = () => {
    console.log("Info dismissed!")
    this.setState({showInfo: false})
  }

  render() {

    const { accountConnected, networkId, networkName, balanceUSDC } =  this.state
    const { deposits, withdrawals, depositTokenBalance, investTokenBalance, totalPortfolioValue, investedTokenValue } =  this.state
    const { deposited, withdrawn, portfolioValue } =  this.state
    const { depositTokenSymbol, investTokenSymbol } =  this.state

    // if (!networkId) return (
    //   <div> loading ... </div>
    // )


    if (networkId && !isSupportedNetwork(networkId)) return (
      <Page>
          <Header ref={this.headerRef} reload={() => this.reload()} setAccountConnected={info => this.setAccountConnected(info)}/>
          <div className="d-inline-block" />
          <Center> 
              <Alert variant="info" title="Network not supported" style={{textAlign: "center"}}> 
               This app is not supported on {networkName}. Please connect to Kovan or Polygon.
              </Alert>
          </Center>
      </Page>
    )


    if (networkId && !accountConnected) return (
      <Page>
          <Header ref={this.headerRef} reload={() => this.reload()} setAccountConnected={info => this.setAccountConnected(info)}/>
          <div className="d-inline-block" />
          <Center> 
              <Alert variant="info" title="No Ethereum account connected" style={{textAlign: "center"}}> 
                Please connect an account on Kovan or Polygon to use the dapp!
              </Alert>
          </Center>
      </Page>
    )


    
    return (

        <Page>

             <Header ref={this.headerRef} reload={() => this.reload()} setAccountConnected={info => this.setAccountConnected(info)}/>

             <div className="w-100 divisor" > </div>
             <Center > 
                    { this.state.error && 
                      <AlertDismissible variant="danger" title="Error" 
                            show={this.state.showError} 
                            buttonAction={() => this.errorDismissed()} > 
                              {this.state.error} 
                      </AlertDismissible> 
                    }

                    { this.state.info && 
                      <AlertDismissible variant="info" title={this.state.info.title} 
                            show={this.state.showInfo} 
                            buttonAction={() => this.infoDismissed()} > 
                              {this.state.info.detail} 
                      </AlertDismissible> 
                    }

                    <PortfolioInfoView 
                      deposited={deposited} 
                      withdrawn={withdrawn}
                      portfolioValue={portfolioValue}
                      depositTokenSymbol={depositTokenSymbol}
                    />
                    
                    <div className="w-100 divisor" > </div>

                    <DepositWithdrawView
                      balanceUSDC={balanceUSDC}
                      portfolioValue={portfolioValue}
                      handleSuccess={this.handleSuccess} 
                      handleError={this.handleError}
                      allowanceUpdated={this.handleAllowanceUpdated}
                    />

                    <div className="mt-4"></div>
                    <PoolInfoView
                        deposits={deposits} 
                        withdrawals={withdrawals} 
                        depositTokenBalance={depositTokenBalance}
                        investTokenBalance={investTokenBalance}
                        totalPortfolioValue={totalPortfolioValue}
                        investedTokenValue={investedTokenValue}
                        depositTokenSymbol={depositTokenSymbol}
                        investTokenSymbol={investTokenSymbol}
                        
                    />
 

            </Center>
        </Page>
    )
  }
}